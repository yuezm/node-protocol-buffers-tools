import { existsSync, readFileSync } from "fs";
import { join } from 'path';

import { CliOptions } from "./define";
import { SyntaxKind } from "Parser/lib/define";
import { Node, Module, ImportExpression } from "Parser/lib/types";
import { traverse } from "Parser/lib/helper/factory";
import { parse } from 'Parser/'
import { tokenize } from "Tokenizer/";

export class Cli {
  modules: Module[] = [];
  options: CliOptions;

  static GOOGLE_PATH = join(__dirname, '../../..');

  constructor(options: CliOptions) {
    this.options = options;
  }

  run() {
    this.parseByPath(this.options.entry, true);
  }

  parseByPath(filename: string, isMain = false): void {
    const finalPath = this.serializeFilePath(filename);

    const syt = parse({ source: tokenize(readFileSync(finalPath).toString()), filename });

    syt.fileRelativePath = filename;
    syt.filename = filename;
    syt.filepath = finalPath;
    syt.isMain = isMain;

    this.parseImport(syt);
    this.modules.push(syt);
  }

  parseImport(node: Node) {
    traverse(node, {
      visitor: {
        [ SyntaxKind.ImportExpression ]: (c: ImportExpression) => {
          this.parseByPath(c.expression.escapedText);
        }
      }
    })
  }

  serializeFilePath(filename: string) {
    // 需要对引入的Google，单独处理
    if (filename.startsWith('google')) {
      return join(Cli.GOOGLE_PATH, filename)
    }

    if (existsSync(filename)) return filename;

    for (const p of this.options.path) {
      if (existsSync(join(p, filename))) return join(p, filename);
    }
    throw new Error(`未找到该文件：${filename}`);
  }
}
