import console from 'node:console';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

const root = process.cwd();
const packageRoot = path.join(root, 'node_modules', 'seyfert');
const output = path.join(root, 'lib', 'api-reference', 'generated.ts');
const detailsOutput = path.join(root, 'lib', 'api-reference', 'details.ts');
const packageJson = JSON.parse(
  fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'),
);
const declarationRoot = path.join(packageRoot, 'lib');

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

const declarations = declarationFiles();

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
      return `${token} ${clause.types.map((type) => printable(type)).join(', ')}`;
    })
    .join(' ');
}

function declarationSignature(name, kind, node, symbol) {
  if (kind === 'Class' || kind === 'Interface') {
    return cleanText(
      `export ${kind === 'Class' ? 'declare class' : 'interface'} ${name}${typeParameters(node)} ${heritage(node)}`,
    );
  }

  if (kind === 'Variable') {
    const type = checker.getTypeOfSymbolAtLocation(symbol, node);
    return `export declare const ${name}: ${checker.typeToString(type)};`;
  }

  return printable(node);
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

function membersFor(node) {
  const members =
    'members' in node
      ? node.members
      : ts.isTypeAliasDeclaration(node) && ts.isTypeLiteralNode(node.type)
        ? node.type.members
        : undefined;

  if (!members) return [];

  return members
    .map((member) => {
      const name = memberName(member);
      const kind = memberKind(member);
      if (!name || !kind) return undefined;

      const symbol = 'name' in member && member.name ? checker.getSymbolAtLocation(member.name) : undefined;

      return {
        name,
        kind,
        summary: symbol ? documentation(symbol) : '',
        signature: printable(member),
      };
    })
    .filter(Boolean);
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
      entries.push({
        name,
        kind,
        slug: slugFor(name, kind, used),
        summary: documentation(symbol),
        source: sourcePath(declaration),
        signature: declarationSignature(name, kind, declaration, symbol),
        members: membersFor(declaration),
      });
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
const entryDetails = Object.fromEntries(
  entries.map((entry) => [entry.slug, entry]),
);

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(
  output,
  `// This file is generated by scripts/generate-api-reference.mjs.\n` +
    `// Do not edit it by hand.\n\n` +
    `export type ApiKind = 'Class' | 'Interface' | 'TypeAlias' | 'Function' | 'Variable' | 'Enum';\n\n` +
    `export type ApiMember = {\n` +
    `  name: string;\n` +
    `  kind: string;\n` +
    `  summary: string;\n` +
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
    `  members: ApiMember[];\n` +
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
    `import type { ApiEntryDetail } from './generated';\n\n` +
    `export const apiEntryDetails = ${JSON.stringify(entryDetails, null, 2)} satisfies Record<string, ApiEntryDetail>;\n`,
);

console.log(`Generated ${entries.length} API exports in ${path.relative(root, output)}`);
