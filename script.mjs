import { generateFiles } from 'fumadocs-typescript';
import * as path from 'node:path';

import { generateMDX } from 'fumadocs-typescript';
import * as fs from 'node:fs/promises';

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

async function readRecursive(dir) {
    const files = await fs.readdir(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);
        if (stats.isDirectory()) {
            await readRecursive(filePath);
        }
        if (
            stats.isFile() &&
            file.endsWith('.ts') &&
            !filePath.includes('index.ts')
        ) {
            const fileName = path.basename(filePath);
            const parsed = capitalize(fileName.split('.')[0]);
            console.log("name:", parsed);

            const relativePath = path.relative(process.cwd(), filePath);
            console.log("relativePath:", relativePath);
            const out = generateMDX(`---
title: "${parsed}"
---
                 
---type-table---
./${relativePath}
---end---`, {
                    transform: (t) => {
                        console.log(t);
                        if (t.tags?.example) {
                            const example = t.tags.example;
                            const example2 = `\`\`\`typescript\n${example}\n\`\`\``;
                            t.tags.example = example2;
                        }

                        if(t.description) {
                            const description = t.description;
                            const description2 = description.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/{/g, "&lbrace;").replace(/}/g, "&rbrace;");
                            t.description = description2;
                        }
                     }
                });

            const slicePath = relativePath.slice("seyfert/src".length)
            const outputPath = path.join(process.cwd(), `content/docs/api/${slicePath.replace('.ts', '.mdx')}`);
            await fs.mkdir(path.dirname(outputPath), { recursive: true });
            console.log("outputPath", outputPath);
            await fs.writeFile(outputPath, out);
        }
    }
}

readRecursive(path.resolve(process.cwd(), 'seyfert/src'));

// const out = generateMDX(`---
// title: "Collection"
// ---
 
// ---type-table---
// ./seyfert/src/collection.ts
// ---end---`, {
//     transform: (t) => {
//         if (t.tags?.example) {
//             const example = t.tags.example;
//             const example2 = `\`\`\`typescript\n${example}\n\`\`\``;
//             t.tags.example = example2;
//         }
//     }
// });

// void fs.writeFile('./content/docs/api/file.mdx', out);