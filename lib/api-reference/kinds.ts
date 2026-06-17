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
    iconColor: string;
  }
> = {
  Class: {
    badge:
      'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-300',
    iconColor: '#0ea5e9',
  },
  Function: {
    badge:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300',
    iconColor: '#10b981',
  },
  Interface: {
    badge:
      'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/25 dark:bg-violet-400/10 dark:text-violet-300',
    iconColor: '#8b5cf6',
  },
  TypeAlias: {
    badge:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300',
    iconColor: '#f59e0b',
  },
  Enum: {
    badge:
      'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-300',
    iconColor: '#f43f5e',
  },
  Variable: {
    badge:
      'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-400/25 dark:bg-teal-400/10 dark:text-teal-300',
    iconColor: '#14b8a6',
  },
};
