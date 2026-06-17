import { blog as blogPosts, guide } from 'fumadocs-mdx:collections/server';
import { toFumadocsSource } from 'fumadocs-mdx/runtime/server';
import { loader } from 'fumadocs-core/source';
import { icons } from 'lucide-react';
import { createElement } from 'react';

export const guideSource = loader({
  baseUrl: '/guide',
  source: guide.toFumadocsSource(),
  icon(name) {
    if (name && name in icons) {
      return createElement(icons[name as keyof typeof icons], { size: 16 });
    }
  },
});

export const blogSource = loader({
  baseUrl: '/blog',
  source: toFumadocsSource(blogPosts, []),
});
