import {
  ShareableListModerationVisibility,
  ShareableListVisibility,
} from '@pocket-tools/event-bridge';
import { ModerationStatus, Visibility } from '.prisma/client';

/**
 * Helpers to map between symmetrical enum types
 * https://dev.to/marcelltoth/mapping-between-identical-typescript-enums-without-the-boilerplate-5b28
 */

type SymmetricalEnum<TEnum> = {
  [key in keyof TEnum]: key;
};

type MapperResult<
  TSourceEnumObj,
  TDestEnumObj extends SymmetricalEnum<TSourceEnumObj>,
  TSourceValue extends keyof TSourceEnumObj,
> = TDestEnumObj extends { [key in TSourceValue]: infer TResult }
  ? TResult
  : never;

const createEnumMapperFunction =
  <TSourceEnumObj, TDestEnumObj extends SymmetricalEnum<TSourceEnumObj>>(
    from: TSourceEnumObj,
    to: TDestEnumObj,
  ) =>
  <TInput extends keyof TSourceEnumObj>(value: TInput) =>
    value as MapperResult<TSourceEnumObj, TDestEnumObj, TInput>;

export const shareableListVisibilityMapper = createEnumMapperFunction(
  Visibility,
  ShareableListVisibility,
);

export const shareableListModerationMapper = createEnumMapperFunction(
  ModerationStatus,
  ShareableListModerationVisibility,
);
