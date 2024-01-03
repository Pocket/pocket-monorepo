export type MarticleComponent = {
  content: string;
  __typeName: string;
};

export type UnMarseable = {
  html: string;
  __typeName: 'UnMarseable';
};

export type MarticleDivider = {
  content: '---';
  __typeName: 'MarticleDivider';
};

export type MarticleTable = {
  html: string;
  __typeName: 'MarticleTable';
};

export type MarticleText = {
  content: string;
  __typeName: 'MarticleText';
};

export type MarticleBlockquote = {
  content: string;
  __typeName: 'MarticleBlockquote';
};

export type MarticleHeading = {
  content: string;
  __typeName: 'MarticleHeading';
  level: number;
};

export type MarticleCodeBlock = {
  text: string;
  language?: string;
  __typeName: 'MarticleCodeBlock';
};

export type MarticleBulletedList = {
  rows: ListElement[];
  __typeName: 'MarticleBulletedList';
};

export type ListElement = {
  level: number;
  content: string;
};

export type NumberedListElement = ListElement & {
  index: number;
};

export type MarticleNumberedList = {
  rows: NumberedListElement[];
  __typeName: 'MarticleNumberedList';
};
