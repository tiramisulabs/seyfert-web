const { MarkdownPageEvent } = require('typedoc-plugin-markdown');
const util = require('util');
const path = require('path');

exports.load = function (app) {
    let isStringSelectMenu = false;

    app.renderer.on(MarkdownPageEvent.BEGIN, (event) => {
        const fileName = path.basename(event.url, '.mdx');
        console.log("fileName", fileName);

        isStringSelectMenu = false;

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
