const util = require('util');
const path = require('path');

exports.load = async function (app) {
    let isStringSelectMenu = false;

    // Use dynamic import for the ES Module
    const { MarkdownPageEvent } = await import('typedoc-plugin-markdown');

    app.renderer.on(MarkdownPageEvent.BEGIN, (event) => {
        isStringSelectMenu = false;

        // Missing fileName variable declaration
        const fileName = path.basename(event.url, '.mdx');

        if (fileName === 'StringSelectMenuInteraction') {
            isStringSelectMenu = true;
            event.contents = `---
title: ${fileName}
---`;
            return;
        }

        event.contents = `---
title: ${fileName}
---

import { AutoTypeTable } from 'fumadocs-typescript/ui';

${event.contents}`;
    });

    app.renderer.on(MarkdownPageEvent.END, (event) => {
        if (isStringSelectMenu) {
            const fileName = path.basename(event.url, '.mdx');
            event.contents = `---
title: ${fileName}
---`;
            return;
        }

        // remove .mdx from links
        event.contents = event.contents.replace(/(\[[^\]]+\]\()([^\)]+)\.mdx(\))/g, '$1$2$3');
    });
};
