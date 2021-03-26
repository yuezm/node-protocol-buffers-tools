import { existsSync, readFileSync } from "fs";
import { join } from 'path';

import { Expression, Node, parse, SyntaxKind, factory, Module, ImportExpression } from "Parser";
import { tokenize } from "Tokenizer/";
import { CliOptions } from "./define";

export class Cli {
  modules: Module[] = [];
  options: CliOptions;

  static GOOGLE_PATH = join(__dirname, '../../..');

  constructor(options: CliOptions) {
    this.options = options;
  }

  run() {
    this.parseByPath(this.options.entry);
  }

  parseByPath(filename: string): void {
    const finalPath = this.serializeFilePath(filename);
    const syt = parse({ source: tokenize(readFileSync(finalPath).toString()), filename });
    this.parseImport(syt);
    this.modules.push(syt);
  }

  parseImport(node: Node) {
    factory.traverse(node, {
      visitor: {
        [SyntaxKind.ImportExpression]: (c: ImportExpression) => {
          this.parseByPath(c.expression.escapedText);
        }
      }
    })
  }

  serializeFilePath(filename: string): string {
    // 需要对引入的Google，单独处理
    if (filename.startsWith('google')) {
      return join(Cli.GOOGLE_PATH, filename)
    }

    if (existsSync(filename)) return filename;
    for (const p of this.options.path) {
      if (existsSync(join(p, filename))) return join(p, filename);
    }
    throw new Error(`未找到该文件：${ filename }`);
  }
}
