import {
  ArrayFieldError,
  InputValidationError,
} from '../../errors/InputValidationError';

export type ItemAction = {
  action: ItemActionNames;
  itemId?: number;
  url?: string;
  time: number;
};

export type ItemAddAction = {
  action: AddActionName;
  itemId?: number;
  tags?: string[];
  time: number;
  title?: string;
  url?: string;
};

export type ItemTagAction = {
  action: ItemTagActionNames;
  tags: string[];
  itemId?: number;
  url?: string;
  time: number;
};

export type TagRenameAction = {
  action: TagRenameActionName;
  newTag: string;
  oldTag: string;
  time: number;
};

export type TagDeleteAction = {
  action: TagDeleteActionName;
  tag: string;
  time: number;
};

export type SaveSearchAction = {
  action: SaveSearchActionName;
  term: string;
  time: number;
};

type Annotation = {
  id?: string;
  quote: string;
  patch: string;
  version: number;
};

export type AddAnnotationAction = {
  action: AddAnnotationActionName;
  annotation: Annotation;
  itemId?: number;
  url?: string;
  time: number;
};

export type DeleteAnnotationAction = {
  action: DeleteAnnotationActionName;
  id: string;
  time: number;
};

export type UnimplementedAction = {
  action: string;
};

export type SendAction =
  | ItemAction
  | ItemAddAction
  | ItemTagAction
  | TagDeleteAction
  | TagRenameAction
  | SaveSearchAction
  | AddAnnotationAction
  | DeleteAnnotationAction
  | UnimplementedAction;

type ItemActionNames =
  | 'archive'
  | 'readd'
  | 'favorite'
  | 'unfavorite'
  | 'delete'
  | 'tags_clear';

type AddActionName = 'add';
type TagRenameActionName = 'tag_rename';
type TagDeleteActionName = 'tag_delete';
type ItemTagActionNames = 'tags_add' | 'tags_remove' | 'tags_replace';
type SaveSearchActionName = 'recent_search';
type AddAnnotationActionName = 'add_annotation';
type DeleteAnnotationActionName = 'delete_annotation';
type ActionNames =
  | ItemActionNames
  | AddActionName
  | TagRenameActionName
  | TagDeleteActionName
  | ItemTagActionNames
  | SaveSearchActionName
  | AddAnnotationActionName
  | DeleteAnnotationActionName
  | string;

export type MaybeAction = {
  [key: string]: any;
  item_id?: string;
  tags?: string | string[];
  url?: string;
  time?: string;
  new_tag?: string;
  old_tag?: string;
  tag?: string;
  title?: string;
  action: ActionNames;
  search?: string;
  annotation?: any;
  annotation_id?: string;
};

type Constructor<T> = new (...args: any[]) => T;
type ActionSanitizable = Constructor<{
  input: MaybeAction;
}>;
type ItemProps = Constructor<ItemAction>;
type ItemTagProps = Constructor<ItemTagAction>;
type TagRenameProps = Constructor<TagRenameAction>;
type TagDeleteProps = Constructor<TagDeleteAction>;
type ItemAddProps = Constructor<ItemAddAction>;
type SaveSearchProps = Constructor<SaveSearchAction>;
type AddAnnotationProps = Constructor<AddAnnotationAction>;
type DeleteAnnotationProps = Constructor<DeleteAnnotationAction>;

/**
 * Class mixin for input validation. Use to construct a Validation/Sanitizer
 * class which has the rule: either there must be a valid item_id or url
 * (or both technically) in the input passed to the constructor.
 * Must be called with a Class that implements or extends the
 * ActionSanitizable type (constructor with a single argument, `input`,
 * which contains an object minimally with a valid key-value pair for 'action').
 *
 * Can be chained with other mixins to add additional validation rules.
 * Should be used with a "Sanitize" class (see below) to return sanitized
 * data which conforms to the expected action schema.
 *
 * Example:
 * ```
 * # Minimal functionality
 * const ThrowIfNoItemOrUrl = HasItemIdOrUrl(NamedAction<ItemActionNames>)
 * new ThrowIfNoItemOrUrl({action: 'add'}) // throws
 * // Example with sanitizer
 * const ItemActionSanitizer = SanitizedItem(HasItemIdOrUrl(NamedAction<ItemActionNames>))
 * const validItemAction = new ItemActionSanitizer.validate({action: 'favorite', item_id: '12345'})
 * // returns { action: 'favorite', itemId: 12345 }
 * ```
 */
function HasItemIdOrUrl<TBase extends ActionSanitizable>(Base: TBase) {
  return class HasItemIdOrUrl extends Base {
    readonly itemId?: number;
    readonly url?: string;
    constructor(...args: any[]) {
      super(...args);
      if (
        !(
          ('item_id' in this.input && this.input['item_id'] != null) ||
          ('url' in this.input && this.input['url'] != null)
        )
      ) {
        const error: ArrayFieldError = {
          type: 'array_field',
          path: 'actions',
          msg: `Invalid action: must provide either item_id or url`,
          value: this.input,
        };
        // All other actions require one of item_id or url
        throw new InputValidationError(error);
      }
      if ('item_id' in this.input && this.input['item_id'] != null) {
        // parseInt has some unexpected behavior for strings that
        // contain numerals + numbers, e.g. parseInt('123abc') returns 123.
        // In this case, these numeric strings only contain numerals
        const hasNonNumeral = this.input.item_id.toString().match(/\D/)?.length;
        const itemId = parseInt(this.input.item_id);
        if (hasNonNumeral || isNaN(itemId) || itemId < 0) {
          const error: ArrayFieldError = {
            type: 'array_field',
            path: 'item_id',
            msg: `Invalid item_id: ${this.input.item_id}`,
            value: this.input.item_id,
          };
          throw new InputValidationError(error);
        }
        this.itemId = itemId;
      }
      if ('url' in this.input && this.input['url'] != null) {
        try {
          new URL(this.input.url);
          this.url = this.input.url;
        } catch (e) {
          const error: ArrayFieldError = {
            type: 'array_field',
            path: 'url',
            msg: `Invalid url: ${this.input.url}`,
            value: this.input.url,
          };
          throw new InputValidationError(error);
        }
      }
    }
  };
}

/**
 * Class mixin for input validation. Use to construct a Validation/Sanitizer
 * class which has the rule: there might be a valid `time` (number) field
 * in the input passed to the constructor. Just validates that `time` is
 * a valid number -- does not impose constraints on the time itself.
 * If no timestamp is passed, it will default to the current time in seconds
 * from epoch.
 *
 * Must be called with a Class that implements or extends the
 * ActionSanitizable type (constructor with a single argument, `input`,
 * which contains an object minimally with a valid key-value pair for 'action').
 *
 * Can be chained with other mixins to add additional validation rules.
 * Should be used with a "Sanitize" class to return sanitized
 * data which conforms to the expected action schema. See `HasItemIdOrUrl`
 * for example usage.
 */
function HasTimeOrDefault<TBase extends ActionSanitizable>(Base: TBase) {
  return class HasTimeOrDefault extends Base {
    readonly time: number;
    constructor(...args: any[]) {
      super(...args);
      if ('time' in this.input) {
        // parseInt has some unexpected behavior for strings that
        // contain numerals + numbers, e.g. parseInt('123abc') returns 123.
        // Also, it will parse date timestamps that just have numerals
        // and '-' as subtraction operations.
        // In this case, these numeric strings only contain numerals.
        const hasNonNumeral = this.input.time.toString().match(/\D/)?.length;
        const time = parseInt(this.input.time);
        if (hasNonNumeral || isNaN(time)) {
          const error: ArrayFieldError = {
            type: 'array_field',
            path: 'time',
            msg: `Invalid time: ${this.input.time}`,
            value: this.input.time,
          };
          throw new InputValidationError(error);
        }
        this.time = time;
      } else {
        // Time in seconds from epoch
        this.time = Math.round(Date.now() / 1000);
      }
    }
  };
}

/**
 * Class mixin for input validation. Use to construct a Validation/Sanitizer
 * class which has the rule: there might be a valid `tags` field
 * in the input passed to the constructor. If present, checks to ensure
 * that the tags field is a comma-separated string with at least one element,
 * and none of the elements are empty. Transforms the input to an array of tags
 * if the validation succeeds.
 *
 * Must be called with a Class that implements or extends the
 * ActionSanitizable type (constructor with a single argument, `input`,
 * which contains an object minimally with a valid key-value pair for 'action').
 *
 * Can be chained with other mixins to add additional validation rules.
 * Should be used with a "Sanitize" class to return sanitized
 * data which conforms to the expected action schema. See `HasItemIdOrUrl`
 * for example usage.
 */
function MaybeHasTags<TBase extends ActionSanitizable>(Base: TBase) {
  return class MaybeHasTags extends Base {
    readonly tags: string[] | undefined;
    constructor(...args: any[]) {
      super(...args);
      if ('tags' in this.input) {
        let tags: string[];
        if (typeof this.input.tags === 'string') {
          tags = this.input.tags.split(',');
        } else {
          tags = this.input.tags;
        }
        validTagsOrError(tags);
        this.tags = tags;
      }
    }
  };
}

/**
 * Class mixin for input validation. Use to construct a Validation/Sanitizer
 * class which has the rule: there must be a valid `tags` field
 * in the input passed to the constructor. Checks to ensure
 * that the tags field is a comma-separated string with at least one element,
 * and none of the elements are empty. Transforms the input to an array of tags
 * if the validation succeeds.
 *
 * Must be called with a Class that implements or extends the
 * ActionSanitizable type (constructor with a single argument, `input`,
 * which contains an object minimally with a valid key-value pair for 'action').
 *
 * Can be chained with other mixins to add additional validation rules.
 * Should be used with a "Sanitize" class to return sanitized
 * data which conforms to the expected action schema. See `HasItemIdOrUrl`
 * for example usage.
 */
function HasValidTags<TBase extends ActionSanitizable>(Base: TBase) {
  return class ValidTags extends Base {
    tags: string[];
    constructor(...args: any[]) {
      super(...args);
      if (!('tags' in this.input)) {
        const error: ArrayFieldError = {
          type: 'array_field',
          path: 'tags',
          msg: `Action must have tags field`,
          value: this.input.tags,
        };
        throw new InputValidationError(error);
      }
      let tags: string[];
      if (typeof this.input.tags === 'string') {
        tags = this.input.tags.split(',');
      } else {
        tags = this.input.tags;
      }
      validTagsOrError(tags);
      this.tags = tags;
    }
  };
}

/**
 * Class mixin for input validation. Use to construct a Validation/Sanitizer
 * class which has the rule: there must be a valid `new_tag` field
 * in the input passed to the constructor. It must be a non-empty string.
 *
 * Must be called with a Class that implements or extends the
 * ActionSanitizable type (constructor with a single argument, `input`,
 * which contains an object minimally with a valid key-value pair for 'action').
 *
 * Can be chained with other mixins to add additional validation rules.
 * Should be used with a "Sanitize" class to return sanitized
 * data which conforms to the expected action schema. See `HasItemIdOrUrl`
 * for example usage.
 */
function HasNewTag<TBase extends ActionSanitizable>(Base: TBase) {
  return class extends Base {
    readonly newTag: string;
    constructor(...args: any[]) {
      super(...args);
      nonEmptyStringPropOrError(this.input, 'new_tag');
      this.newTag = this.input.new_tag;
    }
  };
}

/**
 * Class mixin for input validation. Use to construct a Validation/Sanitizer
 * class which has the rule: there must be a valid `old_tag` field
 * in the input passed to the constructor. It must be a non-empty string.
 *
 * Must be called with a Class that implements or extends the
 * ActionSanitizable type (constructor with a single argument, `input`,
 * which contains an object minimally with a valid key-value pair for 'action').
 *
 * Can be chained with other mixins to add additional validation rules.
 * Should be used with a "Sanitize" class to return sanitized
 * data which conforms to the expected action schema. See `HasItemIdOrUrl`
 * for example usage.
 */
function HasOldTag<TBase extends ActionSanitizable>(Base: TBase) {
  return class extends Base {
    readonly oldTag: string;
    constructor(...args: any[]) {
      super(...args);
      nonEmptyStringPropOrError(this.input, 'old_tag');
      this.oldTag = this.input.old_tag;
    }
  };
}

/**
 * Class mixin for input validation. Use to construct a Validation/Sanitizer
 * class which has the rule: there must be a valid `tag` field
 * in the input passed to the constructor. It must be a non-empty string.
 *
 * Must be called with a Class that implements or extends the
 * ActionSanitizable type (constructor with a single argument, `input`,
 * which contains an object minimally with a valid key-value pair for 'action').
 *
 * Can be chained with other mixins to add additional validation rules.
 * Should be used with a "Sanitize" class to return sanitized
 * data which conforms to the expected action schema. See `HasItemIdOrUrl`
 * for example usage.
 */
function HasTag<TBase extends ActionSanitizable>(Base: TBase) {
  return class HasTag extends Base {
    readonly tag: string;
    constructor(...args: any[]) {
      super(...args);
      nonEmptyStringPropOrError(this.input, 'tag');
      this.tag = this.input.tag;
    }
  };
}

/**
 * Class mixin for input validation. Use to construct a Validation/Sanitizer
 * class which has the rule: there must be a valid `search` field
 * in the input passed to the constructor. It must be a non-empty string.
 *
 * Must be called with a Class that implements or extends the
 * ActionSanitizable type (constructor with a single argument, `input`,
 * which contains an object minimally with a valid key-value pair for 'action').
 *
 * Can be chained with other mixins to add additional validation rules.
 * Should be used with a "Sanitize" class to return sanitized
 * data which conforms to the expected action schema. See `HasItemIdOrUrl`
 * for example usage.
 */
function HasSearchTerm<TBase extends ActionSanitizable>(Base: TBase) {
  return class HasSearchTerm extends Base {
    readonly term: string;
    constructor(...args: any[]) {
      super(...args);
      nonEmptyStringPropOrError(this.input, 'search');
      this.term = this.input.search;
    }
  };
}

/**
 * Class mixin for input validation. Use to construct a Validation/Sanitizer
 * class which has the rule: there might be a valid `title` field
 * in the input passed to the constructor. If present, it must be a non-empty string.
 * Null values are allowed as inputs, but skipped.
 *
 * Must be called with a Class that implements or extends the
 * ActionSanitizable type (constructor with a single argument, `input`,
 * which contains an object minimally with a valid key-value pair for 'action').
 *
 * Can be chained with other mixins to add additional validation rules.
 * Should be used with a "Sanitize" class to return sanitized
 * data which conforms to the expected action schema. See `HasItemIdOrUrl`
 * for example usage.
 */
function MaybeHasTitle<TBase extends ActionSanitizable>(Base: TBase) {
  return class MaybeHasTitle extends Base {
    readonly title: string;
    constructor(...args: any[]) {
      super(...args);
      if (
        'title' in this.input &&
        (this.input.title == null || this.input.title == 'null')
      )
        return;
      if (
        'title' in this.input &&
        (!(typeof this.input.title === 'string') || this.input.title === '')
      ) {
        const error: ArrayFieldError = {
          type: 'array_field',
          path: 'title',
          msg: `Field title must be a non-empty string.`,
          value: this.input.title,
        };
        throw new InputValidationError(error);
      }
      this.title = this.input.title;
    }
  };
}

/**
 * Throws if the property `key` is in the object `input` and is an empty string.
 */
function nonEmptyStringPropOrError(input: MaybeAction, key: string): void {
  if (
    !(key in input) ||
    !(typeof input[key] === 'string') ||
    input[key] === ''
  ) {
    const error: ArrayFieldError = {
      type: 'array_field',
      path: key,
      msg: `Action must have non-empty ${key} field`,
      value: input[key],
    };
    throw new InputValidationError(error);
  }
}

/**
 * Throws if `tags` array is empty or contains an empty string.
 */
function validTagsOrError(tags: string[]): void {
  if (tags.length <= 0) {
    const error: ArrayFieldError = {
      type: 'array_field',
      path: 'tags',
      msg: `Tags input cannot be empty`,
      value: tags,
    };
    throw new InputValidationError(error);
  }
  if (tags.filter((v) => v === '').length > 0) {
    const error: ArrayFieldError = {
      type: 'array_field',
      path: 'tags',
      msg: `Tag cannot be an empty string`,
      value: tags,
    };
    throw new InputValidationError(error);
  }
}

/**
 * Class mixin for input validation. Use to construct a Validation/Sanitizer
 * class which has the rule: there is a valid 'annotaiton' input.
 *
 * Must be called with a Class that implements or extends the
 * ActionSanitizable type (constructor with a single argument, `input`,
 * which contains an object minimally with a valid key-value pair for 'action').
 *
 * Can be chained with other mixins to add additional validation rules.
 * Should be used with a "Sanitize" class to return sanitized
 * data which conforms to the expected action schema. See `HasItemIdOrUrl`
 * for example usage.
 */
function HasAnnotation<TBase extends ActionSanitizable>(Base: TBase) {
  return class HasAnnotation extends Base {
    readonly annotation: Annotation;
    constructor(...args: any[]) {
      super(...args);
      const isVersionValid =
        'annotation' in this.input &&
        this.input.annotation?.version &&
        parseInt(this.input.annotation.version) === 2;
      if (!isVersionValid) {
        const error: ArrayFieldError = {
          type: 'array_field',
          path: 'title',
          msg: `Field 'annotation.version' must be 2`,
          value: this.input.annotation?.version,
        };
        throw new InputValidationError(error);
      }
      const isValid =
        'annotation' in this.input &&
        this.input.annotation != null &&
        this.input.annotation.annotation_id?.length &&
        this.input.annotation.patch?.length &&
        this.input.annotation.quote?.length &&
        isVersionValid;
      if (!isValid) {
        const error: ArrayFieldError = {
          type: 'array_field',
          path: 'title',
          msg:
            `Field 'annotation' must be an object with the following fields:` +
            `'annotation_id' (string), 'patch' (string), 'quote' (string), 'version' (number)`,
          value: JSON.stringify(this.input.annotation),
        };
        throw new InputValidationError(error);
      }
      this.annotation = {
        id: this.input.annotation.annotation_id,
        patch: this.input.annotation.patch,
        quote: this.input.annotation.quote,
        version: parseInt(this.input.annotation.version),
      };
    }
  };
}

/**
 * Class mixin for input validation. Use to construct a Validation/Sanitizer
 * class which has the rule: there must be a valid `tag` field
 * in the input passed to the constructor. It must be a non-empty string.
 *
 * Must be called with a Class that implements or extends the
 * ActionSanitizable type (constructor with a single argument, `input`,
 * which contains an object minimally with a valid key-value pair for 'action').
 *
 * Can be chained with other mixins to add additional validation rules.
 * Should be used with a "Sanitize" class to return sanitized
 * data which conforms to the expected action schema. See `HasItemIdOrUrl`
 * for example usage.
 */
function HasAnnotationId<TBase extends ActionSanitizable>(Base: TBase) {
  return class HasAnnotationId extends Base {
    readonly id: string;
    constructor(...args: any[]) {
      super(...args);
      nonEmptyStringPropOrError(this.input, 'annotation_id');
      this.id = this.input.annotation_id;
    }
  };
}

/**
 * Base class for building validators. Takes as input to the
 * constructor an object which contains an 'action' key with
 * a valid action, and potentially other key-value string pairs.
 * Makes the input value accessible to other mixins.
 *
 * Example:
 * `SanitizedTagDelete(HasTimeOrDefault(HasTag(NamedAction<'tag_delete'>)))`
 */
class NamedAction<Action extends ActionNames> {
  readonly action: Action;
  constructor(
    public readonly input: {
      [key: string]: any;
      action: Action;
    },
  ) {
    this.action = input.action;
  }
}

/**
 * Mixin for returning validated and sanitized ItemAction:
 * 'favorite', 'unfavorite', 'archive', 'readd', 'delete', 'tags_clear'.
 *
 * Chain with other validators/sanitizers to set rules.
 * Example:
 * ```
 * const ItemActionSanitizer = SanitizedItem(HasItemIdOrUrl(HasTimeOrDefault(NamedAction<ItemActionNames>)))
 * const validAction = ItemActionSanitizer(
 *  {action: 'favorite', item_id: '12345', time: '1923938382'}
 * ).validate() // returns { action: 'favorite', itemId: 12345, time: 1923938382 }
 * ```
 */
function SanitizedItem<TBase extends ItemProps>(Base: TBase) {
  return class extends Base {
    constructor(...args: any[]) {
      super(...args);
    }
    public validate(): ItemAction {
      return {
        action: this.action,
        time: this.time,
        ...(this.url && { url: this.url }),
        ...(this.itemId != null && { itemId: this.itemId }),
      };
    }
  };
}

/**
 * Mixin for returning validated and sanitized ItemTag action:
 * 'tags_add', 'tags_remove', 'tags_replace'
 *
 * Chain with other validators/sanitizers to set rules.
 * See `SanitizedItem` for an example with a similar class.
 */
function SanitizedItemTag<TBase extends ItemTagProps>(Base: TBase) {
  return class extends Base {
    constructor(...args: any[]) {
      super(...args);
    }
    public validate(): ItemTagAction {
      return {
        action: this.action,
        tags: this.tags,
        time: this.time,
        ...(this.itemId != null && { itemId: this.itemId }),
        ...(this.url && { url: this.url }),
      };
    }
  };
}

/**
 * Mixin for returning validated and sanitized Tag Rename
 * action: 'tag_rename'.
 *
 * Chain with other validators/sanitizers to set rules.
 * See `SanitizedItem` for an example with a similar class.
 */
function SanitizedTagRename<TBase extends TagRenameProps>(Base: TBase) {
  return class extends Base {
    constructor(...args: any[]) {
      super(...args);
    }
    public validate(): TagRenameAction {
      return {
        action: this.action,
        oldTag: this.oldTag,
        newTag: this.newTag,
        time: this.time,
      };
    }
  };
}

/**
 * Mixin for returning validated and sanitized Tag Delete
 * action: 'tag_delete'.
 *
 * Chain with other validators/sanitizers to set rules.
 * See `SanitizedItem` for an example with a similar class.
 */
function SanitizedTagDelete<TBase extends TagDeleteProps>(Base: TBase) {
  return class extends Base {
    constructor(...args: any[]) {
      super(...args);
    }
    public validate(): TagDeleteAction {
      return {
        action: this.action,
        tag: this.tag,
        time: this.time,
      };
    }
  };
}

/**
 * Mixin for returning validated and sanitized Tag Delete
 * action: 'tag_delete'.
 *
 * Chain with other validators/sanitizers to set rules.
 * See `SanitizedItem` for an example with a similar class.
 */
function SanitizedAddItem<TBase extends ItemAddProps>(Base: TBase) {
  return class extends Base {
    constructor(...args: any[]) {
      super(...args);
    }
    public validate(): ItemAddAction {
      return {
        action: this.action,
        time: this.time,
        ...(this.url && { url: this.url }),
        ...(this.itemId != null && { itemId: this.itemId }),
        ...(this.title && { title: this.title }),
        ...(this.tags && { tags: this.tags }),
      };
    }
  };
}

function SanitizedSearch<TBase extends SaveSearchProps>(Base: TBase) {
  return class extends Base {
    constructor(...args: any[]) {
      super(...args);
    }
    public validate(): SaveSearchAction {
      return {
        action: this.action,
        time: this.time,
        term: this.term,
      };
    }
  };
}

function SanitizedAddAnnotation<TBase extends AddAnnotationProps>(Base: TBase) {
  return class extends Base {
    constructor(...args: any[]) {
      super(...args);
    }
    public validate(): AddAnnotationAction {
      return {
        action: this.action,
        time: this.time,
        annotation: this.annotation,
        ...(this.url && { url: this.url }),
        ...(this.itemId != null && { itemId: this.itemId }),
      };
    }
  };
}

function SanitizedDeleteAnnotation<TBase extends DeleteAnnotationProps>(
  Base: TBase,
) {
  return class extends Base {
    constructor(...args: any[]) {
      super(...args);
    }
    public validate(): DeleteAnnotationAction {
      return {
        action: this.action,
        time: this.time,
        id: this.id,
      };
    }
  };
}

/**
 * Sanitizer for actions: 'favorite', 'add', 'readd', 'unfavorite', 'delete', 'archive'.
 * The input must have a valid item_id or url, the action name, and might have
 * a numeric timestamp.
 * Calling `ItemActionSanitizer(input).validate()` returns a valid
 * `ItemAction` object or throws error if validation fails.
 */
export const ItemActionSanitizer = SanitizedItem(
  HasItemIdOrUrl(HasTimeOrDefault(NamedAction<ItemActionNames>)),
);
/**
 * Sanitizer for actions: 'tags_add', 'tags_replace', 'tags_delete'
 * The input must have a valid item_id or url, the action name, a tags array, and might have
 * a numeric timestamp.
 * Calling `ItemTagActionSanitizer(input).validate()` returns a valid
 * `ItemTagAction` object or throws error if validation fails.
 */
export const ItemTagActionSanitizer = SanitizedItemTag(
  HasItemIdOrUrl(
    HasTimeOrDefault(HasValidTags(NamedAction<ItemTagActionNames>)),
  ),
);
/**
 * Sanitizer for action: 'tag_rename'.
 * The input must have a valid 'new_tag', 'old_tag', and maybe a numeric timestamp.
 * Calling `TagRenameActionSanitizer(input).validate()` returns a valid
 * `TagRenameAction` object or throws error if validation fails.
 */
export const TagRenameActionSanitizer = SanitizedTagRename(
  HasTimeOrDefault(HasNewTag(HasOldTag(NamedAction<'tag_rename'>))),
);
/**
 * Sanitizer for action: 'tag_delete'
 * The input must have a valid tag, the action name, and might have
 * a numeric timestamp.
 * Calling `SanitizedTagDelete(input).validate()` returns a valid
 * `TagDeleteAction` object or throws error if validation fails.
 */
export const TagDeleteActionSanitizer = SanitizedTagDelete(
  HasTimeOrDefault(HasTag(NamedAction<'tag_delete'>)),
);
/**
 * Sanitizer for actions: 'add'.
 * The input must have a valid item_id or url, the action name, and might have
 * a numeric timestamp, tags array, or title.
 * Calling `ItemAddActionSanitizer(input).validate()` returns a valid
 * `ItemAddAction` object or throws error if validation fails.
 */
export const ItemAddActionSanitizer = SanitizedAddItem(
  HasItemIdOrUrl(
    HasTimeOrDefault(MaybeHasTags(MaybeHasTitle(NamedAction<'add'>))),
  ),
);

export const AddAnnotationActionSanitizer = SanitizedAddAnnotation(
  HasItemIdOrUrl(
    HasTimeOrDefault(HasAnnotation(NamedAction<'add_annotation'>)),
  ),
);

export const DeleteAnnotationActionSanitizer = SanitizedDeleteAnnotation(
  HasAnnotationId(HasTimeOrDefault(NamedAction<'delete_annotation'>)),
);

export const SaveSearchActionSanitizer = SanitizedSearch(
  HasSearchTerm(HasTimeOrDefault(NamedAction<'recent_search'>)),
);

/**
 * Route input to a proper sanitizer based on action name.
 * This is the main method that should be used from this file.
 */
export function ActionSanitizer(input: MaybeAction): SendAction {
  // Is there a way I can use a map for this without the resulting function
  // getting typecast to 'any' when I do a key-value lookup...?
  switch (input.action) {
    case 'archive':
    case 'readd':
    case 'favorite':
    case 'unfavorite':
    case 'delete':
    case 'tags_clear':
      return new ItemActionSanitizer({
        ...input,
        // Why does typescript infer the type correctly when you
        // copy the input and set action explicitly from input,
        // but not when you just pass through the input? I don't know...
        action: input.action,
      }).validate();
    case 'tags_add':
    case 'tags_remove':
      return new ItemTagActionSanitizer({
        ...input,
        action: input.action,
      }).validate();
    case 'tags_replace':
      // Android sends an empty replacement array rather than
      // using the tags_clear action...
      if (
        input.tags != null &&
        (Array.isArray(input.tags) || typeof input.tags === 'string') &&
        input.tags.length === 0
      )
        return new ItemActionSanitizer({
          ...input,
          action: 'tags_clear',
        });
      else {
        return new ItemTagActionSanitizer({
          ...input,
          action: input.action,
        }).validate();
      }
    case 'tag_delete':
      return new TagDeleteActionSanitizer({
        ...input,
        action: input.action,
      }).validate();
    case 'tag_rename':
      return new TagRenameActionSanitizer({
        ...input,
        action: input.action,
      }).validate();
    case 'add':
      return new ItemAddActionSanitizer({
        ...input,
        action: input.action,
      }).validate();
    case 'recent_search':
      return new SaveSearchActionSanitizer({
        ...input,
        action: input.action,
      }).validate();
    case 'add_annotation':
      return new AddAnnotationActionSanitizer({
        ...input,
        action: input.action,
      }).validate();
    case 'delete_annotation':
      return new DeleteAnnotationActionSanitizer({
        ...input,
        action: input.action,
      }).validate();
    default:
      // This is an action that we do not support
      return { action: input.action };
  }
}
