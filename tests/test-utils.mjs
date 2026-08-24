import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

export const root = process.cwd();
export const outputRoot = join(root, "out");

export function read(path) {
  return readFileSync(join(root, path), "utf8");
}

export function readOutput(path) {
  const outputPath = join(outputRoot, path);

  if (!existsSync(outputPath)) {
    throw new Error(`Missing out/${path}. Run npm run build before the contract tests.`);
  }

  return readFileSync(outputPath, "utf8");
}

export function collectFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? collectFiles(path) : [path];
  });
}

export function getAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}="([^"]*)"`, "i"));
  return match?.[1] ?? null;
}

function unwrapExpression(expression) {
  if (
    ts.isAsExpression(expression) ||
    ts.isParenthesizedExpression(expression) ||
    ts.isSatisfiesExpression(expression)
  ) {
    return unwrapExpression(expression.expression);
  }

  return expression;
}

function readLiteral(expression) {
  const literal = unwrapExpression(expression);

  if (ts.isStringLiteralLike(literal)) return literal.text;
  if (ts.isNumericLiteral(literal)) return Number(literal.text);
  if (literal.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (literal.kind === ts.SyntaxKind.FalseKeyword) return false;

  throw new Error(`Service fields must use literal values: ${literal.getText()}`);
}

export function readServiceCatalog() {
  const filePath = join(root, "src/entities/service/model/service.ts");
  const source = readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== "services") continue;

      const initializer = declaration.initializer && unwrapExpression(declaration.initializer);

      if (!initializer || !ts.isArrayLiteralExpression(initializer)) {
        throw new Error("The services export must be initialized with an array literal.");
      }

      return initializer.elements.map((element) => {
        const object = unwrapExpression(element);

        if (!ts.isObjectLiteralExpression(object)) {
          throw new Error("Every service must be an object literal.");
        }

        return Object.fromEntries(
          object.properties.map((property) => {
            if (!ts.isPropertyAssignment(property)) {
              throw new Error("Every service field must be a property assignment.");
            }

            const name = property.name;
            const key =
              ts.isIdentifier(name) || ts.isStringLiteralLike(name) ? name.text : name.getText();
            return [key, readLiteral(property.initializer)];
          }),
        );
      });
    }
  }

  throw new Error("Could not find the exported services catalog.");
}
