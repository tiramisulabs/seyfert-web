import { console } from 'node:console';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

const root = process.cwd();
const packageRoot = path.join(root, 'node_modules', 'seyfert');
const entry = path.join(packageRoot, 'lib', 'index.d.ts');
const output = path.join(root, 'lib', 'api-reference', 'generated.ts');
const packageJson = JSON.parse(
  fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'),
);

const program = ts.createProgram([entry], {
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
  return cleanText(text);
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

function slugFor(name, kind, used) {
  const safeName = name.replace(/[^A-Za-z0-9_$.-]/g, '-');
  const base = `${safeName}:${kind}`;
  const count = used.get(base) ?? 0;
  used.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

function publicExports() {
  const source = program.getSourceFile(entry);
  if (!source) throw new Error(`Cannot read ${entry}`);

  const moduleSymbol = checker.getSymbolAtLocation(source);
  if (!moduleSymbol) throw new Error('Cannot resolve seyfert module symbol');

  const used = new Map();

  return checker
    .getExportsOfModule(moduleSymbol)
    .map((exportSymbol) => {
      const name = exportSymbol.getName();
      if (name.startsWith('__')) return undefined;

      const resolved =
        exportSymbol.flags & ts.SymbolFlags.Alias
          ? checker.getAliasedSymbol(exportSymbol)
          : exportSymbol;
      const declarations = resolved.getDeclarations() ?? exportSymbol.getDeclarations() ?? [];
      const declaration = declarations.find((node) => kindMap.has(node.kind));
      if (!declaration) return undefined;

      const kind = kindMap.get(declaration.kind);
      const summary = documentation(resolved) || documentation(exportSymbol);

      return {
        name,
        kind,
        slug: slugFor(name, kind, used),
        summary,
        source: sourcePath(declaration),
        signature: declarationSignature(name, kind, declaration, resolved),
        members: membersFor(declaration),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name) || a.kind.localeCompare(b.kind));
}

const entries = publicExports();

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
    `  source: string;\n` +
    `  signature: string;\n` +
    `  members: ApiMember[];\n` +
    `};\n\n` +
    `export const apiPackage = ${JSON.stringify(
      { name: packageJson.name, version: packageJson.version },
      null,
      2,
    )} as const;\n\n` +
    `export const apiEntries = ${JSON.stringify(entries, null, 2)} satisfies readonly ApiEntry[];\n`,
);

console.log(`Generated ${entries.length} API exports in ${path.relative(root, output)}`);
