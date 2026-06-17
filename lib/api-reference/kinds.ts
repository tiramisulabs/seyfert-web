import type { ApiKind } from './generated';

export const apiKindOrder = [
  'Class',
  'Function',
  'Interface',
  'TypeAlias',
  'Enum',
  'Variable',
] satisfies ApiKind[];

export const apiKindLabel: Record<ApiKind, string> = {
  Class: 'Classes',
  Function: 'Functions',
  Interface: 'Interfaces',
  TypeAlias: 'Type Aliases',
  Enum: 'Enums',
  Variable: 'Variables',
};

export const apiKindSingleLabel: Record<ApiKind, string> = {
  Class: 'Class',
  Function: 'Function',
  Interface: 'Interface',
  TypeAlias: 'Type',
  Enum: 'Enum',
  Variable: 'Variable',
};

export const apiKindSlug: Record<ApiKind, string> = {
  Class: 'classes',
  Function: 'functions',
  Interface: 'interfaces',
  TypeAlias: 'type-aliases',
  Enum: 'enums',
  Variable: 'variables',
};

export const apiKindBySlug = new Map(
  apiKindOrder.map((kind) => [apiKindSlug[kind], kind]),
);

export const apiKindStyles: Record<
  ApiKind,
  {
    badge: string;
    codeName: string;
    dot: string;
    icon: string;
    name: string;
    rowHover: string;
  }
> = {
  Class: {
    badge:
      'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-300',
    codeName: 'text-sky-300',
    dot: 'bg-sky-500',
    icon: 'text-sky-500',
    name: 'text-sky-700 dark:text-sky-300',
    rowHover: 'hover:border-sky-200 hover:bg-sky-50/70 dark:hover:border-sky-400/20 dark:hover:bg-sky-400/10',
  },
  Function: {
    badge:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300',
    codeName: 'text-emerald-300',
    dot: 'bg-emerald-500',
    icon: 'text-emerald-500',
    name: 'text-emerald-700 dark:text-emerald-300',
    rowHover:
      'hover:border-emerald-200 hover:bg-emerald-50/70 dark:hover:border-emerald-400/20 dark:hover:bg-emerald-400/10',
  },
  Interface: {
    badge:
      'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/25 dark:bg-violet-400/10 dark:text-violet-300',
    codeName: 'text-violet-300',
    dot: 'bg-violet-500',
    icon: 'text-violet-500',
    name: 'text-violet-700 dark:text-violet-300',
    rowHover:
      'hover:border-violet-200 hover:bg-violet-50/70 dark:hover:border-violet-400/20 dark:hover:bg-violet-400/10',
  },
  TypeAlias: {
    badge:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300',
    codeName: 'text-amber-300',
    dot: 'bg-amber-500',
    icon: 'text-amber-500',
    name: 'text-amber-700 dark:text-amber-300',
    rowHover:
      'hover:border-amber-200 hover:bg-amber-50/70 dark:hover:border-amber-400/20 dark:hover:bg-amber-400/10',
  },
  Enum: {
    badge:
      'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-300',
    codeName: 'text-rose-300',
    dot: 'bg-rose-500',
    icon: 'text-rose-500',
    name: 'text-rose-700 dark:text-rose-300',
    rowHover: 'hover:border-rose-200 hover:bg-rose-50/70 dark:hover:border-rose-400/20 dark:hover:bg-rose-400/10',
  },
  Variable: {
    badge:
      'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-400/25 dark:bg-teal-400/10 dark:text-teal-300',
    codeName: 'text-teal-300',
    dot: 'bg-teal-500',
    icon: 'text-teal-500',
    name: 'text-teal-700 dark:text-teal-300',
    rowHover: 'hover:border-teal-200 hover:bg-teal-50/70 dark:hover:border-teal-400/20 dark:hover:bg-teal-400/10',
  },
};
