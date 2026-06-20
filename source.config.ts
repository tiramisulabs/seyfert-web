import { defineDocs, defineConfig, defineCollections, frontmatterSchema } from 'fumadocs-mdx/config';
import { transformerTwoslash } from 'fumadocs-twoslash';
import { rehypeCodeDefaultOptions } from 'fumadocs-core/mdx-plugins';
import { z } from 'zod';
import dacezuTheme from './dacezu.json';
import { ThemeRegistrationAny } from 'shiki/types';
export const guide = defineDocs({
  dir: 'content/docs',
});

export const blog = defineCollections({
  dir: 'content/blog',
  type: 'doc',
  schema: frontmatterSchema.extend({
    date: z.date(),
  }),
});

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      themes: {
        light: 'min-light',
        dark: dacezuTheme as ThemeRegistrationAny,
      },
      langs: ["python", "javascript", "typescript", "bash"],
      transformers: [
        ...(rehypeCodeDefaultOptions.transformers ?? []),
        transformerTwoslash({
          twoslashOptions: {
            compilerOptions: {
              types: ['node'],
              // seyfert ships its public types across several barrels, so
              // type-checking its .d.ts surfaces harmless duplicate-identifier
              // noise. Skip lib checking: snippets are still validated against
              // seyfert's types, only the library internals are not audited.
              skipLibCheck: true,
            },
          },
          // Keep twoslash type-checking, errors and `---cut---`, but drop the
          // per-token type-on-hover popups (seyfert's types are too large to be
          // useful in a tooltip). Render hover tokens as a plain span.
          rendererRich: {
            hast: {
              hoverToken: { tagName: 'span', class: 'twoslash-noop' },
              hoverCompose: ({ token }) => [token],
            },
          },
        }),
      ],
    },

  },
});
