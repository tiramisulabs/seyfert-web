import console from 'node:console';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

const root = process.cwd();
const packageRoot = path.join(root, 'node_modules', 'seyfert');
const output = path.join(root, 'lib', 'api-reference', 'generated.ts');
const detailsOutput = path.join(root, 'lib', 'api-reference', 'details.ts');
const detailsDir = path.join(root, 'lib', 'api-reference', 'details');
const searchOutput = path.join(root, 'lib', 'api-reference', 'search.ts');
const packageJson = JSON.parse(
  fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'),
);
const declarationRoot = path.join(packageRoot, 'lib');
const maxSearchTokenCount = 320;
const maxInlineInheritedMemberSignatureLength = 180;

const apiKindOrder = [
  'Class',
  'Function',
  'Interface',
  'TypeAlias',
  'Enum',
  'Variable',
];
const apiKindSlug = {
  Class: 'classes',
  Function: 'functions',
  Interface: 'interfaces',
  TypeAlias: 'type-aliases',
  Enum: 'enums',
  Variable: 'variables',
};

function declarationFiles(dir = declarationRoot) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(dir, entry.name);

      if (entry.isDirectory()) return declarationFiles(entryPath);
      return entry.name.endsWith('.d.ts') ? [entryPath] : [];
    })
    .sort((a, b) => a.localeCompare(b));
}

function javascriptFiles(dir = declarationRoot) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(dir, entry.name);

      if (entry.isDirectory()) return javascriptFiles(entryPath);
      return entry.name.endsWith('.js') ? [entryPath] : [];
    })
    .sort((a, b) => a.localeCompare(b));
}

const declarations = declarationFiles();
const javascriptSources = javascriptFiles();

const program = ts.createProgram(declarations, {
  declaration: true,
  skipLibCheck: true,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Node10,
  target: ts.ScriptTarget.ESNext,
});

const checker = program.getTypeChecker();
const printer = ts.createPrinter({
  newLine: ts.NewLineKind.LineFeed,
  removeComments: true,
});

const kindMap = new Map([
  [ts.SyntaxKind.ClassDeclaration, 'Class'],
  [ts.SyntaxKind.InterfaceDeclaration, 'Interface'],
  [ts.SyntaxKind.TypeAliasDeclaration, 'TypeAlias'],
  [ts.SyntaxKind.FunctionDeclaration, 'Function'],
  [ts.SyntaxKind.VariableDeclaration, 'Variable'],
  [ts.SyntaxKind.EnumDeclaration, 'Enum'],
]);

function cleanText(value) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\s+([,;:)])/g, '$1')
    .replace(/([(<[{])\s+/g, '$1')
    .trim();
}

function cleanSignatureText(value) {
  return value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function documentation(symbol) {
  return cleanText(ts.displayPartsToString(symbol.getDocumentationComment(checker)));
}

function cleanTagText(text, name) {
  if (!text) return '';
  const value =
    typeof text === 'string'
      ? text
      : text.map((part) => part.text).join(' ');

  return name === 'example' ? cleanSignatureText(value) : cleanText(value);
}

function jsDocTags(symbol) {
  if (!symbol || typeof symbol.getJsDocTags !== 'function') return [];

  return symbol
    .getJsDocTags(checker)
    .map((tag) => ({
      name: tag.name,
      text: cleanTagText(tag.text, tag.name),
    }))
    .filter((tag) => tag.name || tag.text);
}

function sourcePath(node) {
  return node
    .getSourceFile()
    .fileName.replace(packageRoot, 'seyfert')
    .replaceAll(path.sep, '/');
}

function printable(node) {
  const text = printer.printNode(ts.EmitHint.Unspecified, node, node.getSourceFile());
  return cleanSignatureText(text);
}

function typeParameters(node) {
  if (!('typeParameters' in node) || !node.typeParameters?.length) return '';
  return `<${node.typeParameters.map((param) => printable(param)).join(', ')}>`;
}

function heritage(node) {
  if (!('heritageClauses' in node) || !node.heritageClauses?.length) return '';

  return node.heritageClauses
    .map((clause) => {
      const token =
        clause.token === ts.SyntaxKind.ExtendsKeyword ? 'extends' : 'implements';
      return `${token} ${clause.types.map((type) => heritageType(type)).join(', ')}`;
    })
    .join(' ');
}

function heritageType(type) {
  if (!ts.isIdentifier(type.expression)) return printable(type);

  const name = type.expression.text;
  if (!name.endsWith('_base')) return printable(type);

  const symbol = checker.getSymbolAtLocation(type.expression);
  const declaration = symbol?.declarations?.find(ts.isVariableDeclaration);

  return declaration?.type ? printable(declaration.type) : printable(type);
}

function declarationSignature(name, kind, node, symbol) {
  if (kind === 'Class' || kind === 'Interface') {
    return formatSignature(cleanText(
      `export ${kind === 'Class' ? 'declare class' : 'interface'} ${name}${typeParameters(node)} ${heritage(node)}`,
    ));
  }

  if (kind === 'Variable') {
    const type = checker.getTypeOfSymbolAtLocation(symbol, node);
    return formatSignature(`export declare const ${name}: ${checker.typeToString(type)};`);
  }

  return formatSignature(printable(node));
}

function classHeritageTypes(node) {
  if (!ts.isClassDeclaration(node) || !node.heritageClauses?.length) return [];

  return node.heritageClauses.flatMap((clause) => {
    if (clause.token !== ts.SyntaxKind.ExtendsKeyword) return [];
    return clause.types.map((type) => heritageType(type));
  });
}

function isMixinHeritageType(type) {
  return !type.startsWith('ObjectToLower<');
}

function expressionName(node) {
  if (ts.isIdentifier(node)) return node.text;
  if (ts.isPropertyAccessExpression(node)) return node.name.text;
  if (ts.isParenthesizedExpression(node)) return expressionName(node.expression);
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.CommaToken) {
    return expressionName(node.right);
  }

  return undefined;
}

function runtimeMixinNames(decorator, source) {
  if (!ts.isCallExpression(decorator) || expressionName(decorator.expression) !== 'mix') {
    return [];
  }

  return decorator.arguments
    .map((argument) => ts.isIdentifier(argument) ? argument.text : argument.getText(source))
    .filter(Boolean);
}

function collectRuntimeMixins() {
  const mixins = new Map();

  for (const file of javascriptSources) {
    const source = ts.createSourceFile(
      file,
      fs.readFileSync(file, 'utf8'),
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.JS,
    );

    ts.forEachChild(source, function visit(node) {
      if (ts.isCallExpression(node) && expressionName(node.expression) === '__decorate') {
        const [decorators, target] = node.arguments;
        if (ts.isArrayLiteralExpression(decorators) && ts.isIdentifier(target)) {
          const names = decorators.elements.flatMap((decorator) => runtimeMixinNames(decorator, source));
          if (names.length > 0) mixins.set(target.text, names);
        }
      }

      ts.forEachChild(node, visit);
    });
  }

  return mixins;
}

const runtimeMixins = collectRuntimeMixins();

function mixinsFor(node) {
  if (!ts.isClassDeclaration(node)) return [];

  const name = declarationName(node);
  const runtime = name ? runtimeMixins.get(name) : undefined;
  if (runtime) return runtime;

  const symbol = declarationSymbol(node);
  if (!symbol) return [];

  const inheritedClasses = new Set(classHeritageTypes(node));
  const mixins = new Set();

  for (const declaration of symbol.declarations ?? []) {
    if (!ts.isInterfaceDeclaration(declaration) || !declaration.heritageClauses?.length) {
      continue;
    }

    for (const clause of declaration.heritageClauses) {
      for (const type of clause.types) {
        const mixin = printable(type);
        if (!isMixinHeritageType(mixin) || inheritedClasses.has(mixin)) continue;

        mixins.add(mixin);
      }
    }
  }

  return [...mixins];
}

function memberName(member) {
  if (ts.isConstructorDeclaration(member)) return 'constructor';
  const name = member.name;
  if (!name) return undefined;
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return printable(name);
}

function memberKind(member) {
  if (ts.isConstructorDeclaration(member)) return 'Constructor';
  if (ts.isMethodDeclaration(member) || ts.isMethodSignature(member)) return 'Method';
  if (ts.isPropertyDeclaration(member) || ts.isPropertySignature(member)) return 'Property';
  if (ts.isGetAccessorDeclaration(member)) return 'Getter';
  if (ts.isSetAccessorDeclaration(member)) return 'Setter';
  if (ts.isCallSignatureDeclaration(member)) return 'CallSignature';
  if (ts.isConstructSignatureDeclaration(member)) return 'ConstructSignature';
  if (ts.isIndexSignatureDeclaration(member)) return 'IndexSignature';
  return undefined;
}

function declarationOwner(node) {
  let current = node.parent;

  while (current) {
    if (
      ts.isClassDeclaration(current) ||
      ts.isInterfaceDeclaration(current) ||
      ts.isTypeAliasDeclaration(current)
    ) {
      return current;
    }

    current = current.parent;
  }

  return undefined;
}

function isExportedDeclaration(node) {
  return (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0;
}

function hasInlineObjectType(member) {
  return (
    (ts.isPropertyDeclaration(member) || ts.isPropertySignature(member)) &&
    !!member.type &&
    ts.isTypeLiteralNode(member.type)
  );
}

function indexedAccessMemberSignature(member, owner, signature) {
  if (!ts.isPropertyDeclaration(member) && !ts.isPropertySignature(member)) {
    return undefined;
  }

  if (
    !hasInlineObjectType(member) &&
    signature.length <= maxInlineInheritedMemberSignatureLength
  ) {
    return undefined;
  }

  const ownerName = declarationName(owner);
  const name = memberName(member);
  if (!ownerName || !name || !isExportedDeclaration(owner)) return undefined;

  const readonly = member.modifiers?.some(
    (modifier) => modifier.kind === ts.SyntaxKind.ReadonlyKeyword,
  )
    ? 'readonly '
    : '';
  const optional = member.questionToken ? '?' : '';

  return `${readonly}${memberSignatureName(name)}${optional}: ${ownerName}[${JSON.stringify(name)}];`;
}

function memberSignature(member, ownerNode) {
  const signature = printable(member);
  const owner = ownerNode ? declarationOwner(member) : undefined;
  if (!owner || owner === ownerNode) return formatSignature(signature);

  return formatSignature(indexedAccessMemberSignature(member, owner, signature) ?? signature);
}

function memberFromDeclaration(member, fallbackSymbol, ownerNode) {
  const name = memberName(member);
  const kind = memberKind(member);
  if (!name || !kind) return undefined;

  const symbol =
    'name' in member && member.name
      ? checker.getSymbolAtLocation(member.name)
      : fallbackSymbol;

  return {
    name,
    kind,
    summary: symbol ? documentation(symbol) : '',
    tags: symbol ? jsDocTags(symbol) : [],
    signature: memberSignature(member, ownerNode),
  };
}

function hasEffectiveMembers(node) {
  if (!ts.isClassDeclaration(node) && !ts.isInterfaceDeclaration(node)) return false;

  const symbol = declarationSymbol(node);
  if (!symbol) return false;

  const declarations = symbol.declarations ?? [];
  const hasClass = declarations.some(ts.isClassDeclaration);
  const hasInterface = declarations.some(ts.isInterfaceDeclaration);

  return hasClass && hasInterface;
}

function memberSignatureName(name) {
  return /^[$A-Z_a-z][$\w]*$/.test(name) ? name : JSON.stringify(name);
}

function apparentMemberFromSymbol(symbol, node) {
  if (symbol.name.startsWith('__@')) return [];

  const declarations = symbol.getDeclarations()?.filter((declaration) => {
    return memberKind(declaration) !== undefined;
  });

  if (declarations?.length) {
    return declarations
      .map((declaration) => memberFromDeclaration(declaration, symbol, node))
      .filter(Boolean);
  }

  const type = checker.getTypeOfSymbolAtLocation(symbol, node);
  const optional = (symbol.flags & ts.SymbolFlags.Optional) !== 0 ? '?' : '';

  return [
    {
      name: symbol.name,
      kind: 'Property',
      summary: documentation(symbol),
      tags: jsDocTags(symbol),
      signature: formatSignature(
        `${memberSignatureName(symbol.name)}${optional}: ${checker.typeToString(
          type,
          node,
          ts.TypeFormatFlags.NoTruncation |
            ts.TypeFormatFlags.UseSingleQuotesForStringLiteralType,
        )};`,
      ),
    },
  ];
}

function mergeMemberOverloads(members) {
  const merged = [];
  const grouped = new Map();

  for (const member of members) {
    const key = `${member.name}\0${member.kind}`;
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, member);
      merged.push(member);
      continue;
    }

    const signatures = new Set(existing.signature.split('\n'));
    if (!signatures.has(member.signature)) {
      existing.signature = `${existing.signature}\n${member.signature}`;
    }

    if (!existing.summary && member.summary) {
      existing.summary = member.summary;
    }

    const tagKeys = new Set(existing.tags.map((tag) => `${tag.name}\0${tag.text}`));
    for (const tag of member.tags) {
      const tagKey = `${tag.name}\0${tag.text}`;
      if (tagKeys.has(tagKey)) continue;

      tagKeys.add(tagKey);
      existing.tags.push(tag);
    }
  }

  return merged;
}

function mergeEffectiveMembers(node, members) {
  if (!hasEffectiveMembers(node)) return members;

  const symbol = declarationSymbol(node);
  if (!symbol) return members;

  const type = checker.getApparentType(checker.getDeclaredTypeOfSymbol(symbol));
  const merged = [...members];
  const seen = new Set(
    merged.map((member) => `${member.name}\0${member.kind}\0${member.signature}`),
  );

  for (const property of type.getProperties()) {
    for (const member of apparentMemberFromSymbol(property, node)) {
      const key = `${member.name}\0${member.kind}\0${member.signature}`;
      if (seen.has(key)) continue;

      seen.add(key);
      merged.push(member);
    }
  }

  return merged;
}

function membersFor(node) {
  const members =
    'members' in node
      ? node.members
      : ts.isTypeAliasDeclaration(node) && ts.isTypeLiteralNode(node.type)
        ? node.type.members
        : undefined;

  if (!members) return [];

  const declaredMembers = members
    .map((member) => memberFromDeclaration(member))
    .filter(Boolean);

  return mergeMemberOverloads(mergeEffectiveMembers(node, declaredMembers));
}

function exportedDeclarations(source) {
  const declarations = [];

  for (const statement of source.statements) {
    if (ts.isVariableStatement(statement)) {
      const isExported =
        (ts.getCombinedModifierFlags(statement) & ts.ModifierFlags.Export) !== 0;
      if (!isExported) continue;

      for (const declaration of statement.declarationList.declarations) {
        declarations.push(declaration);
      }

      continue;
    }

    if (!kindMap.has(statement.kind)) continue;
    const isExported =
      (ts.getCombinedModifierFlags(statement) & ts.ModifierFlags.Export) !== 0;
    if (isExported) declarations.push(statement);
  }

  return declarations;
}

function declarationName(node) {
  if (!('name' in node) || !node.name) return undefined;

  if (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) {
    return node.name.text;
  }

  return undefined;
}

function collectPublicExportNames() {
  const names = new Set();

  for (const file of declarations) {
    const source = program.getSourceFile(file);
    if (!source) continue;

    for (const declaration of exportedDeclarations(source)) {
      const name = declarationName(declaration);
      if (name && !name.startsWith('__')) names.add(name);
    }
  }

  return names;
}

const publicExportNames = collectPublicExportNames();

function simplifyImportTypes(signature) {
  return signature.replace(
    /\bimport\((["'][^"']+["'])\)\.([A-Za-z_$][\w$]*)/g,
    (match, _specifier, typeName) => publicExportNames.has(typeName) ? typeName : match,
  );
}

function formatSignature(signature) {
  return simplifyImportTypes(signature);
}

function privateTypeKind(node) {
  if (ts.isInterfaceDeclaration(node)) return 'Interface';
  if (ts.isTypeAliasDeclaration(node)) return 'TypeAlias';
  return undefined;
}

function collectPrivateTypeDeclarations() {
  const privateTypes = new Map();

  for (const source of program.getSourceFiles()) {
    if (!source.fileName.startsWith(packageRoot)) continue;

    ts.forEachChild(source, function visit(node) {
      const kind = privateTypeKind(node);
      const name = kind ? declarationName(node) : undefined;

      if (kind && name && !isExportedDeclaration(node)) {
        privateTypes.set(name, {
          name,
          kind,
          source: sourcePath(node),
          signature: formatSignature(printable(node)),
        });
      }

      ts.forEachChild(node, visit);
    });
  }

  return privateTypes;
}

const privateTypeDeclarations = collectPrivateTypeDeclarations();

function referencedPrivateTypeNames(code) {
  const names = [];
  const seen = new Set();

  for (const token of code.match(/[A-Za-z_$][\w$]*/g) ?? []) {
    if (seen.has(token) || !privateTypeDeclarations.has(token)) continue;

    seen.add(token);
    names.push(token);
  }

  return names;
}

function privateTypesFor(entry) {
  const privateTypes = [];
  const seen = new Set();
  const pending = referencedPrivateTypeNames([
    entry.signature,
    entry.mixins.join('\n'),
    ...entry.members.map((member) => member.signature),
  ].join('\n'));

  for (let index = 0; index < pending.length; index += 1) {
    const name = pending[index];
    if (seen.has(name)) continue;

    const privateType = privateTypeDeclarations.get(name);
    if (!privateType) continue;

    seen.add(name);
    privateTypes.push(privateType);

    for (const dependency of referencedPrivateTypeNames(privateType.signature)) {
      if (!seen.has(dependency)) pending.push(dependency);
    }
  }

  return privateTypes;
}

function declarationSymbol(node) {
  if (!('name' in node) || !node.name) return undefined;
  return checker.getSymbolAtLocation(node.name);
}

function slugFor(name, kind, used) {
  const safeName = name.replace(/[^A-Za-z0-9_$.-]/g, '-');
  const base = `${safeName}:${kind}`;
  const count = used.get(base) ?? 0;
  used.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

function publicExports() {
  const used = new Map();
  const entries = [];

  for (const file of declarations) {
    const source = program.getSourceFile(file);
    if (!source) continue;

    for (const declaration of exportedDeclarations(source)) {
      const name = declarationName(declaration);
      if (!name || name.startsWith('__')) continue;

      const symbol = declarationSymbol(declaration);
      if (!symbol) continue;

      const kind = kindMap.get(declaration.kind);
      const entry = {
        name,
        kind,
        slug: slugFor(name, kind, used),
        summary: documentation(symbol),
        tags: jsDocTags(symbol),
        source: sourcePath(declaration),
        signature: declarationSignature(name, kind, declaration, symbol),
        mixins: mixinsFor(declaration),
        members: membersFor(declaration),
      };

      entry.privateTypes = privateTypesFor(entry);
      entries.push(entry);
    }
  }

  return entries
    .sort((a, b) => a.name.localeCompare(b.name) || a.kind.localeCompare(b.kind));
}

const entries = publicExports();
const entryManifest = entries.map((entry) => ({
  name: entry.name,
  kind: entry.kind,
  slug: entry.slug,
  summary: entry.summary,
}));
const entryDetailsByKind = Object.fromEntries(
  apiKindOrder.map((kind) => [
    kind,
    Object.fromEntries(
      entries
        .filter((entry) => entry.kind === kind)
        .map((entry) => [entry.slug, entry]),
    ),
  ]),
);
const searchEntries = entries.map((entry) => ({
  slug: entry.slug,
  content: searchContentFor(entry),
}));

function tagSearchText(tags) {
  return tags.map((tag) => `${tag.name} ${tag.text}`).join(' ');
}

function signatureIdentifiers(signature) {
  return [
    ...new Set(signature.match(/[A-Za-z_$][\w$]*/g) ?? []),
  ]
    .filter((token) => token.length > 1)
    .join(' ');
}

function compactSearchContent(parts) {
  const tokens = parts
    .filter(Boolean)
    .join(' ')
    .match(/[A-Za-z_$][\w$]*|\d+/g) ?? [];
  const seen = new Set();
  const compact = [];

  for (const token of tokens) {
    const key = token.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    compact.push(token);
    if (compact.length >= maxSearchTokenCount) break;
  }

  return compact.join(' ');
}

function searchContentFor(entry) {
  const parts = [
    entry.name,
    entry.kind,
    entry.slug,
    entry.summary,
    signatureIdentifiers(entry.signature),
    entry.mixins.join(' '),
    entry.privateTypes.map((type) => `${type.name} ${type.signature}`).join(' '),
    tagSearchText(entry.tags),
  ];

  for (const member of entry.members) {
    parts.push(
      member.name,
      member.kind,
      member.summary,
      signatureIdentifiers(member.signature),
      tagSearchText(member.tags.filter((tag) => tag.name !== 'example')),
    );
  }

  return compactSearchContent(parts);
}

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.rmSync(detailsDir, { recursive: true, force: true });
fs.mkdirSync(detailsDir, { recursive: true });
fs.writeFileSync(
  output,
  `// This file is generated by scripts/generate-api-reference.mjs.\n` +
    `// Do not edit it by hand.\n\n` +
    `export type ApiKind = 'Class' | 'Interface' | 'TypeAlias' | 'Function' | 'Variable' | 'Enum';\n\n` +
    `export type ApiDocTag = {\n` +
    `  name: string;\n` +
    `  text: string;\n` +
    `};\n\n` +
    `export type ApiPrivateType = {\n` +
    `  name: string;\n` +
    `  kind: 'Interface' | 'TypeAlias';\n` +
    `  source: string;\n` +
    `  signature: string;\n` +
    `};\n\n` +
    `export type ApiMember = {\n` +
    `  name: string;\n` +
    `  kind: string;\n` +
    `  summary: string;\n` +
    `  tags: ApiDocTag[];\n` +
    `  signature: string;\n` +
    `};\n\n` +
    `export type ApiEntry = {\n` +
    `  name: string;\n` +
    `  kind: ApiKind;\n` +
    `  slug: string;\n` +
    `  summary: string;\n` +
    `};\n\n` +
    `export type ApiEntryDetail = ApiEntry & {\n` +
    `  source: string;\n` +
    `  signature: string;\n` +
    `  tags: ApiDocTag[];\n` +
    `  mixins: string[];\n` +
    `  privateTypes: ApiPrivateType[];\n` +
    `  members: ApiMember[];\n` +
    `};\n\n` +
    `export type ApiSearchEntry = {\n` +
    `  slug: string;\n` +
    `  content: string;\n` +
    `};\n\n` +
    `export const apiPackage = ${JSON.stringify(
      { name: packageJson.name, version: packageJson.version },
      null,
      2,
    )} as const;\n\n` +
    `export const apiEntries = ${JSON.stringify(entryManifest, null, 2)} satisfies readonly ApiEntry[];\n`,
);

fs.writeFileSync(
  detailsOutput,
  `// This file is generated by scripts/generate-api-reference.mjs.\n` +
    `// Do not edit it by hand.\n\n` +
    `import type { ApiEntryDetail, ApiKind } from './generated';\n\n` +
    `export async function detailForSlug(slug: string, kind: ApiKind): Promise<ApiEntryDetail | undefined> {\n` +
    `  switch (kind) {\n` +
    apiKindOrder
      .map(
        (kind) =>
          `    case '${kind}':\n` +
          `      return ((await import('./details/${apiKindSlug[kind]}')).apiEntryDetails as Record<string, ApiEntryDetail>)[slug];\n`,
      )
      .join('') +
    `  }\n` +
    `}\n`,
);

for (const kind of apiKindOrder) {
  fs.writeFileSync(
    path.join(detailsDir, `${apiKindSlug[kind]}.ts`),
    `// This file is generated by scripts/generate-api-reference.mjs.\n` +
      `// Do not edit it by hand.\n\n` +
      `import type { ApiEntryDetail } from '../generated';\n\n` +
      `export const apiEntryDetails = ${JSON.stringify(entryDetailsByKind[kind], null, 2)} satisfies Record<string, ApiEntryDetail>;\n`,
  );
}

fs.writeFileSync(
  searchOutput,
  `// This file is generated by scripts/generate-api-reference.mjs.\n` +
    `// Do not edit it by hand.\n\n` +
    `import type { ApiSearchEntry } from './generated';\n\n` +
    `export const apiSearchEntries = ${JSON.stringify(searchEntries, null, 2)} satisfies readonly ApiSearchEntry[];\n`,
);

console.log(`Generated ${entries.length} API exports in ${path.relative(root, output)}`);
