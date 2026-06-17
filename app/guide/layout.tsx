import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import type { LayoutTab } from "fumadocs-ui/layouts/shared";
import type * as PageTree from "fumadocs-core/page-tree";
import { createElement, type ReactNode } from "react";
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

function apiEntryUrl(entry: ApiEntry) {
  return `/guide/api/${entry.slug}`;
}

function apiKindUrl(kind: ApiKind) {
  return `/guide/api/${apiKindSlug[kind]}`;
}

function apiKindIcon(kind: ApiKind) {
  const Icon = apiKindIcons[kind];

  return createElement(Icon, {
    key: `api-${kind}-icon`,
    size: 16,
    className: apiKindStyles[kind].icon,
  });
}

function apiRootIndex(node: PageTree.Folder): PageTree.Item {
  return {
    ...(node.index ?? {}),
    type: "page",
    $id: "api-root-index",
    name: "API Reference",
    url: "/guide/api",
  };
}

function apiFolder(kind: ApiKind): PageTree.Folder | undefined {
  const entries = apiEntries.filter((entry) => entry.kind === kind);
  if (entries.length === 0) return undefined;

  return {
    type: "folder",
    $id: `api-${kind.toLowerCase()}`,
    name: apiKindLabel[kind],
    icon: apiKindIcon(kind),
    index: {
      type: "page",
      $id: `api-kind-${kind.toLowerCase()}`,
      name: apiKindLabel[kind],
      url: apiKindUrl(kind),
      icon: apiKindIcon(kind),
    },
    defaultOpen: false,
    children: entries.map((entry) => ({
      type: "page",
      $id: `api-entry-${entry.slug}`,
      name: entry.name,
      url: apiEntryUrl(entry),
      description: entry.summary,
    })),
  };
}

function isApiRootFolder(node: PageTree.Folder) {
  return (
    node.root === true &&
    (node.index?.url === "/guide/api" ||
      node.children.some((child) => child.type === "page" && child.url === "/guide/api"))
  );
}

function withApiReference(node: PageTree.Node): PageTree.Node {
  if (node.type !== "folder") return node;

  if (isApiRootFolder(node)) {
    return {
      ...node,
      index: apiRootIndex(node),
      children: apiKindOrder.flatMap((kind) => {
        const folder = apiFolder(kind);
        return folder ? [folder] : [];
      }),
    };
  }

  return {
    ...node,
    children: node.children.map(withApiReference),
  };
}

function createApiPageTree(tree: PageTree.Root): PageTree.Root {
  return {
    ...tree,
    $id: `${tree.$id ?? "guide-root"}-with-api`,
    children: tree.children.map(withApiReference),
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
