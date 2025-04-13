const util = require('util');
const path = require('path');

exports.load = async function (app) {
    // Use dynamic import for the ES Module
    const { MarkdownPageEvent } = await import('typedoc-plugin-markdown');

    app.renderer.on(MarkdownPageEvent.END, (event) => {
        const fileName = path.basename(event.url, '.mdx');

        if (fileName === 'StringSelectMenuInteraction' || fileName === 'Formatter') {
            emptyEntry = true;
            event.contents = `---
title: ${fileName}
---`;
            return;
        }

        event.contents = `---
title: ${fileName}
---


${event.contents}`;

        // remove .mdx from links
        event.contents = event.contents.replace(/(\[[^\]]+\]\()([^\)]+)\.mdx(\))/g, '$1$2$3');
    });
};
