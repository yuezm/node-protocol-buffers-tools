import { createPrinter, createSourceFile, factory, ModuleDeclaration, ScriptTarget, Statement } from "typescript";

/**
 * 将typescript代码转换为字符串
 * @param node {ModuleDeclaration}
 * @returns {string}
 */
export function generate(node: ModuleDeclaration | Statement[]): string {
  const file = factory.updateSourceFile(
    createSourceFile('ast.ts', '', ScriptTarget.Latest),
    Array.isArray(node) ? node : [ node ],
  );
  const printer = createPrinter();
  return printer.printFile(file);
}