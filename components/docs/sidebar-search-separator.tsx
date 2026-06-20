'use client';

import type * as PageTree from 'fumadocs-core/page-tree';
import {
  SidebarSeparator,
  useFolderDepth,
} from 'fumadocs-ui/components/sidebar/base';
import { SidebarSearch } from '@/components/docs/sidebar-search';
import { SidebarActiveRail } from '@/components/docs/sidebar-active-rail';

const sidebarSearchId = 'seyfert-sidebar-search-';

function getItemOffset(depth: number) {
  return `calc(${2 + 3 * depth} * var(--spacing))`;
}

export function SidebarSearchSeparator({
  item,
}: {
  item: PageTree.Separator;
}) {
  const depth = useFolderDepth();

  if (item.$id?.startsWith(sidebarSearchId)) {
    return (
      <div data-sidebar-search className="mb-1">
        <SidebarSearch />
        <SidebarActiveRail />
      </div>
    );
  }

  return (
    <SidebarSeparator
      className="inline-flex items-center gap-2 mb-1.5 px-2 mt-6 empty:mb-0 [&_svg]:size-4 [&_svg]:shrink-0"
      style={{ paddingInlineStart: getItemOffset(depth) }}
    >
      {item.icon}
      {item.name}
    </SidebarSeparator>
  );
}
