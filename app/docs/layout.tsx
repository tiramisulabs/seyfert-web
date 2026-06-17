import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import type { LayoutTab } from "fumadocs-ui/layouts/shared";
import type * as PageTree from "fumadocs-core/page-tree";
import { createElement, type CSSProperties, type ReactNode } from "react";
import {
  Box,
  Component as InterfaceIcon,
  FunctionSquare,
  ListTree,
  Sigma,
  Variable as VariableIcon,
} from "lucide-react";
import { baseOptions } from "@/app/layout.config";
import { guideSource } from "@/lib/source";
import { GeistSans } from "geist/font/sans";
import { config } from "@/app.config";
import { DocsHeader } from "@/components/docs/docs-header";
import { SidebarSearchSeparator } from "@/components/docs/sidebar-search-separator";
import { apiEntries, type ApiEntry, type ApiKind } from "@/lib/api-reference/generated";
import {
  apiKindLabel,
  apiKindOrder,
  apiKindSlug,
  apiKindStyles,
} from "@/lib/api-reference/kinds";

const sidebarSearchId = "seyfert-sidebar-search";

function sidebarSearchNode(id: string): PageTree.Separator {
  return {
    type: "separator",
    $id: `${sidebarSearchId}-${id}`,
  };
}

const apiKindIcons: Record<ApiKind, typeof Box> = {
  Class: Box,
  Function: FunctionSquare,
  Interface: InterfaceIcon,
  TypeAlias: Sigma,
  Enum: ListTree,
  Variable: VariableIcon,
};
const apiEntriesByKind = new Map<ApiKind, ApiEntry[]>();

for (const entry of apiEntries) {
  const entries = apiEntriesByKind.get(entry.kind);

  if (entries) {
    entries.push(entry);
  } else {
    apiEntriesByKind.set(entry.kind, [entry]);
  }
}

function apiKindUrl(kind: ApiKind) {
  return `/docs/api/${apiKindSlug[kind]}`;
}

function apiEntryUrl(entry: ApiEntry) {
  return `/docs/api/${entry.slug}`;
}

function apiKindIcon(kind: ApiKind) {
  const Icon = apiKindIcons[kind];

  return createElement(Icon, {
    key: `api-${kind}-icon`,
    size: 16,
    style: {
      "--seyfert-sidebar-icon-color": apiKindStyles[kind].iconColor,
    } as CSSProperties,
  });
}

function apiRootIndex(node: PageTree.Folder): PageTree.Item {
  return {
    ...(node.index ?? {}),
    type: "page",
    $id: "api-root-index",
    name: "API Reference",
    url: "/docs/api",
  };
}

function apiKindOverview(kind: ApiKind): PageTree.Item {
  return {
    type: "page",
    $id: `api-kind-${kind.toLowerCase()}-overview`,
    name: "Overview",
    url: apiKindUrl(kind),
  };
}

function apiFolder(kind: ApiKind): PageTree.Folder {
  const entries = apiEntriesByKind.get(kind) ?? [];

  return {
    type: "folder",
    $id: `api-${kind.toLowerCase()}`,
    name: apiKindLabel[kind],
    icon: apiKindIcon(kind),
    defaultOpen: false,
    children: [
      apiKindOverview(kind),
      ...entries.map((entry) => ({
        type: "page" as const,
        $id: `api-entry-${entry.slug}`,
        name: entry.name,
        url: apiEntryUrl(entry),
      })),
    ],
  };
}

function isApiRootFolder(node: PageTree.Folder) {
  return (
    node.root === true &&
    (node.index?.url === "/docs/api" ||
      node.children.some((child) => child.type === "page" && child.url === "/docs/api"))
  );
}

function isRecipesRootFolder(node: PageTree.Folder) {
  return node.root === true && firstUrl(node)?.startsWith("/docs/recipes");
}

function groupRecipeSections(children: PageTree.Node[]) {
  const grouped: PageTree.Node[] = [];
  let currentFolder: PageTree.Folder | undefined;
  let sectionIndex = 0;

  for (const child of children) {
    if (child.type === "separator" && child.name) {
      currentFolder = {
        type: "folder",
        $id: `${child.$id ?? "recipes-section"}-${sectionIndex}`,
        name: child.name,
        icon: child.icon,
        defaultOpen: true,
        children: [],
      };
      grouped.push(currentFolder);
      sectionIndex += 1;
      continue;
    }

    if (currentFolder) {
      currentFolder.children.push(child);
      continue;
    }

    grouped.push(child);
  }

  return grouped;
}

function withApiReference(node: PageTree.Node): PageTree.Node {
  if (node.type !== "folder") return node;

  if (isApiRootFolder(node)) {
    const overview = apiRootIndex(node);

    return {
      ...node,
      index: overview,
      children: [
        overview,
        ...apiKindOrder.map((kind) => apiFolder(kind)),
      ],
    };
  }

  return {
    ...node,
    children: node.children.map(withApiReference),
  };
}

function withRecipeFolders(node: PageTree.Node): PageTree.Node {
  if (node.type !== "folder") return node;

  const children = node.children.map(withRecipeFolders);

  if (isRecipesRootFolder({ ...node, children })) {
    return {
      ...node,
      children: groupRecipeSections(children),
    };
  }

  return {
    ...node,
    children,
  };
}

function createApiPageTree(tree: PageTree.Root): PageTree.Root {
  return {
    ...tree,
    $id: `${tree.$id ?? "guide-root"}-with-api`,
    children: tree.children.map((node) => withRecipeFolders(withApiReference(node))),
  };
}

function withSidebarSearch(node: PageTree.Node, path: string): PageTree.Node {
  if (node.type !== "folder") return node;

  const children = node.children.map((child, index) =>
    withSidebarSearch(child, `${path}-${index}`),
  );

  return {
    ...node,
    children: node.root ? [sidebarSearchNode(path), ...children] : children,
  };
}

function createSidebarTree(tree: PageTree.Root): PageTree.Root {
  return {
    ...tree,
    $id: `${tree.$id ?? "guide-root"}-with-sidebar-search`,
    children: [
      sidebarSearchNode("root"),
      ...tree.children.map((node, index) =>
        withSidebarSearch(node, String(index)),
      ),
    ],
  };
}

function firstUrl(node: PageTree.Folder): string | undefined {
  if (node.index?.url) return node.index.url;
  for (const child of node.children) {
    if (child.type === "page") return child.url;
    if (child.type === "folder") {
      const url = firstUrl(child);
      if (url) return url;
    }
  }
  return undefined;
}

export default function Layout({ children }: { children: ReactNode }) {
  const pageTree = createApiPageTree(guideSource.pageTree);
  const tree = createSidebarTree(pageTree);

  const tabs: LayoutTab[] = pageTree.children.flatMap((node) =>
    node.type === "folder" && node.root
      ? [
          {
            title: node.name,
            icon: node.icon,
            url: firstUrl(node) ?? "#",
            $folder: node,
          },
        ]
      : [],
  );

  return (
    <div className={`${GeistSans.className} seyfert-docs`}>
      <DocsLayout
        tree={tree}
        nav={{ ...baseOptions.nav }}
        links={baseOptions.links}
        tabMode="navbar"
        tabs={tabs}
        slots={{ header: DocsHeader }}
        sidebar={{
          components: {
            Separator: SidebarSearchSeparator,
          },
          className: "font-medium",
        }}
        githubUrl={`https://github.com/${config.repository}`}
      >
        {children}
      </DocsLayout>
    </div>
  );
}
