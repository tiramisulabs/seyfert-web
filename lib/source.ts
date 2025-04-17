import { guideContent, guideMeta, blog as blogPosts } from '@/.source';
import { createMDXSource } from 'fumadocs-mdx';
import { loader } from 'fumadocs-core/source';

export const guideSource = loader({
  baseUrl: '/guide',
  source: createMDXSource(guideContent, guideMeta),
});

export const blogSource = loader({
  baseUrl: '/blog',
  source: createMDXSource(blogPosts),
});
