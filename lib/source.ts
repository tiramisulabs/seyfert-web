import { blog as blogPosts, guide } from 'fumadocs-mdx:collections/server';
import { toFumadocsSource } from 'fumadocs-mdx/runtime/server';
import { loader } from 'fumadocs-core/source';
import { icons } from 'lucide-react';
import { createElement, type CSSProperties } from 'react';

const iconSidebarColors: Partial<Record<keyof typeof icons, string>> = {
  BookMarked: '#f59e0b',
  BookOpen: '#f59e0b',
  Boxes: '#8b5cf6',
  Braces: '#06b6d4',
  CloudCog: '#0ea5e9',
  GraduationCap: '#6366f1',
  Languages: '#0ea5e9',
  Lightbulb: '#eab308',
  Package: '#14b8a6',
  Plug: '#d946ef',
  PlugZap: '#d946ef',
  Rocket: '#6366f1',
  Server: '#3b82f6',
  Terminal: '#10b981',
  Workflow: '#22c55e',
  Wrench: '#f97316',
};

export const guideSource = loader({
  baseUrl: '/docs',
  source: guide.toFumadocsSource(),
  icon(name) {
    if (name && name in icons) {
      const iconName = name as keyof typeof icons;

      return createElement(icons[iconName], {
        size: 16,
        style: {
          '--seyfert-sidebar-icon-color': iconSidebarColors[iconName],
        } as CSSProperties,
      });
    }
  },
});

export const blogSource = loader({
  baseUrl: '/blog',
  source: toFumadocsSource(blogPosts, []),
});
