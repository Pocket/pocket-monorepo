import DataLoader from 'dataloader';
import { UserDataService } from '../dataService/userDataService.js';
import { IContext } from '../context.js';
import { EventType } from '../events/eventType.js';
import {
  User,
  UserProfile,
  ExpireUserWebSessionReason,
} from '../types/index.js';
import { IntMask } from '@pocket-tools/int-mask';

// The Entity corresponding to GraphQL Schema
interface UserEntity {
  id: string;
  username: Promise<string | null>;
  avatarUrl: Promise<string | null>;
  name: Promise<string | null>;
  firstName: Promise<string | null>;
  lastName: Promise<string | null>;
  description: Promise<string | null>;
  email: Promise<string>;
  isPremium: Promise<boolean>;
  isFxa: Promise<boolean>;
  accountCreationDate: Promise<string | null>;
}

/**
 * Model for the User entity in User API.
 * Contains logic for resolving and updating User-related fields.
 */
export class UserModel implements UserEntity {
  private user: User = {} as User;
  private userLoader: DataLoader<string, User>;
  public userDataService: UserDataService;

  constructor(private context: IContext) {
    // Set values that might be provided directly from Client-API gateway
    if (context.headers.premium != null) {
      this.user.isPremium = context.headers.premium === 'true' ? true : false;
    }
    if (context.headers.email != null) {
      this.user.email = context.headers.email as string;
    }
    this.userDataService = new UserDataService(context, context.userId);
    this.userLoader = new DataLoader(
      async () =>
        // Context is always scoped to a single user, but need array for dataloader
        Promise.all([
          new UserDataService(context, context.userId).getUserData(),
        ]),
      // We will never be fetching another user in the same request
      { maxBatchSize: 1 },
    );
  }
  /** Shorter call to load internal user object via dataloader */
  private loadUser(): Promise<User> {
    // The dataloader only can load the userID in the context,
    // so the key is just for internal cache purposes
    return this.userLoader.load('thisUser');
  }

  /**
   * Lazily load attributes for this User. If the value is already
   * set internally, return that value. Otherwise, load the User
   * with DataLoader and return that instead.
   *
   * This allows us to:
   *   1. Prevent loading unnecessary data if it need not be fetched
   *      from the data store (e.g. when isPremium is set on headers,
   *      we don't need to query the db for premium status, or when no
   *      fields are requested for User). Since the `User` object is the
   *      entrypoint for many fields on other services, we don't want to
   *      fetch unused data each time.
   *   2. Update the internal User representation when mutations are called,
   *      and return the updated data without re-fetching.
   *      This also avoids issues with replication lag.
   *
   * @param attribute attribute/key to load
   * @returns value associated with key
   */
  private async lazyLoadAttribute<A extends keyof User>(
    attribute: A,
  ): Promise<User[A]> {
    return this.user[attribute] ?? (await this.loadUser())[attribute];
  }

  get id(): UserProfile['id'] {
    return IntMask.encode(this.context.userId);
  }
  get isPremium(): Promise<User['isPremium']> {
    return this.lazyLoadAttribute('isPremium');
  }
  get isFxa(): Promise<User['isFxa']> {
    return this.lazyLoadAttribute('isFxa');
  }
  get accountCreationDate(): Promise<User['accountCreationDate']> {
    return this.lazyLoadAttribute('accountCreationDate');
  }
  get username(): Promise<UserProfile['username']> {
    return this.lazyLoadAttribute('username');
  }
  get firstName(): Promise<User['firstName']> {
    return this.lazyLoadAttribute('firstName');
  }
  get lastName(): Promise<User['lastName']> {
    return this.lazyLoadAttribute('lastName');
  }
  get avatarUrl(): Promise<UserProfile['avatarUrl']> {
    return this.lazyLoadAttribute('avatarUrl');
  }
  get name(): Promise<UserProfile['name']> {
    return this.lazyLoadAttribute('name');
  }
  get description(): Promise<UserProfile['description']> {
    return this.lazyLoadAttribute('description');
  }
  get email(): Promise<User['email']> {
    return this.lazyLoadAttribute('email');
  }

  get premiumStatus(): Promise<User['premiumStatus']> {
    return this.lazyLoadAttribute('premiumStatus');
  }

  /** Delete this User from database */
  async delete(): Promise<string> {
    const email = await this.email;
    const isPremium = await this.isPremium;
    await this.userDataService.deletePIIUserInfo(this.context.userId);
    this.context.emitUserEvent(EventType.ACCOUNT_DELETE, {
      userId: this.context.userId,
      email,
      isPremium,
    });

    return this.context.userId;
  }

  /** Update this User's email address in database
   * @param email the new email address for the User
   * @returns UserModel
   */
  async updateEmail(email: string): Promise<UserModel> {
    const newEmail = await this.userDataService.validateEmail(email);
    await this.userDataService.updateUserEmail(newEmail, true);
    // Update the internal user model so the mutated data is reflected
    this.user.email = newEmail;

    const isPremium = await this.isPremium;
    //emit account-email-updated event via EventBridge
    this.context.emitUserEvent(EventType.ACCOUNT_EMAIL_UPDATED, {
      userId: this.context.userId,
      email: newEmail,
      isPremium,
    });

    return this;
  }

  /**
   * expire user web session tokens
   */
  async expireUserWebSession(
    reason: ExpireUserWebSessionReason,
  ): Promise<string> {
    await this.userDataService.expireUserWebSession();
    const email = await this.email;
    const isPremium = await this.isPremium;

    //emit account-password-changed event via EventBridge
    if (reason === ExpireUserWebSessionReason.PASSWORD_CHANGED) {
      this.context.emitUserEvent(EventType.ACCOUNT_PASSWORD_CHANGED, {
        userId: this.context.userId,
        email,
        isPremium,
      });
    }
    return this.context.userId;
  }
}
