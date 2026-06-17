import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import type { LayoutTab } from "fumadocs-ui/layouts/shared";
import type * as PageTree from "fumadocs-core/page-tree";
import type { ReactNode } from "react";
import { baseOptions } from "@/app/layout.config";
import { guideSource } from "@/lib/source";
import { GeistSans } from "geist/font/sans";
import { config } from "@/app.config";
import { DocsHeader } from "@/components/docs/docs-header";
import { SidebarSearchSeparator } from "@/components/docs/sidebar-search-separator";

const sidebarSearchId = "seyfert-sidebar-search";

function sidebarSearchNode(id: string): PageTree.Separator {
  return {
    type: "separator",
    $id: `${sidebarSearchId}-${id}`,
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
  const tree = createSidebarTree(guideSource.pageTree);

  const tabs: LayoutTab[] = guideSource.pageTree.children.flatMap((node) =>
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
