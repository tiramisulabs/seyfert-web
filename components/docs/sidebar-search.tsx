'use client';

import { useNotebookLayout } from 'fumadocs-ui/layouts/notebook';

export function SidebarSearch() {
  const { slots } = useNotebookLayout();

  if (!slots.searchTrigger) return null;

  const SearchTrigger = slots.searchTrigger.full;

  return (
    <SearchTrigger
      hideIfDisabled
      className="w-full rounded-md bg-fd-secondary/40 px-2 py-1.5 text-[13px]"
    />
  );
}
