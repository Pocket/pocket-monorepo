
/**
 * Client
**/

import * as runtime from './runtime/library';
type UnwrapPromise<P extends any> = P extends Promise<infer R> ? R : P
type UnwrapTuple<Tuple extends readonly unknown[]> = {
  [K in keyof Tuple]: K extends `${number}` ? Tuple[K] extends Prisma.PrismaPromise<infer X> ? X : UnwrapPromise<Tuple[K]> : UnwrapPromise<Tuple[K]>
};

export type PrismaPromise<T> = runtime.Types.Public.PrismaPromise<T>


/**
 * Model List
 * 
 */
export type List = {
  id: bigint
  externalId: string
  userId: bigint
  slug: string | null
  title: string
  description: string | null
  status: Visibility
  moderationStatus: ModerationStatus
  moderatedBy: string | null
  moderationReason: string | null
  moderationDetails: string | null
  restorationReason: string | null
  listItemNoteVisibility: Visibility
  createdAt: Date
  updatedAt: Date
}

/**
 * Model ListItem
 * 
 */
export type ListItem = {
  id: bigint
  externalId: string
  listId: bigint
  itemId: bigint
  url: string | null
  title: string | null
  excerpt: string | null
  note: string | null
  imageUrl: string | null
  publisher: string | null
  authors: string | null
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

/**
 * Model PilotUser
 * 
 */
export type PilotUser = {
  userId: bigint
  mozillaEmployee: boolean
  createdBy: string | null
  notes: string | null
  createdAt: Date
}


/**
 * Enums
 */

// Based on
// https://github.com/microsoft/TypeScript/issues/3192#issuecomment-261720275

export const Visibility: {
  PRIVATE: 'PRIVATE',
  PUBLIC: 'PUBLIC'
};

export type Visibility = (typeof Visibility)[keyof typeof Visibility]


export const ModerationStatus: {
  VISIBLE: 'VISIBLE',
  HIDDEN: 'HIDDEN'
};

export type ModerationStatus = (typeof ModerationStatus)[keyof typeof ModerationStatus]


/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Lists
 * const lists = await prisma.list.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  T extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof T ? T['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<T['log']> : never : never,
  GlobalReject extends Prisma.RejectOnNotFound | Prisma.RejectPerOperation | false | undefined = 'rejectOnNotFound' extends keyof T
    ? T['rejectOnNotFound']
    : false
      > {
    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Lists
   * const lists = await prisma.list.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<T, Prisma.PrismaClientOptions>);
  $on<V extends (U | 'beforeExit')>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : V extends 'beforeExit' ? () => Promise<void> : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): Promise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): Promise<void>;

  /**
   * Add a middleware
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): Promise<UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<this, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use">) => Promise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): Promise<R>

      /**
   * `prisma.list`: Exposes CRUD operations for the **List** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Lists
    * const lists = await prisma.list.findMany()
    * ```
    */
  get list(): Prisma.ListDelegate<GlobalReject>;

  /**
   * `prisma.listItem`: Exposes CRUD operations for the **ListItem** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ListItems
    * const listItems = await prisma.listItem.findMany()
    * ```
    */
  get listItem(): Prisma.ListItemDelegate<GlobalReject>;

  /**
   * `prisma.pilotUser`: Exposes CRUD operations for the **PilotUser** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PilotUsers
    * const pilotUsers = await prisma.pilotUser.findMany()
    * ```
    */
  get pilotUser(): Prisma.PilotUserDelegate<GlobalReject>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = runtime.Types.Public.PrismaPromise<T>

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError
  export import NotFoundError = runtime.NotFoundError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql

  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket


  /**
   * Prisma Client JS version: 4.12.0
   * Query Engine version: 4bc8b6e1b66cb932731fb1bdbbc550d1e010de81
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */

  /**
   * From https://github.com/sindresorhus/type-fest/
   * Matches a JSON object.
   * This type can be useful to enforce some input to be JSON-compatible or as a super-type to be extended from. 
   */
  export type JsonObject = {[Key in string]?: JsonValue}

  /**
   * From https://github.com/sindresorhus/type-fest/
   * Matches a JSON array.
   */
  export interface JsonArray extends Array<JsonValue> {}

  /**
   * From https://github.com/sindresorhus/type-fest/
   * Matches any valid JSON value.
   */
  export type JsonValue = string | number | boolean | JsonObject | JsonArray | null

  /**
   * Matches a JSON object.
   * Unlike `JsonObject`, this type allows undefined and read-only properties.
   */
  export type InputJsonObject = {readonly [Key in string]?: InputJsonValue | null}

  /**
   * Matches a JSON array.
   * Unlike `JsonArray`, readonly arrays are assignable to this type.
   */
  export interface InputJsonArray extends ReadonlyArray<InputJsonValue | null> {}

  /**
   * Matches any valid value that can be used as an input for operations like
   * create and update as the value of a JSON field. Unlike `JsonValue`, this
   * type allows read-only arrays and read-only object properties and disallows
   * `null` at the top level.
   *
   * `null` cannot be used as the value of a JSON field because its meaning
   * would be ambiguous. Use `Prisma.JsonNull` to store the JSON null value or
   * `Prisma.DbNull` to clear the JSON value and set the field to the database
   * NULL value instead.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-by-null-values
   */
  export type InputJsonValue = string | number | boolean | InputJsonObject | InputJsonArray

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }
  type HasSelect = {
    select: any
  }
  type HasInclude = {
    include: any
  }
  type CheckSelect<T, S, U> = T extends SelectAndInclude
    ? 'Please either choose `select` or `include`'
    : T extends HasSelect
    ? U
    : T extends HasInclude
    ? U
    : S

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => Promise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;

  export function validator<V>(): <S>(select: runtime.Types.Utils.LegacyExact<S, V>) => S;

  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but with an array
   */
  type PickArray<T, K extends Array<keyof T>> = Prisma__Pick<T, TupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    List: 'List',
    ListItem: 'ListItem',
    PilotUser: 'PilotUser'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  export type DefaultPrismaClient = PrismaClient
  export type RejectOnNotFound = boolean | ((error: Error) => Error)
  export type RejectPerModel = { [P in ModelName]?: RejectOnNotFound }
  export type RejectPerOperation =  { [P in "findUnique" | "findFirst"]?: RejectPerModel | RejectOnNotFound } 
  type IsReject<T> = T extends true ? True : T extends (err: Error) => Error ? True : False
  export type HasReject<
    GlobalRejectSettings extends Prisma.PrismaClientOptions['rejectOnNotFound'],
    LocalRejectSettings,
    Action extends PrismaAction,
    Model extends ModelName
  > = LocalRejectSettings extends RejectOnNotFound
    ? IsReject<LocalRejectSettings>
    : GlobalRejectSettings extends RejectPerOperation
    ? Action extends keyof GlobalRejectSettings
      ? GlobalRejectSettings[Action] extends RejectOnNotFound
        ? IsReject<GlobalRejectSettings[Action]>
        : GlobalRejectSettings[Action] extends RejectPerModel
        ? Model extends keyof GlobalRejectSettings[Action]
          ? IsReject<GlobalRejectSettings[Action][Model]>
          : False
        : False
      : False
    : IsReject<GlobalRejectSettings>
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'

  export interface PrismaClientOptions {
    /**
     * Configure findUnique/findFirst to throw an error if the query returns null. 
     * @deprecated since 4.0.0. Use `findUniqueOrThrow`/`findFirstOrThrow` methods instead.
     * @example
     * ```
     * // Reject on both findUnique/findFirst
     * rejectOnNotFound: true
     * // Reject only on findFirst with a custom error
     * rejectOnNotFound: { findFirst: (err) => new Error("Custom Error")}
     * // Reject on user.findUnique with a custom error
     * rejectOnNotFound: { findUnique: {User: (err) => new Error("User not found")}}
     * ```
     */
    rejectOnNotFound?: RejectOnNotFound | RejectPerOperation
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources

    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat

    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: Array<LogLevel | LogDefinition>
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findMany'
    | 'findFirst'
    | 'create'
    | 'createMany'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => Promise<T>,
  ) => Promise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type ListCountOutputType
   */


  export type ListCountOutputType = {
    listItems: number
  }

  export type ListCountOutputTypeSelect = {
    listItems?: boolean | ListCountOutputTypeCountListItemsArgs
  }

  export type ListCountOutputTypeGetPayload<S extends boolean | null | undefined | ListCountOutputTypeArgs> =
    S extends { select: any, include: any } ? 'Please either choose `select` or `include`' :
    S extends true ? ListCountOutputType :
    S extends undefined ? never :
    S extends { include: any } & (ListCountOutputTypeArgs)
    ? ListCountOutputType 
    : S extends { select: any } & (ListCountOutputTypeArgs)
      ? {
    [P in TruthyKeys<S['select']>]:
    P extends keyof ListCountOutputType ? ListCountOutputType[P] : never
  } 
      : ListCountOutputType




  // Custom InputTypes

  /**
   * ListCountOutputType without action
   */
  export type ListCountOutputTypeArgs = {
    /**
     * Select specific fields to fetch from the ListCountOutputType
     */
    select?: ListCountOutputTypeSelect | null
  }


  /**
   * ListCountOutputType without action
   */
  export type ListCountOutputTypeCountListItemsArgs = {
    where?: ListItemWhereInput
  }



  /**
   * Models
   */

  /**
   * Model List
   */


  export type AggregateList = {
    _count: ListCountAggregateOutputType | null
    _avg: ListAvgAggregateOutputType | null
    _sum: ListSumAggregateOutputType | null
    _min: ListMinAggregateOutputType | null
    _max: ListMaxAggregateOutputType | null
  }

  export type ListAvgAggregateOutputType = {
    id: number | null
    userId: number | null
  }

  export type ListSumAggregateOutputType = {
    id: bigint | null
    userId: bigint | null
  }

  export type ListMinAggregateOutputType = {
    id: bigint | null
    externalId: string | null
    userId: bigint | null
    slug: string | null
    title: string | null
    description: string | null
    status: Visibility | null
    moderationStatus: ModerationStatus | null
    moderatedBy: string | null
    moderationReason: string | null
    moderationDetails: string | null
    restorationReason: string | null
    listItemNoteVisibility: Visibility | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ListMaxAggregateOutputType = {
    id: bigint | null
    externalId: string | null
    userId: bigint | null
    slug: string | null
    title: string | null
    description: string | null
    status: Visibility | null
    moderationStatus: ModerationStatus | null
    moderatedBy: string | null
    moderationReason: string | null
    moderationDetails: string | null
    restorationReason: string | null
    listItemNoteVisibility: Visibility | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ListCountAggregateOutputType = {
    id: number
    externalId: number
    userId: number
    slug: number
    title: number
    description: number
    status: number
    moderationStatus: number
    moderatedBy: number
    moderationReason: number
    moderationDetails: number
    restorationReason: number
    listItemNoteVisibility: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ListAvgAggregateInputType = {
    id?: true
    userId?: true
  }

  export type ListSumAggregateInputType = {
    id?: true
    userId?: true
  }

  export type ListMinAggregateInputType = {
    id?: true
    externalId?: true
    userId?: true
    slug?: true
    title?: true
    description?: true
    status?: true
    moderationStatus?: true
    moderatedBy?: true
    moderationReason?: true
    moderationDetails?: true
    restorationReason?: true
    listItemNoteVisibility?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ListMaxAggregateInputType = {
    id?: true
    externalId?: true
    userId?: true
    slug?: true
    title?: true
    description?: true
    status?: true
    moderationStatus?: true
    moderatedBy?: true
    moderationReason?: true
    moderationDetails?: true
    restorationReason?: true
    listItemNoteVisibility?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ListCountAggregateInputType = {
    id?: true
    externalId?: true
    userId?: true
    slug?: true
    title?: true
    description?: true
    status?: true
    moderationStatus?: true
    moderatedBy?: true
    moderationReason?: true
    moderationDetails?: true
    restorationReason?: true
    listItemNoteVisibility?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ListAggregateArgs = {
    /**
     * Filter which List to aggregate.
     */
    where?: ListWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Lists to fetch.
     */
    orderBy?: Enumerable<ListOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ListWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Lists from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Lists.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Lists
    **/
    _count?: true | ListCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ListAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ListSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ListMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ListMaxAggregateInputType
  }

  export type GetListAggregateType<T extends ListAggregateArgs> = {
        [P in keyof T & keyof AggregateList]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateList[P]>
      : GetScalarType<T[P], AggregateList[P]>
  }




  export type ListGroupByArgs = {
    where?: ListWhereInput
    orderBy?: Enumerable<ListOrderByWithAggregationInput>
    by: ListScalarFieldEnum[]
    having?: ListScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ListCountAggregateInputType | true
    _avg?: ListAvgAggregateInputType
    _sum?: ListSumAggregateInputType
    _min?: ListMinAggregateInputType
    _max?: ListMaxAggregateInputType
  }


  export type ListGroupByOutputType = {
    id: bigint
    externalId: string
    userId: bigint
    slug: string | null
    title: string
    description: string | null
    status: Visibility
    moderationStatus: ModerationStatus
    moderatedBy: string | null
    moderationReason: string | null
    moderationDetails: string | null
    restorationReason: string | null
    listItemNoteVisibility: Visibility
    createdAt: Date
    updatedAt: Date
    _count: ListCountAggregateOutputType | null
    _avg: ListAvgAggregateOutputType | null
    _sum: ListSumAggregateOutputType | null
    _min: ListMinAggregateOutputType | null
    _max: ListMaxAggregateOutputType | null
  }

  type GetListGroupByPayload<T extends ListGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickArray<ListGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ListGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ListGroupByOutputType[P]>
            : GetScalarType<T[P], ListGroupByOutputType[P]>
        }
      >
    >


  export type ListSelect = {
    id?: boolean
    externalId?: boolean
    userId?: boolean
    slug?: boolean
    title?: boolean
    description?: boolean
    status?: boolean
    moderationStatus?: boolean
    moderatedBy?: boolean
    moderationReason?: boolean
    moderationDetails?: boolean
    restorationReason?: boolean
    listItemNoteVisibility?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    listItems?: boolean | List$listItemsArgs
    _count?: boolean | ListCountOutputTypeArgs
  }


  export type ListInclude = {
    listItems?: boolean | List$listItemsArgs
    _count?: boolean | ListCountOutputTypeArgs
  }

  export type ListGetPayload<S extends boolean | null | undefined | ListArgs> =
    S extends { select: any, include: any } ? 'Please either choose `select` or `include`' :
    S extends true ? List :
    S extends undefined ? never :
    S extends { include: any } & (ListArgs | ListFindManyArgs)
    ? List  & {
    [P in TruthyKeys<S['include']>]:
        P extends 'listItems' ? Array < ListItemGetPayload<S['include'][P]>>  :
        P extends '_count' ? ListCountOutputTypeGetPayload<S['include'][P]> :  never
  } 
    : S extends { select: any } & (ListArgs | ListFindManyArgs)
      ? {
    [P in TruthyKeys<S['select']>]:
        P extends 'listItems' ? Array < ListItemGetPayload<S['select'][P]>>  :
        P extends '_count' ? ListCountOutputTypeGetPayload<S['select'][P]> :  P extends keyof List ? List[P] : never
  } 
      : List


  type ListCountArgs = 
    Omit<ListFindManyArgs, 'select' | 'include'> & {
      select?: ListCountAggregateInputType | true
    }

  export interface ListDelegate<GlobalRejectSettings extends Prisma.RejectOnNotFound | Prisma.RejectPerOperation | false | undefined> {

    /**
     * Find zero or one List that matches the filter.
     * @param {ListFindUniqueArgs} args - Arguments to find a List
     * @example
     * // Get one List
     * const list = await prisma.list.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends ListFindUniqueArgs,  LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args: SelectSubset<T, ListFindUniqueArgs>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findUnique', 'List'> extends True ? Prisma__ListClient<ListGetPayload<T>> : Prisma__ListClient<ListGetPayload<T> | null, null>

    /**
     * Find one List that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {ListFindUniqueOrThrowArgs} args - Arguments to find a List
     * @example
     * // Get one List
     * const list = await prisma.list.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends ListFindUniqueOrThrowArgs>(
      args?: SelectSubset<T, ListFindUniqueOrThrowArgs>
    ): Prisma__ListClient<ListGetPayload<T>>

    /**
     * Find the first List that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListFindFirstArgs} args - Arguments to find a List
     * @example
     * // Get one List
     * const list = await prisma.list.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends ListFindFirstArgs,  LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args?: SelectSubset<T, ListFindFirstArgs>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findFirst', 'List'> extends True ? Prisma__ListClient<ListGetPayload<T>> : Prisma__ListClient<ListGetPayload<T> | null, null>

    /**
     * Find the first List that matches the filter or
     * throw `NotFoundError` if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListFindFirstOrThrowArgs} args - Arguments to find a List
     * @example
     * // Get one List
     * const list = await prisma.list.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends ListFindFirstOrThrowArgs>(
      args?: SelectSubset<T, ListFindFirstOrThrowArgs>
    ): Prisma__ListClient<ListGetPayload<T>>

    /**
     * Find zero or more Lists that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Lists
     * const lists = await prisma.list.findMany()
     * 
     * // Get first 10 Lists
     * const lists = await prisma.list.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const listWithIdOnly = await prisma.list.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends ListFindManyArgs>(
      args?: SelectSubset<T, ListFindManyArgs>
    ): Prisma.PrismaPromise<Array<ListGetPayload<T>>>

    /**
     * Create a List.
     * @param {ListCreateArgs} args - Arguments to create a List.
     * @example
     * // Create one List
     * const List = await prisma.list.create({
     *   data: {
     *     // ... data to create a List
     *   }
     * })
     * 
    **/
    create<T extends ListCreateArgs>(
      args: SelectSubset<T, ListCreateArgs>
    ): Prisma__ListClient<ListGetPayload<T>>

    /**
     * Create many Lists.
     *     @param {ListCreateManyArgs} args - Arguments to create many Lists.
     *     @example
     *     // Create many Lists
     *     const list = await prisma.list.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends ListCreateManyArgs>(
      args?: SelectSubset<T, ListCreateManyArgs>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a List.
     * @param {ListDeleteArgs} args - Arguments to delete one List.
     * @example
     * // Delete one List
     * const List = await prisma.list.delete({
     *   where: {
     *     // ... filter to delete one List
     *   }
     * })
     * 
    **/
    delete<T extends ListDeleteArgs>(
      args: SelectSubset<T, ListDeleteArgs>
    ): Prisma__ListClient<ListGetPayload<T>>

    /**
     * Update one List.
     * @param {ListUpdateArgs} args - Arguments to update one List.
     * @example
     * // Update one List
     * const list = await prisma.list.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends ListUpdateArgs>(
      args: SelectSubset<T, ListUpdateArgs>
    ): Prisma__ListClient<ListGetPayload<T>>

    /**
     * Delete zero or more Lists.
     * @param {ListDeleteManyArgs} args - Arguments to filter Lists to delete.
     * @example
     * // Delete a few Lists
     * const { count } = await prisma.list.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends ListDeleteManyArgs>(
      args?: SelectSubset<T, ListDeleteManyArgs>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Lists.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Lists
     * const list = await prisma.list.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends ListUpdateManyArgs>(
      args: SelectSubset<T, ListUpdateManyArgs>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one List.
     * @param {ListUpsertArgs} args - Arguments to update or create a List.
     * @example
     * // Update or create a List
     * const list = await prisma.list.upsert({
     *   create: {
     *     // ... data to create a List
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the List we want to update
     *   }
     * })
    **/
    upsert<T extends ListUpsertArgs>(
      args: SelectSubset<T, ListUpsertArgs>
    ): Prisma__ListClient<ListGetPayload<T>>

    /**
     * Count the number of Lists.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListCountArgs} args - Arguments to filter Lists to count.
     * @example
     * // Count the number of Lists
     * const count = await prisma.list.count({
     *   where: {
     *     // ... the filter for the Lists we want to count
     *   }
     * })
    **/
    count<T extends ListCountArgs>(
      args?: Subset<T, ListCountArgs>,
    ): Prisma.PrismaPromise<
      T extends _Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ListCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a List.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ListAggregateArgs>(args: Subset<T, ListAggregateArgs>): Prisma.PrismaPromise<GetListAggregateType<T>>

    /**
     * Group by List.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ListGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ListGroupByArgs['orderBy'] }
        : { orderBy?: ListGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends TupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ListGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetListGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>

  }

  /**
   * The delegate class that acts as a "Promise-like" for List.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export class Prisma__ListClient<T, Null = never> implements Prisma.PrismaPromise<T> {
    private readonly _dmmf;
    private readonly _queryType;
    private readonly _rootField;
    private readonly _clientMethod;
    private readonly _args;
    private readonly _dataPath;
    private readonly _errorFormat;
    private readonly _measurePerformance?;
    private _isList;
    private _callsite;
    private _requestPromise?;
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    constructor(_dmmf: runtime.DMMFClass, _queryType: 'query' | 'mutation', _rootField: string, _clientMethod: string, _args: any, _dataPath: string[], _errorFormat: ErrorFormat, _measurePerformance?: boolean | undefined, _isList?: boolean);

    listItems<T extends List$listItemsArgs= {}>(args?: Subset<T, List$listItemsArgs>): Prisma.PrismaPromise<Array<ListItemGetPayload<T>>| Null>;

    private get _document();
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): Promise<T>;
  }



  // Custom InputTypes

  /**
   * List base type for findUnique actions
   */
  export type ListFindUniqueArgsBase = {
    /**
     * Select specific fields to fetch from the List
     */
    select?: ListSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ListInclude | null
    /**
     * Filter, which List to fetch.
     */
    where: ListWhereUniqueInput
  }

  /**
   * List findUnique
   */
  export interface ListFindUniqueArgs extends ListFindUniqueArgsBase {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findUniqueOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * List findUniqueOrThrow
   */
  export type ListFindUniqueOrThrowArgs = {
    /**
     * Select specific fields to fetch from the List
     */
    select?: ListSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ListInclude | null
    /**
     * Filter, which List to fetch.
     */
    where: ListWhereUniqueInput
  }


  /**
   * List base type for findFirst actions
   */
  export type ListFindFirstArgsBase = {
    /**
     * Select specific fields to fetch from the List
     */
    select?: ListSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ListInclude | null
    /**
     * Filter, which List to fetch.
     */
    where?: ListWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Lists to fetch.
     */
    orderBy?: Enumerable<ListOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Lists.
     */
    cursor?: ListWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Lists from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Lists.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Lists.
     */
    distinct?: Enumerable<ListScalarFieldEnum>
  }

  /**
   * List findFirst
   */
  export interface ListFindFirstArgs extends ListFindFirstArgsBase {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findFirstOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * List findFirstOrThrow
   */
  export type ListFindFirstOrThrowArgs = {
    /**
     * Select specific fields to fetch from the List
     */
    select?: ListSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ListInclude | null
    /**
     * Filter, which List to fetch.
     */
    where?: ListWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Lists to fetch.
     */
    orderBy?: Enumerable<ListOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Lists.
     */
    cursor?: ListWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Lists from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Lists.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Lists.
     */
    distinct?: Enumerable<ListScalarFieldEnum>
  }


  /**
   * List findMany
   */
  export type ListFindManyArgs = {
    /**
     * Select specific fields to fetch from the List
     */
    select?: ListSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ListInclude | null
    /**
     * Filter, which Lists to fetch.
     */
    where?: ListWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Lists to fetch.
     */
    orderBy?: Enumerable<ListOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Lists.
     */
    cursor?: ListWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Lists from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Lists.
     */
    skip?: number
    distinct?: Enumerable<ListScalarFieldEnum>
  }


  /**
   * List create
   */
  export type ListCreateArgs = {
    /**
     * Select specific fields to fetch from the List
     */
    select?: ListSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ListInclude | null
    /**
     * The data needed to create a List.
     */
    data: XOR<ListCreateInput, ListUncheckedCreateInput>
  }


  /**
   * List createMany
   */
  export type ListCreateManyArgs = {
    /**
     * The data used to create many Lists.
     */
    data: Enumerable<ListCreateManyInput>
    skipDuplicates?: boolean
  }


  /**
   * List update
   */
  export type ListUpdateArgs = {
    /**
     * Select specific fields to fetch from the List
     */
    select?: ListSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ListInclude | null
    /**
     * The data needed to update a List.
     */
    data: XOR<ListUpdateInput, ListUncheckedUpdateInput>
    /**
     * Choose, which List to update.
     */
    where: ListWhereUniqueInput
  }


  /**
   * List updateMany
   */
  export type ListUpdateManyArgs = {
    /**
     * The data used to update Lists.
     */
    data: XOR<ListUpdateManyMutationInput, ListUncheckedUpdateManyInput>
    /**
     * Filter which Lists to update
     */
    where?: ListWhereInput
  }


  /**
   * List upsert
   */
  export type ListUpsertArgs = {
    /**
     * Select specific fields to fetch from the List
     */
    select?: ListSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ListInclude | null
    /**
     * The filter to search for the List to update in case it exists.
     */
    where: ListWhereUniqueInput
    /**
     * In case the List found by the `where` argument doesn't exist, create a new List with this data.
     */
    create: XOR<ListCreateInput, ListUncheckedCreateInput>
    /**
     * In case the List was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ListUpdateInput, ListUncheckedUpdateInput>
  }


  /**
   * List delete
   */
  export type ListDeleteArgs = {
    /**
     * Select specific fields to fetch from the List
     */
    select?: ListSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ListInclude | null
    /**
     * Filter which List to delete.
     */
    where: ListWhereUniqueInput
  }


  /**
   * List deleteMany
   */
  export type ListDeleteManyArgs = {
    /**
     * Filter which Lists to delete
     */
    where?: ListWhereInput
  }


  /**
   * List.listItems
   */
  export type List$listItemsArgs = {
    /**
     * Select specific fields to fetch from the ListItem
     */
    select?: ListItemSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ListItemInclude | null
    where?: ListItemWhereInput
    orderBy?: Enumerable<ListItemOrderByWithRelationInput>
    cursor?: ListItemWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Enumerable<ListItemScalarFieldEnum>
  }


  /**
   * List without action
   */
  export type ListArgs = {
    /**
     * Select specific fields to fetch from the List
     */
    select?: ListSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ListInclude | null
  }



  /**
   * Model ListItem
   */


  export type AggregateListItem = {
    _count: ListItemCountAggregateOutputType | null
    _avg: ListItemAvgAggregateOutputType | null
    _sum: ListItemSumAggregateOutputType | null
    _min: ListItemMinAggregateOutputType | null
    _max: ListItemMaxAggregateOutputType | null
  }

  export type ListItemAvgAggregateOutputType = {
    id: number | null
    listId: number | null
    itemId: number | null
    sortOrder: number | null
  }

  export type ListItemSumAggregateOutputType = {
    id: bigint | null
    listId: bigint | null
    itemId: bigint | null
    sortOrder: number | null
  }

  export type ListItemMinAggregateOutputType = {
    id: bigint | null
    externalId: string | null
    listId: bigint | null
    itemId: bigint | null
    url: string | null
    title: string | null
    excerpt: string | null
    note: string | null
    imageUrl: string | null
    publisher: string | null
    authors: string | null
    sortOrder: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ListItemMaxAggregateOutputType = {
    id: bigint | null
    externalId: string | null
    listId: bigint | null
    itemId: bigint | null
    url: string | null
    title: string | null
    excerpt: string | null
    note: string | null
    imageUrl: string | null
    publisher: string | null
    authors: string | null
    sortOrder: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ListItemCountAggregateOutputType = {
    id: number
    externalId: number
    listId: number
    itemId: number
    url: number
    title: number
    excerpt: number
    note: number
    imageUrl: number
    publisher: number
    authors: number
    sortOrder: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ListItemAvgAggregateInputType = {
    id?: true
    listId?: true
    itemId?: true
    sortOrder?: true
  }

  export type ListItemSumAggregateInputType = {
    id?: true
    listId?: true
    itemId?: true
    sortOrder?: true
  }

  export type ListItemMinAggregateInputType = {
    id?: true
    externalId?: true
    listId?: true
    itemId?: true
    url?: true
    title?: true
    excerpt?: true
    note?: true
    imageUrl?: true
    publisher?: true
    authors?: true
    sortOrder?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ListItemMaxAggregateInputType = {
    id?: true
    externalId?: true
    listId?: true
    itemId?: true
    url?: true
    title?: true
    excerpt?: true
    note?: true
    imageUrl?: true
    publisher?: true
    authors?: true
    sortOrder?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ListItemCountAggregateInputType = {
    id?: true
    externalId?: true
    listId?: true
    itemId?: true
    url?: true
    title?: true
    excerpt?: true
    note?: true
    imageUrl?: true
    publisher?: true
    authors?: true
    sortOrder?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ListItemAggregateArgs = {
    /**
     * Filter which ListItem to aggregate.
     */
    where?: ListItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ListItems to fetch.
     */
    orderBy?: Enumerable<ListItemOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ListItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ListItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ListItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ListItems
    **/
    _count?: true | ListItemCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ListItemAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ListItemSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ListItemMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ListItemMaxAggregateInputType
  }

  export type GetListItemAggregateType<T extends ListItemAggregateArgs> = {
        [P in keyof T & keyof AggregateListItem]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateListItem[P]>
      : GetScalarType<T[P], AggregateListItem[P]>
  }




  export type ListItemGroupByArgs = {
    where?: ListItemWhereInput
    orderBy?: Enumerable<ListItemOrderByWithAggregationInput>
    by: ListItemScalarFieldEnum[]
    having?: ListItemScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ListItemCountAggregateInputType | true
    _avg?: ListItemAvgAggregateInputType
    _sum?: ListItemSumAggregateInputType
    _min?: ListItemMinAggregateInputType
    _max?: ListItemMaxAggregateInputType
  }


  export type ListItemGroupByOutputType = {
    id: bigint
    externalId: string
    listId: bigint
    itemId: bigint
    url: string | null
    title: string | null
    excerpt: string | null
    note: string | null
    imageUrl: string | null
    publisher: string | null
    authors: string | null
    sortOrder: number
    createdAt: Date
    updatedAt: Date
    _count: ListItemCountAggregateOutputType | null
    _avg: ListItemAvgAggregateOutputType | null
    _sum: ListItemSumAggregateOutputType | null
    _min: ListItemMinAggregateOutputType | null
    _max: ListItemMaxAggregateOutputType | null
  }

  type GetListItemGroupByPayload<T extends ListItemGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickArray<ListItemGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ListItemGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ListItemGroupByOutputType[P]>
            : GetScalarType<T[P], ListItemGroupByOutputType[P]>
        }
      >
    >


  export type ListItemSelect = {
    id?: boolean
    externalId?: boolean
    listId?: boolean
    itemId?: boolean
    url?: boolean
    title?: boolean
    excerpt?: boolean
    note?: boolean
    imageUrl?: boolean
    publisher?: boolean
    authors?: boolean
    sortOrder?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    list?: boolean | ListArgs
  }


  export type ListItemInclude = {
    list?: boolean | ListArgs
  }

  export type ListItemGetPayload<S extends boolean | null | undefined | ListItemArgs> =
    S extends { select: any, include: any } ? 'Please either choose `select` or `include`' :
    S extends true ? ListItem :
    S extends undefined ? never :
    S extends { include: any } & (ListItemArgs | ListItemFindManyArgs)
    ? ListItem  & {
    [P in TruthyKeys<S['include']>]:
        P extends 'list' ? ListGetPayload<S['include'][P]> :  never
  } 
    : S extends { select: any } & (ListItemArgs | ListItemFindManyArgs)
      ? {
    [P in TruthyKeys<S['select']>]:
        P extends 'list' ? ListGetPayload<S['select'][P]> :  P extends keyof ListItem ? ListItem[P] : never
  } 
      : ListItem


  type ListItemCountArgs = 
    Omit<ListItemFindManyArgs, 'select' | 'include'> & {
      select?: ListItemCountAggregateInputType | true
    }

  export interface ListItemDelegate<GlobalRejectSettings extends Prisma.RejectOnNotFound | Prisma.RejectPerOperation | false | undefined> {

    /**
     * Find zero or one ListItem that matches the filter.
     * @param {ListItemFindUniqueArgs} args - Arguments to find a ListItem
     * @example
     * // Get one ListItem
     * const listItem = await prisma.listItem.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends ListItemFindUniqueArgs,  LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args: SelectSubset<T, ListItemFindUniqueArgs>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findUnique', 'ListItem'> extends True ? Prisma__ListItemClient<ListItemGetPayload<T>> : Prisma__ListItemClient<ListItemGetPayload<T> | null, null>

    /**
     * Find one ListItem that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {ListItemFindUniqueOrThrowArgs} args - Arguments to find a ListItem
     * @example
     * // Get one ListItem
     * const listItem = await prisma.listItem.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends ListItemFindUniqueOrThrowArgs>(
      args?: SelectSubset<T, ListItemFindUniqueOrThrowArgs>
    ): Prisma__ListItemClient<ListItemGetPayload<T>>

    /**
     * Find the first ListItem that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListItemFindFirstArgs} args - Arguments to find a ListItem
     * @example
     * // Get one ListItem
     * const listItem = await prisma.listItem.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends ListItemFindFirstArgs,  LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args?: SelectSubset<T, ListItemFindFirstArgs>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findFirst', 'ListItem'> extends True ? Prisma__ListItemClient<ListItemGetPayload<T>> : Prisma__ListItemClient<ListItemGetPayload<T> | null, null>

    /**
     * Find the first ListItem that matches the filter or
     * throw `NotFoundError` if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListItemFindFirstOrThrowArgs} args - Arguments to find a ListItem
     * @example
     * // Get one ListItem
     * const listItem = await prisma.listItem.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends ListItemFindFirstOrThrowArgs>(
      args?: SelectSubset<T, ListItemFindFirstOrThrowArgs>
    ): Prisma__ListItemClient<ListItemGetPayload<T>>

    /**
     * Find zero or more ListItems that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListItemFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ListItems
     * const listItems = await prisma.listItem.findMany()
     * 
     * // Get first 10 ListItems
     * const listItems = await prisma.listItem.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const listItemWithIdOnly = await prisma.listItem.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends ListItemFindManyArgs>(
      args?: SelectSubset<T, ListItemFindManyArgs>
    ): Prisma.PrismaPromise<Array<ListItemGetPayload<T>>>

    /**
     * Create a ListItem.
     * @param {ListItemCreateArgs} args - Arguments to create a ListItem.
     * @example
     * // Create one ListItem
     * const ListItem = await prisma.listItem.create({
     *   data: {
     *     // ... data to create a ListItem
     *   }
     * })
     * 
    **/
    create<T extends ListItemCreateArgs>(
      args: SelectSubset<T, ListItemCreateArgs>
    ): Prisma__ListItemClient<ListItemGetPayload<T>>

    /**
     * Create many ListItems.
     *     @param {ListItemCreateManyArgs} args - Arguments to create many ListItems.
     *     @example
     *     // Create many ListItems
     *     const listItem = await prisma.listItem.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends ListItemCreateManyArgs>(
      args?: SelectSubset<T, ListItemCreateManyArgs>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a ListItem.
     * @param {ListItemDeleteArgs} args - Arguments to delete one ListItem.
     * @example
     * // Delete one ListItem
     * const ListItem = await prisma.listItem.delete({
     *   where: {
     *     // ... filter to delete one ListItem
     *   }
     * })
     * 
    **/
    delete<T extends ListItemDeleteArgs>(
      args: SelectSubset<T, ListItemDeleteArgs>
    ): Prisma__ListItemClient<ListItemGetPayload<T>>

    /**
     * Update one ListItem.
     * @param {ListItemUpdateArgs} args - Arguments to update one ListItem.
     * @example
     * // Update one ListItem
     * const listItem = await prisma.listItem.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends ListItemUpdateArgs>(
      args: SelectSubset<T, ListItemUpdateArgs>
    ): Prisma__ListItemClient<ListItemGetPayload<T>>

    /**
     * Delete zero or more ListItems.
     * @param {ListItemDeleteManyArgs} args - Arguments to filter ListItems to delete.
     * @example
     * // Delete a few ListItems
     * const { count } = await prisma.listItem.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends ListItemDeleteManyArgs>(
      args?: SelectSubset<T, ListItemDeleteManyArgs>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ListItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListItemUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ListItems
     * const listItem = await prisma.listItem.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends ListItemUpdateManyArgs>(
      args: SelectSubset<T, ListItemUpdateManyArgs>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ListItem.
     * @param {ListItemUpsertArgs} args - Arguments to update or create a ListItem.
     * @example
     * // Update or create a ListItem
     * const listItem = await prisma.listItem.upsert({
     *   create: {
     *     // ... data to create a ListItem
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ListItem we want to update
     *   }
     * })
    **/
    upsert<T extends ListItemUpsertArgs>(
      args: SelectSubset<T, ListItemUpsertArgs>
    ): Prisma__ListItemClient<ListItemGetPayload<T>>

    /**
     * Count the number of ListItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListItemCountArgs} args - Arguments to filter ListItems to count.
     * @example
     * // Count the number of ListItems
     * const count = await prisma.listItem.count({
     *   where: {
     *     // ... the filter for the ListItems we want to count
     *   }
     * })
    **/
    count<T extends ListItemCountArgs>(
      args?: Subset<T, ListItemCountArgs>,
    ): Prisma.PrismaPromise<
      T extends _Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ListItemCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ListItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListItemAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ListItemAggregateArgs>(args: Subset<T, ListItemAggregateArgs>): Prisma.PrismaPromise<GetListItemAggregateType<T>>

    /**
     * Group by ListItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListItemGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ListItemGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ListItemGroupByArgs['orderBy'] }
        : { orderBy?: ListItemGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends TupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ListItemGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetListItemGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>

  }

  /**
   * The delegate class that acts as a "Promise-like" for ListItem.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export class Prisma__ListItemClient<T, Null = never> implements Prisma.PrismaPromise<T> {
    private readonly _dmmf;
    private readonly _queryType;
    private readonly _rootField;
    private readonly _clientMethod;
    private readonly _args;
    private readonly _dataPath;
    private readonly _errorFormat;
    private readonly _measurePerformance?;
    private _isList;
    private _callsite;
    private _requestPromise?;
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    constructor(_dmmf: runtime.DMMFClass, _queryType: 'query' | 'mutation', _rootField: string, _clientMethod: string, _args: any, _dataPath: string[], _errorFormat: ErrorFormat, _measurePerformance?: boolean | undefined, _isList?: boolean);

    list<T extends ListArgs= {}>(args?: Subset<T, ListArgs>): Prisma__ListClient<ListGetPayload<T> | Null>;

    private get _document();
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): Promise<T>;
  }



  // Custom InputTypes

  /**
   * ListItem base type for findUnique actions
   */
  export type ListItemFindUniqueArgsBase = {
    /**
     * Select specific fields to fetch from the ListItem
     */
    select?: ListItemSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ListItemInclude | null
    /**
     * Filter, which ListItem to fetch.
     */
    where: ListItemWhereUniqueInput
  }

  /**
   * ListItem findUnique
   */
  export interface ListItemFindUniqueArgs extends ListItemFindUniqueArgsBase {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findUniqueOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * ListItem findUniqueOrThrow
   */
  export type ListItemFindUniqueOrThrowArgs = {
    /**
     * Select specific fields to fetch from the ListItem
     */
    select?: ListItemSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ListItemInclude | null
    /**
     * Filter, which ListItem to fetch.
     */
    where: ListItemWhereUniqueInput
  }


  /**
   * ListItem base type for findFirst actions
   */
  export type ListItemFindFirstArgsBase = {
    /**
     * Select specific fields to fetch from the ListItem
     */
    select?: ListItemSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ListItemInclude | null
    /**
     * Filter, which ListItem to fetch.
     */
    where?: ListItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ListItems to fetch.
     */
    orderBy?: Enumerable<ListItemOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ListItems.
     */
    cursor?: ListItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ListItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ListItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ListItems.
     */
    distinct?: Enumerable<ListItemScalarFieldEnum>
  }

  /**
   * ListItem findFirst
   */
  export interface ListItemFindFirstArgs extends ListItemFindFirstArgsBase {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findFirstOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * ListItem findFirstOrThrow
   */
  export type ListItemFindFirstOrThrowArgs = {
    /**
     * Select specific fields to fetch from the ListItem
     */
    select?: ListItemSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ListItemInclude | null
    /**
     * Filter, which ListItem to fetch.
     */
    where?: ListItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ListItems to fetch.
     */
    orderBy?: Enumerable<ListItemOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ListItems.
     */
    cursor?: ListItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ListItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ListItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ListItems.
     */
    distinct?: Enumerable<ListItemScalarFieldEnum>
  }


  /**
   * ListItem findMany
   */
  export type ListItemFindManyArgs = {
    /**
     * Select specific fields to fetch from the ListItem
     */
    select?: ListItemSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ListItemInclude | null
    /**
     * Filter, which ListItems to fetch.
     */
    where?: ListItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ListItems to fetch.
     */
    orderBy?: Enumerable<ListItemOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ListItems.
     */
    cursor?: ListItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ListItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ListItems.
     */
    skip?: number
    distinct?: Enumerable<ListItemScalarFieldEnum>
  }


  /**
   * ListItem create
   */
  export type ListItemCreateArgs = {
    /**
     * Select specific fields to fetch from the ListItem
     */
    select?: ListItemSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ListItemInclude | null
    /**
     * The data needed to create a ListItem.
     */
    data: XOR<ListItemCreateInput, ListItemUncheckedCreateInput>
  }


  /**
   * ListItem createMany
   */
  export type ListItemCreateManyArgs = {
    /**
     * The data used to create many ListItems.
     */
    data: Enumerable<ListItemCreateManyInput>
    skipDuplicates?: boolean
  }


  /**
   * ListItem update
   */
  export type ListItemUpdateArgs = {
    /**
     * Select specific fields to fetch from the ListItem
     */
    select?: ListItemSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ListItemInclude | null
    /**
     * The data needed to update a ListItem.
     */
    data: XOR<ListItemUpdateInput, ListItemUncheckedUpdateInput>
    /**
     * Choose, which ListItem to update.
     */
    where: ListItemWhereUniqueInput
  }


  /**
   * ListItem updateMany
   */
  export type ListItemUpdateManyArgs = {
    /**
     * The data used to update ListItems.
     */
    data: XOR<ListItemUpdateManyMutationInput, ListItemUncheckedUpdateManyInput>
    /**
     * Filter which ListItems to update
     */
    where?: ListItemWhereInput
  }


  /**
   * ListItem upsert
   */
  export type ListItemUpsertArgs = {
    /**
     * Select specific fields to fetch from the ListItem
     */
    select?: ListItemSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ListItemInclude | null
    /**
     * The filter to search for the ListItem to update in case it exists.
     */
    where: ListItemWhereUniqueInput
    /**
     * In case the ListItem found by the `where` argument doesn't exist, create a new ListItem with this data.
     */
    create: XOR<ListItemCreateInput, ListItemUncheckedCreateInput>
    /**
     * In case the ListItem was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ListItemUpdateInput, ListItemUncheckedUpdateInput>
  }


  /**
   * ListItem delete
   */
  export type ListItemDeleteArgs = {
    /**
     * Select specific fields to fetch from the ListItem
     */
    select?: ListItemSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ListItemInclude | null
    /**
     * Filter which ListItem to delete.
     */
    where: ListItemWhereUniqueInput
  }


  /**
   * ListItem deleteMany
   */
  export type ListItemDeleteManyArgs = {
    /**
     * Filter which ListItems to delete
     */
    where?: ListItemWhereInput
  }


  /**
   * ListItem without action
   */
  export type ListItemArgs = {
    /**
     * Select specific fields to fetch from the ListItem
     */
    select?: ListItemSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ListItemInclude | null
  }



  /**
   * Model PilotUser
   */


  export type AggregatePilotUser = {
    _count: PilotUserCountAggregateOutputType | null
    _avg: PilotUserAvgAggregateOutputType | null
    _sum: PilotUserSumAggregateOutputType | null
    _min: PilotUserMinAggregateOutputType | null
    _max: PilotUserMaxAggregateOutputType | null
  }

  export type PilotUserAvgAggregateOutputType = {
    userId: number | null
  }

  export type PilotUserSumAggregateOutputType = {
    userId: bigint | null
  }

  export type PilotUserMinAggregateOutputType = {
    userId: bigint | null
    mozillaEmployee: boolean | null
    createdBy: string | null
    notes: string | null
    createdAt: Date | null
  }

  export type PilotUserMaxAggregateOutputType = {
    userId: bigint | null
    mozillaEmployee: boolean | null
    createdBy: string | null
    notes: string | null
    createdAt: Date | null
  }

  export type PilotUserCountAggregateOutputType = {
    userId: number
    mozillaEmployee: number
    createdBy: number
    notes: number
    createdAt: number
    _all: number
  }


  export type PilotUserAvgAggregateInputType = {
    userId?: true
  }

  export type PilotUserSumAggregateInputType = {
    userId?: true
  }

  export type PilotUserMinAggregateInputType = {
    userId?: true
    mozillaEmployee?: true
    createdBy?: true
    notes?: true
    createdAt?: true
  }

  export type PilotUserMaxAggregateInputType = {
    userId?: true
    mozillaEmployee?: true
    createdBy?: true
    notes?: true
    createdAt?: true
  }

  export type PilotUserCountAggregateInputType = {
    userId?: true
    mozillaEmployee?: true
    createdBy?: true
    notes?: true
    createdAt?: true
    _all?: true
  }

  export type PilotUserAggregateArgs = {
    /**
     * Filter which PilotUser to aggregate.
     */
    where?: PilotUserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PilotUsers to fetch.
     */
    orderBy?: Enumerable<PilotUserOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PilotUserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PilotUsers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PilotUsers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PilotUsers
    **/
    _count?: true | PilotUserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PilotUserAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PilotUserSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PilotUserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PilotUserMaxAggregateInputType
  }

  export type GetPilotUserAggregateType<T extends PilotUserAggregateArgs> = {
        [P in keyof T & keyof AggregatePilotUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePilotUser[P]>
      : GetScalarType<T[P], AggregatePilotUser[P]>
  }




  export type PilotUserGroupByArgs = {
    where?: PilotUserWhereInput
    orderBy?: Enumerable<PilotUserOrderByWithAggregationInput>
    by: PilotUserScalarFieldEnum[]
    having?: PilotUserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PilotUserCountAggregateInputType | true
    _avg?: PilotUserAvgAggregateInputType
    _sum?: PilotUserSumAggregateInputType
    _min?: PilotUserMinAggregateInputType
    _max?: PilotUserMaxAggregateInputType
  }


  export type PilotUserGroupByOutputType = {
    userId: bigint
    mozillaEmployee: boolean
    createdBy: string | null
    notes: string | null
    createdAt: Date
    _count: PilotUserCountAggregateOutputType | null
    _avg: PilotUserAvgAggregateOutputType | null
    _sum: PilotUserSumAggregateOutputType | null
    _min: PilotUserMinAggregateOutputType | null
    _max: PilotUserMaxAggregateOutputType | null
  }

  type GetPilotUserGroupByPayload<T extends PilotUserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickArray<PilotUserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PilotUserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PilotUserGroupByOutputType[P]>
            : GetScalarType<T[P], PilotUserGroupByOutputType[P]>
        }
      >
    >


  export type PilotUserSelect = {
    userId?: boolean
    mozillaEmployee?: boolean
    createdBy?: boolean
    notes?: boolean
    createdAt?: boolean
  }


  export type PilotUserGetPayload<S extends boolean | null | undefined | PilotUserArgs> =
    S extends { select: any, include: any } ? 'Please either choose `select` or `include`' :
    S extends true ? PilotUser :
    S extends undefined ? never :
    S extends { include: any } & (PilotUserArgs | PilotUserFindManyArgs)
    ? PilotUser 
    : S extends { select: any } & (PilotUserArgs | PilotUserFindManyArgs)
      ? {
    [P in TruthyKeys<S['select']>]:
    P extends keyof PilotUser ? PilotUser[P] : never
  } 
      : PilotUser


  type PilotUserCountArgs = 
    Omit<PilotUserFindManyArgs, 'select' | 'include'> & {
      select?: PilotUserCountAggregateInputType | true
    }

  export interface PilotUserDelegate<GlobalRejectSettings extends Prisma.RejectOnNotFound | Prisma.RejectPerOperation | false | undefined> {

    /**
     * Find zero or one PilotUser that matches the filter.
     * @param {PilotUserFindUniqueArgs} args - Arguments to find a PilotUser
     * @example
     * // Get one PilotUser
     * const pilotUser = await prisma.pilotUser.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends PilotUserFindUniqueArgs,  LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args: SelectSubset<T, PilotUserFindUniqueArgs>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findUnique', 'PilotUser'> extends True ? Prisma__PilotUserClient<PilotUserGetPayload<T>> : Prisma__PilotUserClient<PilotUserGetPayload<T> | null, null>

    /**
     * Find one PilotUser that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {PilotUserFindUniqueOrThrowArgs} args - Arguments to find a PilotUser
     * @example
     * // Get one PilotUser
     * const pilotUser = await prisma.pilotUser.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends PilotUserFindUniqueOrThrowArgs>(
      args?: SelectSubset<T, PilotUserFindUniqueOrThrowArgs>
    ): Prisma__PilotUserClient<PilotUserGetPayload<T>>

    /**
     * Find the first PilotUser that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PilotUserFindFirstArgs} args - Arguments to find a PilotUser
     * @example
     * // Get one PilotUser
     * const pilotUser = await prisma.pilotUser.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends PilotUserFindFirstArgs,  LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args?: SelectSubset<T, PilotUserFindFirstArgs>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findFirst', 'PilotUser'> extends True ? Prisma__PilotUserClient<PilotUserGetPayload<T>> : Prisma__PilotUserClient<PilotUserGetPayload<T> | null, null>

    /**
     * Find the first PilotUser that matches the filter or
     * throw `NotFoundError` if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PilotUserFindFirstOrThrowArgs} args - Arguments to find a PilotUser
     * @example
     * // Get one PilotUser
     * const pilotUser = await prisma.pilotUser.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends PilotUserFindFirstOrThrowArgs>(
      args?: SelectSubset<T, PilotUserFindFirstOrThrowArgs>
    ): Prisma__PilotUserClient<PilotUserGetPayload<T>>

    /**
     * Find zero or more PilotUsers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PilotUserFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PilotUsers
     * const pilotUsers = await prisma.pilotUser.findMany()
     * 
     * // Get first 10 PilotUsers
     * const pilotUsers = await prisma.pilotUser.findMany({ take: 10 })
     * 
     * // Only select the `userId`
     * const pilotUserWithUserIdOnly = await prisma.pilotUser.findMany({ select: { userId: true } })
     * 
    **/
    findMany<T extends PilotUserFindManyArgs>(
      args?: SelectSubset<T, PilotUserFindManyArgs>
    ): Prisma.PrismaPromise<Array<PilotUserGetPayload<T>>>

    /**
     * Create a PilotUser.
     * @param {PilotUserCreateArgs} args - Arguments to create a PilotUser.
     * @example
     * // Create one PilotUser
     * const PilotUser = await prisma.pilotUser.create({
     *   data: {
     *     // ... data to create a PilotUser
     *   }
     * })
     * 
    **/
    create<T extends PilotUserCreateArgs>(
      args: SelectSubset<T, PilotUserCreateArgs>
    ): Prisma__PilotUserClient<PilotUserGetPayload<T>>

    /**
     * Create many PilotUsers.
     *     @param {PilotUserCreateManyArgs} args - Arguments to create many PilotUsers.
     *     @example
     *     // Create many PilotUsers
     *     const pilotUser = await prisma.pilotUser.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends PilotUserCreateManyArgs>(
      args?: SelectSubset<T, PilotUserCreateManyArgs>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a PilotUser.
     * @param {PilotUserDeleteArgs} args - Arguments to delete one PilotUser.
     * @example
     * // Delete one PilotUser
     * const PilotUser = await prisma.pilotUser.delete({
     *   where: {
     *     // ... filter to delete one PilotUser
     *   }
     * })
     * 
    **/
    delete<T extends PilotUserDeleteArgs>(
      args: SelectSubset<T, PilotUserDeleteArgs>
    ): Prisma__PilotUserClient<PilotUserGetPayload<T>>

    /**
     * Update one PilotUser.
     * @param {PilotUserUpdateArgs} args - Arguments to update one PilotUser.
     * @example
     * // Update one PilotUser
     * const pilotUser = await prisma.pilotUser.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends PilotUserUpdateArgs>(
      args: SelectSubset<T, PilotUserUpdateArgs>
    ): Prisma__PilotUserClient<PilotUserGetPayload<T>>

    /**
     * Delete zero or more PilotUsers.
     * @param {PilotUserDeleteManyArgs} args - Arguments to filter PilotUsers to delete.
     * @example
     * // Delete a few PilotUsers
     * const { count } = await prisma.pilotUser.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends PilotUserDeleteManyArgs>(
      args?: SelectSubset<T, PilotUserDeleteManyArgs>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PilotUsers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PilotUserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PilotUsers
     * const pilotUser = await prisma.pilotUser.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends PilotUserUpdateManyArgs>(
      args: SelectSubset<T, PilotUserUpdateManyArgs>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one PilotUser.
     * @param {PilotUserUpsertArgs} args - Arguments to update or create a PilotUser.
     * @example
     * // Update or create a PilotUser
     * const pilotUser = await prisma.pilotUser.upsert({
     *   create: {
     *     // ... data to create a PilotUser
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PilotUser we want to update
     *   }
     * })
    **/
    upsert<T extends PilotUserUpsertArgs>(
      args: SelectSubset<T, PilotUserUpsertArgs>
    ): Prisma__PilotUserClient<PilotUserGetPayload<T>>

    /**
     * Count the number of PilotUsers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PilotUserCountArgs} args - Arguments to filter PilotUsers to count.
     * @example
     * // Count the number of PilotUsers
     * const count = await prisma.pilotUser.count({
     *   where: {
     *     // ... the filter for the PilotUsers we want to count
     *   }
     * })
    **/
    count<T extends PilotUserCountArgs>(
      args?: Subset<T, PilotUserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends _Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PilotUserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PilotUser.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PilotUserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PilotUserAggregateArgs>(args: Subset<T, PilotUserAggregateArgs>): Prisma.PrismaPromise<GetPilotUserAggregateType<T>>

    /**
     * Group by PilotUser.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PilotUserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PilotUserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PilotUserGroupByArgs['orderBy'] }
        : { orderBy?: PilotUserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends TupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PilotUserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPilotUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>

  }

  /**
   * The delegate class that acts as a "Promise-like" for PilotUser.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export class Prisma__PilotUserClient<T, Null = never> implements Prisma.PrismaPromise<T> {
    private readonly _dmmf;
    private readonly _queryType;
    private readonly _rootField;
    private readonly _clientMethod;
    private readonly _args;
    private readonly _dataPath;
    private readonly _errorFormat;
    private readonly _measurePerformance?;
    private _isList;
    private _callsite;
    private _requestPromise?;
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    constructor(_dmmf: runtime.DMMFClass, _queryType: 'query' | 'mutation', _rootField: string, _clientMethod: string, _args: any, _dataPath: string[], _errorFormat: ErrorFormat, _measurePerformance?: boolean | undefined, _isList?: boolean);


    private get _document();
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): Promise<T>;
  }



  // Custom InputTypes

  /**
   * PilotUser base type for findUnique actions
   */
  export type PilotUserFindUniqueArgsBase = {
    /**
     * Select specific fields to fetch from the PilotUser
     */
    select?: PilotUserSelect | null
    /**
     * Filter, which PilotUser to fetch.
     */
    where: PilotUserWhereUniqueInput
  }

  /**
   * PilotUser findUnique
   */
  export interface PilotUserFindUniqueArgs extends PilotUserFindUniqueArgsBase {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findUniqueOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * PilotUser findUniqueOrThrow
   */
  export type PilotUserFindUniqueOrThrowArgs = {
    /**
     * Select specific fields to fetch from the PilotUser
     */
    select?: PilotUserSelect | null
    /**
     * Filter, which PilotUser to fetch.
     */
    where: PilotUserWhereUniqueInput
  }


  /**
   * PilotUser base type for findFirst actions
   */
  export type PilotUserFindFirstArgsBase = {
    /**
     * Select specific fields to fetch from the PilotUser
     */
    select?: PilotUserSelect | null
    /**
     * Filter, which PilotUser to fetch.
     */
    where?: PilotUserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PilotUsers to fetch.
     */
    orderBy?: Enumerable<PilotUserOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PilotUsers.
     */
    cursor?: PilotUserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PilotUsers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PilotUsers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PilotUsers.
     */
    distinct?: Enumerable<PilotUserScalarFieldEnum>
  }

  /**
   * PilotUser findFirst
   */
  export interface PilotUserFindFirstArgs extends PilotUserFindFirstArgsBase {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findFirstOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * PilotUser findFirstOrThrow
   */
  export type PilotUserFindFirstOrThrowArgs = {
    /**
     * Select specific fields to fetch from the PilotUser
     */
    select?: PilotUserSelect | null
    /**
     * Filter, which PilotUser to fetch.
     */
    where?: PilotUserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PilotUsers to fetch.
     */
    orderBy?: Enumerable<PilotUserOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PilotUsers.
     */
    cursor?: PilotUserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PilotUsers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PilotUsers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PilotUsers.
     */
    distinct?: Enumerable<PilotUserScalarFieldEnum>
  }


  /**
   * PilotUser findMany
   */
  export type PilotUserFindManyArgs = {
    /**
     * Select specific fields to fetch from the PilotUser
     */
    select?: PilotUserSelect | null
    /**
     * Filter, which PilotUsers to fetch.
     */
    where?: PilotUserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PilotUsers to fetch.
     */
    orderBy?: Enumerable<PilotUserOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PilotUsers.
     */
    cursor?: PilotUserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PilotUsers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PilotUsers.
     */
    skip?: number
    distinct?: Enumerable<PilotUserScalarFieldEnum>
  }


  /**
   * PilotUser create
   */
  export type PilotUserCreateArgs = {
    /**
     * Select specific fields to fetch from the PilotUser
     */
    select?: PilotUserSelect | null
    /**
     * The data needed to create a PilotUser.
     */
    data: XOR<PilotUserCreateInput, PilotUserUncheckedCreateInput>
  }


  /**
   * PilotUser createMany
   */
  export type PilotUserCreateManyArgs = {
    /**
     * The data used to create many PilotUsers.
     */
    data: Enumerable<PilotUserCreateManyInput>
    skipDuplicates?: boolean
  }


  /**
   * PilotUser update
   */
  export type PilotUserUpdateArgs = {
    /**
     * Select specific fields to fetch from the PilotUser
     */
    select?: PilotUserSelect | null
    /**
     * The data needed to update a PilotUser.
     */
    data: XOR<PilotUserUpdateInput, PilotUserUncheckedUpdateInput>
    /**
     * Choose, which PilotUser to update.
     */
    where: PilotUserWhereUniqueInput
  }


  /**
   * PilotUser updateMany
   */
  export type PilotUserUpdateManyArgs = {
    /**
     * The data used to update PilotUsers.
     */
    data: XOR<PilotUserUpdateManyMutationInput, PilotUserUncheckedUpdateManyInput>
    /**
     * Filter which PilotUsers to update
     */
    where?: PilotUserWhereInput
  }


  /**
   * PilotUser upsert
   */
  export type PilotUserUpsertArgs = {
    /**
     * Select specific fields to fetch from the PilotUser
     */
    select?: PilotUserSelect | null
    /**
     * The filter to search for the PilotUser to update in case it exists.
     */
    where: PilotUserWhereUniqueInput
    /**
     * In case the PilotUser found by the `where` argument doesn't exist, create a new PilotUser with this data.
     */
    create: XOR<PilotUserCreateInput, PilotUserUncheckedCreateInput>
    /**
     * In case the PilotUser was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PilotUserUpdateInput, PilotUserUncheckedUpdateInput>
  }


  /**
   * PilotUser delete
   */
  export type PilotUserDeleteArgs = {
    /**
     * Select specific fields to fetch from the PilotUser
     */
    select?: PilotUserSelect | null
    /**
     * Filter which PilotUser to delete.
     */
    where: PilotUserWhereUniqueInput
  }


  /**
   * PilotUser deleteMany
   */
  export type PilotUserDeleteManyArgs = {
    /**
     * Filter which PilotUsers to delete
     */
    where?: PilotUserWhereInput
  }


  /**
   * PilotUser without action
   */
  export type PilotUserArgs = {
    /**
     * Select specific fields to fetch from the PilotUser
     */
    select?: PilotUserSelect | null
  }



  /**
   * Enums
   */

  // Based on
  // https://github.com/microsoft/TypeScript/issues/3192#issuecomment-261720275

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const ListScalarFieldEnum: {
    id: 'id',
    externalId: 'externalId',
    userId: 'userId',
    slug: 'slug',
    title: 'title',
    description: 'description',
    status: 'status',
    moderationStatus: 'moderationStatus',
    moderatedBy: 'moderatedBy',
    moderationReason: 'moderationReason',
    moderationDetails: 'moderationDetails',
    restorationReason: 'restorationReason',
    listItemNoteVisibility: 'listItemNoteVisibility',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ListScalarFieldEnum = (typeof ListScalarFieldEnum)[keyof typeof ListScalarFieldEnum]


  export const ListItemScalarFieldEnum: {
    id: 'id',
    externalId: 'externalId',
    listId: 'listId',
    itemId: 'itemId',
    url: 'url',
    title: 'title',
    excerpt: 'excerpt',
    note: 'note',
    imageUrl: 'imageUrl',
    publisher: 'publisher',
    authors: 'authors',
    sortOrder: 'sortOrder',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ListItemScalarFieldEnum = (typeof ListItemScalarFieldEnum)[keyof typeof ListItemScalarFieldEnum]


  export const PilotUserScalarFieldEnum: {
    userId: 'userId',
    mozillaEmployee: 'mozillaEmployee',
    createdBy: 'createdBy',
    notes: 'notes',
    createdAt: 'createdAt'
  };

  export type PilotUserScalarFieldEnum = (typeof PilotUserScalarFieldEnum)[keyof typeof PilotUserScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Deep Input Types
   */


  export type ListWhereInput = {
    AND?: Enumerable<ListWhereInput>
    OR?: Enumerable<ListWhereInput>
    NOT?: Enumerable<ListWhereInput>
    id?: BigIntFilter | bigint | number
    externalId?: StringFilter | string
    userId?: BigIntFilter | bigint | number
    slug?: StringNullableFilter | string | null
    title?: StringFilter | string
    description?: StringNullableFilter | string | null
    status?: EnumVisibilityFilter | Visibility
    moderationStatus?: EnumModerationStatusFilter | ModerationStatus
    moderatedBy?: StringNullableFilter | string | null
    moderationReason?: StringNullableFilter | string | null
    moderationDetails?: StringNullableFilter | string | null
    restorationReason?: StringNullableFilter | string | null
    listItemNoteVisibility?: EnumVisibilityFilter | Visibility
    createdAt?: DateTimeFilter | Date | string
    updatedAt?: DateTimeFilter | Date | string
    listItems?: ListItemListRelationFilter
  }

  export type ListOrderByWithRelationInput = {
    id?: SortOrder
    externalId?: SortOrder
    userId?: SortOrder
    slug?: SortOrderInput | SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    status?: SortOrder
    moderationStatus?: SortOrder
    moderatedBy?: SortOrderInput | SortOrder
    moderationReason?: SortOrderInput | SortOrder
    moderationDetails?: SortOrderInput | SortOrder
    restorationReason?: SortOrderInput | SortOrder
    listItemNoteVisibility?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    listItems?: ListItemOrderByRelationAggregateInput
  }

  export type ListWhereUniqueInput = {
    id?: bigint | number
    externalId?: string
    userId_slug?: ListUserIdSlugCompoundUniqueInput
  }

  export type ListOrderByWithAggregationInput = {
    id?: SortOrder
    externalId?: SortOrder
    userId?: SortOrder
    slug?: SortOrderInput | SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    status?: SortOrder
    moderationStatus?: SortOrder
    moderatedBy?: SortOrderInput | SortOrder
    moderationReason?: SortOrderInput | SortOrder
    moderationDetails?: SortOrderInput | SortOrder
    restorationReason?: SortOrderInput | SortOrder
    listItemNoteVisibility?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ListCountOrderByAggregateInput
    _avg?: ListAvgOrderByAggregateInput
    _max?: ListMaxOrderByAggregateInput
    _min?: ListMinOrderByAggregateInput
    _sum?: ListSumOrderByAggregateInput
  }

  export type ListScalarWhereWithAggregatesInput = {
    AND?: Enumerable<ListScalarWhereWithAggregatesInput>
    OR?: Enumerable<ListScalarWhereWithAggregatesInput>
    NOT?: Enumerable<ListScalarWhereWithAggregatesInput>
    id?: BigIntWithAggregatesFilter | bigint | number
    externalId?: StringWithAggregatesFilter | string
    userId?: BigIntWithAggregatesFilter | bigint | number
    slug?: StringNullableWithAggregatesFilter | string | null
    title?: StringWithAggregatesFilter | string
    description?: StringNullableWithAggregatesFilter | string | null
    status?: EnumVisibilityWithAggregatesFilter | Visibility
    moderationStatus?: EnumModerationStatusWithAggregatesFilter | ModerationStatus
    moderatedBy?: StringNullableWithAggregatesFilter | string | null
    moderationReason?: StringNullableWithAggregatesFilter | string | null
    moderationDetails?: StringNullableWithAggregatesFilter | string | null
    restorationReason?: StringNullableWithAggregatesFilter | string | null
    listItemNoteVisibility?: EnumVisibilityWithAggregatesFilter | Visibility
    createdAt?: DateTimeWithAggregatesFilter | Date | string
    updatedAt?: DateTimeWithAggregatesFilter | Date | string
  }

  export type ListItemWhereInput = {
    AND?: Enumerable<ListItemWhereInput>
    OR?: Enumerable<ListItemWhereInput>
    NOT?: Enumerable<ListItemWhereInput>
    id?: BigIntFilter | bigint | number
    externalId?: StringFilter | string
    listId?: BigIntFilter | bigint | number
    itemId?: BigIntFilter | bigint | number
    url?: StringNullableFilter | string | null
    title?: StringNullableFilter | string | null
    excerpt?: StringNullableFilter | string | null
    note?: StringNullableFilter | string | null
    imageUrl?: StringNullableFilter | string | null
    publisher?: StringNullableFilter | string | null
    authors?: StringNullableFilter | string | null
    sortOrder?: IntFilter | number
    createdAt?: DateTimeFilter | Date | string
    updatedAt?: DateTimeFilter | Date | string
    list?: XOR<ListRelationFilter, ListWhereInput>
  }

  export type ListItemOrderByWithRelationInput = {
    id?: SortOrder
    externalId?: SortOrder
    listId?: SortOrder
    itemId?: SortOrder
    url?: SortOrderInput | SortOrder
    title?: SortOrderInput | SortOrder
    excerpt?: SortOrderInput | SortOrder
    note?: SortOrderInput | SortOrder
    imageUrl?: SortOrderInput | SortOrder
    publisher?: SortOrderInput | SortOrder
    authors?: SortOrderInput | SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    list?: ListOrderByWithRelationInput
  }

  export type ListItemWhereUniqueInput = {
    id?: bigint | number
    externalId?: string
  }

  export type ListItemOrderByWithAggregationInput = {
    id?: SortOrder
    externalId?: SortOrder
    listId?: SortOrder
    itemId?: SortOrder
    url?: SortOrderInput | SortOrder
    title?: SortOrderInput | SortOrder
    excerpt?: SortOrderInput | SortOrder
    note?: SortOrderInput | SortOrder
    imageUrl?: SortOrderInput | SortOrder
    publisher?: SortOrderInput | SortOrder
    authors?: SortOrderInput | SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ListItemCountOrderByAggregateInput
    _avg?: ListItemAvgOrderByAggregateInput
    _max?: ListItemMaxOrderByAggregateInput
    _min?: ListItemMinOrderByAggregateInput
    _sum?: ListItemSumOrderByAggregateInput
  }

  export type ListItemScalarWhereWithAggregatesInput = {
    AND?: Enumerable<ListItemScalarWhereWithAggregatesInput>
    OR?: Enumerable<ListItemScalarWhereWithAggregatesInput>
    NOT?: Enumerable<ListItemScalarWhereWithAggregatesInput>
    id?: BigIntWithAggregatesFilter | bigint | number
    externalId?: StringWithAggregatesFilter | string
    listId?: BigIntWithAggregatesFilter | bigint | number
    itemId?: BigIntWithAggregatesFilter | bigint | number
    url?: StringNullableWithAggregatesFilter | string | null
    title?: StringNullableWithAggregatesFilter | string | null
    excerpt?: StringNullableWithAggregatesFilter | string | null
    note?: StringNullableWithAggregatesFilter | string | null
    imageUrl?: StringNullableWithAggregatesFilter | string | null
    publisher?: StringNullableWithAggregatesFilter | string | null
    authors?: StringNullableWithAggregatesFilter | string | null
    sortOrder?: IntWithAggregatesFilter | number
    createdAt?: DateTimeWithAggregatesFilter | Date | string
    updatedAt?: DateTimeWithAggregatesFilter | Date | string
  }

  export type PilotUserWhereInput = {
    AND?: Enumerable<PilotUserWhereInput>
    OR?: Enumerable<PilotUserWhereInput>
    NOT?: Enumerable<PilotUserWhereInput>
    userId?: BigIntFilter | bigint | number
    mozillaEmployee?: BoolFilter | boolean
    createdBy?: StringNullableFilter | string | null
    notes?: StringNullableFilter | string | null
    createdAt?: DateTimeFilter | Date | string
  }

  export type PilotUserOrderByWithRelationInput = {
    userId?: SortOrder
    mozillaEmployee?: SortOrder
    createdBy?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
  }

  export type PilotUserWhereUniqueInput = {
    userId?: bigint | number
  }

  export type PilotUserOrderByWithAggregationInput = {
    userId?: SortOrder
    mozillaEmployee?: SortOrder
    createdBy?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: PilotUserCountOrderByAggregateInput
    _avg?: PilotUserAvgOrderByAggregateInput
    _max?: PilotUserMaxOrderByAggregateInput
    _min?: PilotUserMinOrderByAggregateInput
    _sum?: PilotUserSumOrderByAggregateInput
  }

  export type PilotUserScalarWhereWithAggregatesInput = {
    AND?: Enumerable<PilotUserScalarWhereWithAggregatesInput>
    OR?: Enumerable<PilotUserScalarWhereWithAggregatesInput>
    NOT?: Enumerable<PilotUserScalarWhereWithAggregatesInput>
    userId?: BigIntWithAggregatesFilter | bigint | number
    mozillaEmployee?: BoolWithAggregatesFilter | boolean
    createdBy?: StringNullableWithAggregatesFilter | string | null
    notes?: StringNullableWithAggregatesFilter | string | null
    createdAt?: DateTimeWithAggregatesFilter | Date | string
  }

  export type ListCreateInput = {
    id?: bigint | number
    externalId?: string
    userId: bigint | number
    slug?: string | null
    title: string
    description?: string | null
    status?: Visibility
    moderationStatus?: ModerationStatus
    moderatedBy?: string | null
    moderationReason?: string | null
    moderationDetails?: string | null
    restorationReason?: string | null
    listItemNoteVisibility?: Visibility
    createdAt?: Date | string
    updatedAt?: Date | string
    listItems?: ListItemCreateNestedManyWithoutListInput
  }

  export type ListUncheckedCreateInput = {
    id?: bigint | number
    externalId?: string
    userId: bigint | number
    slug?: string | null
    title: string
    description?: string | null
    status?: Visibility
    moderationStatus?: ModerationStatus
    moderatedBy?: string | null
    moderationReason?: string | null
    moderationDetails?: string | null
    restorationReason?: string | null
    listItemNoteVisibility?: Visibility
    createdAt?: Date | string
    updatedAt?: Date | string
    listItems?: ListItemUncheckedCreateNestedManyWithoutListInput
  }

  export type ListUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    externalId?: StringFieldUpdateOperationsInput | string
    userId?: BigIntFieldUpdateOperationsInput | bigint | number
    slug?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumVisibilityFieldUpdateOperationsInput | Visibility
    moderationStatus?: EnumModerationStatusFieldUpdateOperationsInput | ModerationStatus
    moderatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    moderationReason?: NullableStringFieldUpdateOperationsInput | string | null
    moderationDetails?: NullableStringFieldUpdateOperationsInput | string | null
    restorationReason?: NullableStringFieldUpdateOperationsInput | string | null
    listItemNoteVisibility?: EnumVisibilityFieldUpdateOperationsInput | Visibility
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    listItems?: ListItemUpdateManyWithoutListNestedInput
  }

  export type ListUncheckedUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    externalId?: StringFieldUpdateOperationsInput | string
    userId?: BigIntFieldUpdateOperationsInput | bigint | number
    slug?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumVisibilityFieldUpdateOperationsInput | Visibility
    moderationStatus?: EnumModerationStatusFieldUpdateOperationsInput | ModerationStatus
    moderatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    moderationReason?: NullableStringFieldUpdateOperationsInput | string | null
    moderationDetails?: NullableStringFieldUpdateOperationsInput | string | null
    restorationReason?: NullableStringFieldUpdateOperationsInput | string | null
    listItemNoteVisibility?: EnumVisibilityFieldUpdateOperationsInput | Visibility
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    listItems?: ListItemUncheckedUpdateManyWithoutListNestedInput
  }

  export type ListCreateManyInput = {
    id?: bigint | number
    externalId?: string
    userId: bigint | number
    slug?: string | null
    title: string
    description?: string | null
    status?: Visibility
    moderationStatus?: ModerationStatus
    moderatedBy?: string | null
    moderationReason?: string | null
    moderationDetails?: string | null
    restorationReason?: string | null
    listItemNoteVisibility?: Visibility
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ListUpdateManyMutationInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    externalId?: StringFieldUpdateOperationsInput | string
    userId?: BigIntFieldUpdateOperationsInput | bigint | number
    slug?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumVisibilityFieldUpdateOperationsInput | Visibility
    moderationStatus?: EnumModerationStatusFieldUpdateOperationsInput | ModerationStatus
    moderatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    moderationReason?: NullableStringFieldUpdateOperationsInput | string | null
    moderationDetails?: NullableStringFieldUpdateOperationsInput | string | null
    restorationReason?: NullableStringFieldUpdateOperationsInput | string | null
    listItemNoteVisibility?: EnumVisibilityFieldUpdateOperationsInput | Visibility
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ListUncheckedUpdateManyInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    externalId?: StringFieldUpdateOperationsInput | string
    userId?: BigIntFieldUpdateOperationsInput | bigint | number
    slug?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumVisibilityFieldUpdateOperationsInput | Visibility
    moderationStatus?: EnumModerationStatusFieldUpdateOperationsInput | ModerationStatus
    moderatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    moderationReason?: NullableStringFieldUpdateOperationsInput | string | null
    moderationDetails?: NullableStringFieldUpdateOperationsInput | string | null
    restorationReason?: NullableStringFieldUpdateOperationsInput | string | null
    listItemNoteVisibility?: EnumVisibilityFieldUpdateOperationsInput | Visibility
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ListItemCreateInput = {
    id?: bigint | number
    externalId?: string
    itemId: bigint | number
    url?: string | null
    title?: string | null
    excerpt?: string | null
    note?: string | null
    imageUrl?: string | null
    publisher?: string | null
    authors?: string | null
    sortOrder?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    list: ListCreateNestedOneWithoutListItemsInput
  }

  export type ListItemUncheckedCreateInput = {
    id?: bigint | number
    externalId?: string
    listId: bigint | number
    itemId: bigint | number
    url?: string | null
    title?: string | null
    excerpt?: string | null
    note?: string | null
    imageUrl?: string | null
    publisher?: string | null
    authors?: string | null
    sortOrder?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ListItemUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    externalId?: StringFieldUpdateOperationsInput | string
    itemId?: BigIntFieldUpdateOperationsInput | bigint | number
    url?: NullableStringFieldUpdateOperationsInput | string | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    excerpt?: NullableStringFieldUpdateOperationsInput | string | null
    note?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    publisher?: NullableStringFieldUpdateOperationsInput | string | null
    authors?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    list?: ListUpdateOneRequiredWithoutListItemsNestedInput
  }

  export type ListItemUncheckedUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    externalId?: StringFieldUpdateOperationsInput | string
    listId?: BigIntFieldUpdateOperationsInput | bigint | number
    itemId?: BigIntFieldUpdateOperationsInput | bigint | number
    url?: NullableStringFieldUpdateOperationsInput | string | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    excerpt?: NullableStringFieldUpdateOperationsInput | string | null
    note?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    publisher?: NullableStringFieldUpdateOperationsInput | string | null
    authors?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ListItemCreateManyInput = {
    id?: bigint | number
    externalId?: string
    listId: bigint | number
    itemId: bigint | number
    url?: string | null
    title?: string | null
    excerpt?: string | null
    note?: string | null
    imageUrl?: string | null
    publisher?: string | null
    authors?: string | null
    sortOrder?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ListItemUpdateManyMutationInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    externalId?: StringFieldUpdateOperationsInput | string
    itemId?: BigIntFieldUpdateOperationsInput | bigint | number
    url?: NullableStringFieldUpdateOperationsInput | string | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    excerpt?: NullableStringFieldUpdateOperationsInput | string | null
    note?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    publisher?: NullableStringFieldUpdateOperationsInput | string | null
    authors?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ListItemUncheckedUpdateManyInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    externalId?: StringFieldUpdateOperationsInput | string
    listId?: BigIntFieldUpdateOperationsInput | bigint | number
    itemId?: BigIntFieldUpdateOperationsInput | bigint | number
    url?: NullableStringFieldUpdateOperationsInput | string | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    excerpt?: NullableStringFieldUpdateOperationsInput | string | null
    note?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    publisher?: NullableStringFieldUpdateOperationsInput | string | null
    authors?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PilotUserCreateInput = {
    userId: bigint | number
    mozillaEmployee?: boolean
    createdBy?: string | null
    notes?: string | null
    createdAt?: Date | string
  }

  export type PilotUserUncheckedCreateInput = {
    userId: bigint | number
    mozillaEmployee?: boolean
    createdBy?: string | null
    notes?: string | null
    createdAt?: Date | string
  }

  export type PilotUserUpdateInput = {
    userId?: BigIntFieldUpdateOperationsInput | bigint | number
    mozillaEmployee?: BoolFieldUpdateOperationsInput | boolean
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PilotUserUncheckedUpdateInput = {
    userId?: BigIntFieldUpdateOperationsInput | bigint | number
    mozillaEmployee?: BoolFieldUpdateOperationsInput | boolean
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PilotUserCreateManyInput = {
    userId: bigint | number
    mozillaEmployee?: boolean
    createdBy?: string | null
    notes?: string | null
    createdAt?: Date | string
  }

  export type PilotUserUpdateManyMutationInput = {
    userId?: BigIntFieldUpdateOperationsInput | bigint | number
    mozillaEmployee?: BoolFieldUpdateOperationsInput | boolean
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PilotUserUncheckedUpdateManyInput = {
    userId?: BigIntFieldUpdateOperationsInput | bigint | number
    mozillaEmployee?: BoolFieldUpdateOperationsInput | boolean
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BigIntFilter = {
    equals?: bigint | number
    in?: Enumerable<bigint> | Enumerable<number> | bigint | number
    notIn?: Enumerable<bigint> | Enumerable<number> | bigint | number
    lt?: bigint | number
    lte?: bigint | number
    gt?: bigint | number
    gte?: bigint | number
    not?: NestedBigIntFilter | bigint | number
  }

  export type StringFilter = {
    equals?: string
    in?: Enumerable<string> | string
    notIn?: Enumerable<string> | string
    lt?: string
    lte?: string
    gt?: string
    gte?: string
    contains?: string
    startsWith?: string
    endsWith?: string
    not?: NestedStringFilter | string
  }

  export type StringNullableFilter = {
    equals?: string | null
    in?: Enumerable<string> | string | null
    notIn?: Enumerable<string> | string | null
    lt?: string
    lte?: string
    gt?: string
    gte?: string
    contains?: string
    startsWith?: string
    endsWith?: string
    not?: NestedStringNullableFilter | string | null
  }

  export type EnumVisibilityFilter = {
    equals?: Visibility
    in?: Enumerable<Visibility>
    notIn?: Enumerable<Visibility>
    not?: NestedEnumVisibilityFilter | Visibility
  }

  export type EnumModerationStatusFilter = {
    equals?: ModerationStatus
    in?: Enumerable<ModerationStatus>
    notIn?: Enumerable<ModerationStatus>
    not?: NestedEnumModerationStatusFilter | ModerationStatus
  }

  export type DateTimeFilter = {
    equals?: Date | string
    in?: Enumerable<Date> | Enumerable<string> | Date | string
    notIn?: Enumerable<Date> | Enumerable<string> | Date | string
    lt?: Date | string
    lte?: Date | string
    gt?: Date | string
    gte?: Date | string
    not?: NestedDateTimeFilter | Date | string
  }

  export type ListItemListRelationFilter = {
    every?: ListItemWhereInput
    some?: ListItemWhereInput
    none?: ListItemWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ListItemOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ListUserIdSlugCompoundUniqueInput = {
    userId: bigint | number
    slug: string
  }

  export type ListCountOrderByAggregateInput = {
    id?: SortOrder
    externalId?: SortOrder
    userId?: SortOrder
    slug?: SortOrder
    title?: SortOrder
    description?: SortOrder
    status?: SortOrder
    moderationStatus?: SortOrder
    moderatedBy?: SortOrder
    moderationReason?: SortOrder
    moderationDetails?: SortOrder
    restorationReason?: SortOrder
    listItemNoteVisibility?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ListAvgOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
  }

  export type ListMaxOrderByAggregateInput = {
    id?: SortOrder
    externalId?: SortOrder
    userId?: SortOrder
    slug?: SortOrder
    title?: SortOrder
    description?: SortOrder
    status?: SortOrder
    moderationStatus?: SortOrder
    moderatedBy?: SortOrder
    moderationReason?: SortOrder
    moderationDetails?: SortOrder
    restorationReason?: SortOrder
    listItemNoteVisibility?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ListMinOrderByAggregateInput = {
    id?: SortOrder
    externalId?: SortOrder
    userId?: SortOrder
    slug?: SortOrder
    title?: SortOrder
    description?: SortOrder
    status?: SortOrder
    moderationStatus?: SortOrder
    moderatedBy?: SortOrder
    moderationReason?: SortOrder
    moderationDetails?: SortOrder
    restorationReason?: SortOrder
    listItemNoteVisibility?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ListSumOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
  }

  export type BigIntWithAggregatesFilter = {
    equals?: bigint | number
    in?: Enumerable<bigint> | Enumerable<number> | bigint | number
    notIn?: Enumerable<bigint> | Enumerable<number> | bigint | number
    lt?: bigint | number
    lte?: bigint | number
    gt?: bigint | number
    gte?: bigint | number
    not?: NestedBigIntWithAggregatesFilter | bigint | number
    _count?: NestedIntFilter
    _avg?: NestedFloatFilter
    _sum?: NestedBigIntFilter
    _min?: NestedBigIntFilter
    _max?: NestedBigIntFilter
  }

  export type StringWithAggregatesFilter = {
    equals?: string
    in?: Enumerable<string> | string
    notIn?: Enumerable<string> | string
    lt?: string
    lte?: string
    gt?: string
    gte?: string
    contains?: string
    startsWith?: string
    endsWith?: string
    not?: NestedStringWithAggregatesFilter | string
    _count?: NestedIntFilter
    _min?: NestedStringFilter
    _max?: NestedStringFilter
  }

  export type StringNullableWithAggregatesFilter = {
    equals?: string | null
    in?: Enumerable<string> | string | null
    notIn?: Enumerable<string> | string | null
    lt?: string
    lte?: string
    gt?: string
    gte?: string
    contains?: string
    startsWith?: string
    endsWith?: string
    not?: NestedStringNullableWithAggregatesFilter | string | null
    _count?: NestedIntNullableFilter
    _min?: NestedStringNullableFilter
    _max?: NestedStringNullableFilter
  }

  export type EnumVisibilityWithAggregatesFilter = {
    equals?: Visibility
    in?: Enumerable<Visibility>
    notIn?: Enumerable<Visibility>
    not?: NestedEnumVisibilityWithAggregatesFilter | Visibility
    _count?: NestedIntFilter
    _min?: NestedEnumVisibilityFilter
    _max?: NestedEnumVisibilityFilter
  }

  export type EnumModerationStatusWithAggregatesFilter = {
    equals?: ModerationStatus
    in?: Enumerable<ModerationStatus>
    notIn?: Enumerable<ModerationStatus>
    not?: NestedEnumModerationStatusWithAggregatesFilter | ModerationStatus
    _count?: NestedIntFilter
    _min?: NestedEnumModerationStatusFilter
    _max?: NestedEnumModerationStatusFilter
  }

  export type DateTimeWithAggregatesFilter = {
    equals?: Date | string
    in?: Enumerable<Date> | Enumerable<string> | Date | string
    notIn?: Enumerable<Date> | Enumerable<string> | Date | string
    lt?: Date | string
    lte?: Date | string
    gt?: Date | string
    gte?: Date | string
    not?: NestedDateTimeWithAggregatesFilter | Date | string
    _count?: NestedIntFilter
    _min?: NestedDateTimeFilter
    _max?: NestedDateTimeFilter
  }

  export type IntFilter = {
    equals?: number
    in?: Enumerable<number> | number
    notIn?: Enumerable<number> | number
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedIntFilter | number
  }

  export type ListRelationFilter = {
    is?: ListWhereInput | null
    isNot?: ListWhereInput | null
  }

  export type ListItemCountOrderByAggregateInput = {
    id?: SortOrder
    externalId?: SortOrder
    listId?: SortOrder
    itemId?: SortOrder
    url?: SortOrder
    title?: SortOrder
    excerpt?: SortOrder
    note?: SortOrder
    imageUrl?: SortOrder
    publisher?: SortOrder
    authors?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ListItemAvgOrderByAggregateInput = {
    id?: SortOrder
    listId?: SortOrder
    itemId?: SortOrder
    sortOrder?: SortOrder
  }

  export type ListItemMaxOrderByAggregateInput = {
    id?: SortOrder
    externalId?: SortOrder
    listId?: SortOrder
    itemId?: SortOrder
    url?: SortOrder
    title?: SortOrder
    excerpt?: SortOrder
    note?: SortOrder
    imageUrl?: SortOrder
    publisher?: SortOrder
    authors?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ListItemMinOrderByAggregateInput = {
    id?: SortOrder
    externalId?: SortOrder
    listId?: SortOrder
    itemId?: SortOrder
    url?: SortOrder
    title?: SortOrder
    excerpt?: SortOrder
    note?: SortOrder
    imageUrl?: SortOrder
    publisher?: SortOrder
    authors?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ListItemSumOrderByAggregateInput = {
    id?: SortOrder
    listId?: SortOrder
    itemId?: SortOrder
    sortOrder?: SortOrder
  }

  export type IntWithAggregatesFilter = {
    equals?: number
    in?: Enumerable<number> | number
    notIn?: Enumerable<number> | number
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedIntWithAggregatesFilter | number
    _count?: NestedIntFilter
    _avg?: NestedFloatFilter
    _sum?: NestedIntFilter
    _min?: NestedIntFilter
    _max?: NestedIntFilter
  }

  export type BoolFilter = {
    equals?: boolean
    not?: NestedBoolFilter | boolean
  }

  export type PilotUserCountOrderByAggregateInput = {
    userId?: SortOrder
    mozillaEmployee?: SortOrder
    createdBy?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
  }

  export type PilotUserAvgOrderByAggregateInput = {
    userId?: SortOrder
  }

  export type PilotUserMaxOrderByAggregateInput = {
    userId?: SortOrder
    mozillaEmployee?: SortOrder
    createdBy?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
  }

  export type PilotUserMinOrderByAggregateInput = {
    userId?: SortOrder
    mozillaEmployee?: SortOrder
    createdBy?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
  }

  export type PilotUserSumOrderByAggregateInput = {
    userId?: SortOrder
  }

  export type BoolWithAggregatesFilter = {
    equals?: boolean
    not?: NestedBoolWithAggregatesFilter | boolean
    _count?: NestedIntFilter
    _min?: NestedBoolFilter
    _max?: NestedBoolFilter
  }

  export type ListItemCreateNestedManyWithoutListInput = {
    create?: XOR<Enumerable<ListItemCreateWithoutListInput>, Enumerable<ListItemUncheckedCreateWithoutListInput>>
    connectOrCreate?: Enumerable<ListItemCreateOrConnectWithoutListInput>
    createMany?: ListItemCreateManyListInputEnvelope
    connect?: Enumerable<ListItemWhereUniqueInput>
  }

  export type ListItemUncheckedCreateNestedManyWithoutListInput = {
    create?: XOR<Enumerable<ListItemCreateWithoutListInput>, Enumerable<ListItemUncheckedCreateWithoutListInput>>
    connectOrCreate?: Enumerable<ListItemCreateOrConnectWithoutListInput>
    createMany?: ListItemCreateManyListInputEnvelope
    connect?: Enumerable<ListItemWhereUniqueInput>
  }

  export type BigIntFieldUpdateOperationsInput = {
    set?: bigint | number
    increment?: bigint | number
    decrement?: bigint | number
    multiply?: bigint | number
    divide?: bigint | number
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumVisibilityFieldUpdateOperationsInput = {
    set?: Visibility
  }

  export type EnumModerationStatusFieldUpdateOperationsInput = {
    set?: ModerationStatus
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type ListItemUpdateManyWithoutListNestedInput = {
    create?: XOR<Enumerable<ListItemCreateWithoutListInput>, Enumerable<ListItemUncheckedCreateWithoutListInput>>
    connectOrCreate?: Enumerable<ListItemCreateOrConnectWithoutListInput>
    upsert?: Enumerable<ListItemUpsertWithWhereUniqueWithoutListInput>
    createMany?: ListItemCreateManyListInputEnvelope
    set?: Enumerable<ListItemWhereUniqueInput>
    disconnect?: Enumerable<ListItemWhereUniqueInput>
    delete?: Enumerable<ListItemWhereUniqueInput>
    connect?: Enumerable<ListItemWhereUniqueInput>
    update?: Enumerable<ListItemUpdateWithWhereUniqueWithoutListInput>
    updateMany?: Enumerable<ListItemUpdateManyWithWhereWithoutListInput>
    deleteMany?: Enumerable<ListItemScalarWhereInput>
  }

  export type ListItemUncheckedUpdateManyWithoutListNestedInput = {
    create?: XOR<Enumerable<ListItemCreateWithoutListInput>, Enumerable<ListItemUncheckedCreateWithoutListInput>>
    connectOrCreate?: Enumerable<ListItemCreateOrConnectWithoutListInput>
    upsert?: Enumerable<ListItemUpsertWithWhereUniqueWithoutListInput>
    createMany?: ListItemCreateManyListInputEnvelope
    set?: Enumerable<ListItemWhereUniqueInput>
    disconnect?: Enumerable<ListItemWhereUniqueInput>
    delete?: Enumerable<ListItemWhereUniqueInput>
    connect?: Enumerable<ListItemWhereUniqueInput>
    update?: Enumerable<ListItemUpdateWithWhereUniqueWithoutListInput>
    updateMany?: Enumerable<ListItemUpdateManyWithWhereWithoutListInput>
    deleteMany?: Enumerable<ListItemScalarWhereInput>
  }

  export type ListCreateNestedOneWithoutListItemsInput = {
    create?: XOR<ListCreateWithoutListItemsInput, ListUncheckedCreateWithoutListItemsInput>
    connectOrCreate?: ListCreateOrConnectWithoutListItemsInput
    connect?: ListWhereUniqueInput
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type ListUpdateOneRequiredWithoutListItemsNestedInput = {
    create?: XOR<ListCreateWithoutListItemsInput, ListUncheckedCreateWithoutListItemsInput>
    connectOrCreate?: ListCreateOrConnectWithoutListItemsInput
    upsert?: ListUpsertWithoutListItemsInput
    connect?: ListWhereUniqueInput
    update?: XOR<ListUpdateWithoutListItemsInput, ListUncheckedUpdateWithoutListItemsInput>
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type NestedBigIntFilter = {
    equals?: bigint | number
    in?: Enumerable<bigint> | Enumerable<number> | bigint | number
    notIn?: Enumerable<bigint> | Enumerable<number> | bigint | number
    lt?: bigint | number
    lte?: bigint | number
    gt?: bigint | number
    gte?: bigint | number
    not?: NestedBigIntFilter | bigint | number
  }

  export type NestedStringFilter = {
    equals?: string
    in?: Enumerable<string> | string
    notIn?: Enumerable<string> | string
    lt?: string
    lte?: string
    gt?: string
    gte?: string
    contains?: string
    startsWith?: string
    endsWith?: string
    not?: NestedStringFilter | string
  }

  export type NestedStringNullableFilter = {
    equals?: string | null
    in?: Enumerable<string> | string | null
    notIn?: Enumerable<string> | string | null
    lt?: string
    lte?: string
    gt?: string
    gte?: string
    contains?: string
    startsWith?: string
    endsWith?: string
    not?: NestedStringNullableFilter | string | null
  }

  export type NestedEnumVisibilityFilter = {
    equals?: Visibility
    in?: Enumerable<Visibility>
    notIn?: Enumerable<Visibility>
    not?: NestedEnumVisibilityFilter | Visibility
  }

  export type NestedEnumModerationStatusFilter = {
    equals?: ModerationStatus
    in?: Enumerable<ModerationStatus>
    notIn?: Enumerable<ModerationStatus>
    not?: NestedEnumModerationStatusFilter | ModerationStatus
  }

  export type NestedDateTimeFilter = {
    equals?: Date | string
    in?: Enumerable<Date> | Enumerable<string> | Date | string
    notIn?: Enumerable<Date> | Enumerable<string> | Date | string
    lt?: Date | string
    lte?: Date | string
    gt?: Date | string
    gte?: Date | string
    not?: NestedDateTimeFilter | Date | string
  }

  export type NestedBigIntWithAggregatesFilter = {
    equals?: bigint | number
    in?: Enumerable<bigint> | Enumerable<number> | bigint | number
    notIn?: Enumerable<bigint> | Enumerable<number> | bigint | number
    lt?: bigint | number
    lte?: bigint | number
    gt?: bigint | number
    gte?: bigint | number
    not?: NestedBigIntWithAggregatesFilter | bigint | number
    _count?: NestedIntFilter
    _avg?: NestedFloatFilter
    _sum?: NestedBigIntFilter
    _min?: NestedBigIntFilter
    _max?: NestedBigIntFilter
  }

  export type NestedIntFilter = {
    equals?: number
    in?: Enumerable<number> | number
    notIn?: Enumerable<number> | number
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedIntFilter | number
  }

  export type NestedFloatFilter = {
    equals?: number
    in?: Enumerable<number> | number
    notIn?: Enumerable<number> | number
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedFloatFilter | number
  }

  export type NestedStringWithAggregatesFilter = {
    equals?: string
    in?: Enumerable<string> | string
    notIn?: Enumerable<string> | string
    lt?: string
    lte?: string
    gt?: string
    gte?: string
    contains?: string
    startsWith?: string
    endsWith?: string
    not?: NestedStringWithAggregatesFilter | string
    _count?: NestedIntFilter
    _min?: NestedStringFilter
    _max?: NestedStringFilter
  }

  export type NestedStringNullableWithAggregatesFilter = {
    equals?: string | null
    in?: Enumerable<string> | string | null
    notIn?: Enumerable<string> | string | null
    lt?: string
    lte?: string
    gt?: string
    gte?: string
    contains?: string
    startsWith?: string
    endsWith?: string
    not?: NestedStringNullableWithAggregatesFilter | string | null
    _count?: NestedIntNullableFilter
    _min?: NestedStringNullableFilter
    _max?: NestedStringNullableFilter
  }

  export type NestedIntNullableFilter = {
    equals?: number | null
    in?: Enumerable<number> | number | null
    notIn?: Enumerable<number> | number | null
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedIntNullableFilter | number | null
  }

  export type NestedEnumVisibilityWithAggregatesFilter = {
    equals?: Visibility
    in?: Enumerable<Visibility>
    notIn?: Enumerable<Visibility>
    not?: NestedEnumVisibilityWithAggregatesFilter | Visibility
    _count?: NestedIntFilter
    _min?: NestedEnumVisibilityFilter
    _max?: NestedEnumVisibilityFilter
  }

  export type NestedEnumModerationStatusWithAggregatesFilter = {
    equals?: ModerationStatus
    in?: Enumerable<ModerationStatus>
    notIn?: Enumerable<ModerationStatus>
    not?: NestedEnumModerationStatusWithAggregatesFilter | ModerationStatus
    _count?: NestedIntFilter
    _min?: NestedEnumModerationStatusFilter
    _max?: NestedEnumModerationStatusFilter
  }

  export type NestedDateTimeWithAggregatesFilter = {
    equals?: Date | string
    in?: Enumerable<Date> | Enumerable<string> | Date | string
    notIn?: Enumerable<Date> | Enumerable<string> | Date | string
    lt?: Date | string
    lte?: Date | string
    gt?: Date | string
    gte?: Date | string
    not?: NestedDateTimeWithAggregatesFilter | Date | string
    _count?: NestedIntFilter
    _min?: NestedDateTimeFilter
    _max?: NestedDateTimeFilter
  }

  export type NestedIntWithAggregatesFilter = {
    equals?: number
    in?: Enumerable<number> | number
    notIn?: Enumerable<number> | number
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedIntWithAggregatesFilter | number
    _count?: NestedIntFilter
    _avg?: NestedFloatFilter
    _sum?: NestedIntFilter
    _min?: NestedIntFilter
    _max?: NestedIntFilter
  }

  export type NestedBoolFilter = {
    equals?: boolean
    not?: NestedBoolFilter | boolean
  }

  export type NestedBoolWithAggregatesFilter = {
    equals?: boolean
    not?: NestedBoolWithAggregatesFilter | boolean
    _count?: NestedIntFilter
    _min?: NestedBoolFilter
    _max?: NestedBoolFilter
  }

  export type ListItemCreateWithoutListInput = {
    id?: bigint | number
    externalId?: string
    itemId: bigint | number
    url?: string | null
    title?: string | null
    excerpt?: string | null
    note?: string | null
    imageUrl?: string | null
    publisher?: string | null
    authors?: string | null
    sortOrder?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ListItemUncheckedCreateWithoutListInput = {
    id?: bigint | number
    externalId?: string
    itemId: bigint | number
    url?: string | null
    title?: string | null
    excerpt?: string | null
    note?: string | null
    imageUrl?: string | null
    publisher?: string | null
    authors?: string | null
    sortOrder?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ListItemCreateOrConnectWithoutListInput = {
    where: ListItemWhereUniqueInput
    create: XOR<ListItemCreateWithoutListInput, ListItemUncheckedCreateWithoutListInput>
  }

  export type ListItemCreateManyListInputEnvelope = {
    data: Enumerable<ListItemCreateManyListInput>
    skipDuplicates?: boolean
  }

  export type ListItemUpsertWithWhereUniqueWithoutListInput = {
    where: ListItemWhereUniqueInput
    update: XOR<ListItemUpdateWithoutListInput, ListItemUncheckedUpdateWithoutListInput>
    create: XOR<ListItemCreateWithoutListInput, ListItemUncheckedCreateWithoutListInput>
  }

  export type ListItemUpdateWithWhereUniqueWithoutListInput = {
    where: ListItemWhereUniqueInput
    data: XOR<ListItemUpdateWithoutListInput, ListItemUncheckedUpdateWithoutListInput>
  }

  export type ListItemUpdateManyWithWhereWithoutListInput = {
    where: ListItemScalarWhereInput
    data: XOR<ListItemUpdateManyMutationInput, ListItemUncheckedUpdateManyWithoutListItemsInput>
  }

  export type ListItemScalarWhereInput = {
    AND?: Enumerable<ListItemScalarWhereInput>
    OR?: Enumerable<ListItemScalarWhereInput>
    NOT?: Enumerable<ListItemScalarWhereInput>
    id?: BigIntFilter | bigint | number
    externalId?: StringFilter | string
    listId?: BigIntFilter | bigint | number
    itemId?: BigIntFilter | bigint | number
    url?: StringNullableFilter | string | null
    title?: StringNullableFilter | string | null
    excerpt?: StringNullableFilter | string | null
    note?: StringNullableFilter | string | null
    imageUrl?: StringNullableFilter | string | null
    publisher?: StringNullableFilter | string | null
    authors?: StringNullableFilter | string | null
    sortOrder?: IntFilter | number
    createdAt?: DateTimeFilter | Date | string
    updatedAt?: DateTimeFilter | Date | string
  }

  export type ListCreateWithoutListItemsInput = {
    id?: bigint | number
    externalId?: string
    userId: bigint | number
    slug?: string | null
    title: string
    description?: string | null
    status?: Visibility
    moderationStatus?: ModerationStatus
    moderatedBy?: string | null
    moderationReason?: string | null
    moderationDetails?: string | null
    restorationReason?: string | null
    listItemNoteVisibility?: Visibility
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ListUncheckedCreateWithoutListItemsInput = {
    id?: bigint | number
    externalId?: string
    userId: bigint | number
    slug?: string | null
    title: string
    description?: string | null
    status?: Visibility
    moderationStatus?: ModerationStatus
    moderatedBy?: string | null
    moderationReason?: string | null
    moderationDetails?: string | null
    restorationReason?: string | null
    listItemNoteVisibility?: Visibility
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ListCreateOrConnectWithoutListItemsInput = {
    where: ListWhereUniqueInput
    create: XOR<ListCreateWithoutListItemsInput, ListUncheckedCreateWithoutListItemsInput>
  }

  export type ListUpsertWithoutListItemsInput = {
    update: XOR<ListUpdateWithoutListItemsInput, ListUncheckedUpdateWithoutListItemsInput>
    create: XOR<ListCreateWithoutListItemsInput, ListUncheckedCreateWithoutListItemsInput>
  }

  export type ListUpdateWithoutListItemsInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    externalId?: StringFieldUpdateOperationsInput | string
    userId?: BigIntFieldUpdateOperationsInput | bigint | number
    slug?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumVisibilityFieldUpdateOperationsInput | Visibility
    moderationStatus?: EnumModerationStatusFieldUpdateOperationsInput | ModerationStatus
    moderatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    moderationReason?: NullableStringFieldUpdateOperationsInput | string | null
    moderationDetails?: NullableStringFieldUpdateOperationsInput | string | null
    restorationReason?: NullableStringFieldUpdateOperationsInput | string | null
    listItemNoteVisibility?: EnumVisibilityFieldUpdateOperationsInput | Visibility
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ListUncheckedUpdateWithoutListItemsInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    externalId?: StringFieldUpdateOperationsInput | string
    userId?: BigIntFieldUpdateOperationsInput | bigint | number
    slug?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumVisibilityFieldUpdateOperationsInput | Visibility
    moderationStatus?: EnumModerationStatusFieldUpdateOperationsInput | ModerationStatus
    moderatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    moderationReason?: NullableStringFieldUpdateOperationsInput | string | null
    moderationDetails?: NullableStringFieldUpdateOperationsInput | string | null
    restorationReason?: NullableStringFieldUpdateOperationsInput | string | null
    listItemNoteVisibility?: EnumVisibilityFieldUpdateOperationsInput | Visibility
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ListItemCreateManyListInput = {
    id?: bigint | number
    externalId?: string
    itemId: bigint | number
    url?: string | null
    title?: string | null
    excerpt?: string | null
    note?: string | null
    imageUrl?: string | null
    publisher?: string | null
    authors?: string | null
    sortOrder?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ListItemUpdateWithoutListInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    externalId?: StringFieldUpdateOperationsInput | string
    itemId?: BigIntFieldUpdateOperationsInput | bigint | number
    url?: NullableStringFieldUpdateOperationsInput | string | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    excerpt?: NullableStringFieldUpdateOperationsInput | string | null
    note?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    publisher?: NullableStringFieldUpdateOperationsInput | string | null
    authors?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ListItemUncheckedUpdateWithoutListInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    externalId?: StringFieldUpdateOperationsInput | string
    itemId?: BigIntFieldUpdateOperationsInput | bigint | number
    url?: NullableStringFieldUpdateOperationsInput | string | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    excerpt?: NullableStringFieldUpdateOperationsInput | string | null
    note?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    publisher?: NullableStringFieldUpdateOperationsInput | string | null
    authors?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ListItemUncheckedUpdateManyWithoutListItemsInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    externalId?: StringFieldUpdateOperationsInput | string
    itemId?: BigIntFieldUpdateOperationsInput | bigint | number
    url?: NullableStringFieldUpdateOperationsInput | string | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    excerpt?: NullableStringFieldUpdateOperationsInput | string | null
    note?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    publisher?: NullableStringFieldUpdateOperationsInput | string | null
    authors?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}