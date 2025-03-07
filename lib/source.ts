import { docsContent, docsMeta, guideContent, guideMeta } from '@/.source';
import { createMDXSource } from 'fumadocs-mdx';
import { loader } from 'fumadocs-core/source';

export const source = loader({
  baseUrl: '/docs',
  source: createMDXSource(docsContent, docsMeta),
});

export const guideSource = loader({
  baseUrl: '/guide',
  source: createMDXSource(guideContent, guideMeta),
});
