import { defineDocs, defineConfig } from 'fumadocs-mdx/config';
import { transformerTwoslash } from 'fumadocs-twoslash';
import { rehypeCodeDefaultOptions } from 'fumadocs-core/mdx-plugins';

import {
  bundledLanguages
} from 'shiki';

export const { docs: docsContent, meta: docsMeta } = defineDocs({
  dir: 'content/docs',
});

export const { docs: guideContent, meta: guideMeta } = defineDocs({
  dir: 'content/guide',
});

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      themes: {
        light: 'min-light',
        dark: 'min-dark',
      },
      langs: ["python", "javascript", "typescript", "bash"],
      transformers: [
        ...(rehypeCodeDefaultOptions.transformers ?? []),
        transformerTwoslash({
          langs: ["python", "javascript", "typescript", "bash"],
        }),
      ],
    },

  },
});
