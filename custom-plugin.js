const util = require('util');
const path = require('path');

exports.load = async function (app) {
    let emptyEntry = false;

    // Use dynamic import for the ES Module
    const { MarkdownPageEvent } = await import('typedoc-plugin-markdown');

    app.renderer.on(MarkdownPageEvent.BEGIN, (event) => {
        emptyEntry = false;

        // Missing fileName variable declaration
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
    });

    app.renderer.on(MarkdownPageEvent.END, (event) => {
        if (emptyEntry) {
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
