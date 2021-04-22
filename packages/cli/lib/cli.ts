import { existsSync, readFileSync } from "fs";
import { join } from 'path';

import { CliOptions } from "./define";
import { CSyntaxKind } from "Parser/lib/define";
import * as types from "Parser/lib/types";
import * as define from "Parser/lib/define";
import { customTraverse } from "Parser/lib/helper/factory";
import { parse } from 'Parser/'
import { tokenize } from "Tokenizer/";

export class Cli {
  modules: types.CModule[] = [];
  packageModuleMap: Map<string, types.CModule>;
  options: CliOptions;

  static GOOGLE_PATH = join(__dirname, '../../..');

  constructor(options: CliOptions) {
    this.options = options;
    this.packageModuleMap = new Map<string, types.CModule>();
  }

  run() {
    this.parseByPath(this.options.entry, true);

    this.modules = Array.from(this.packageModuleMap.values());
  }

  parseByPath(filename: string, isMain = false): void {
    const finalPath = this.serializeFilePath(filename);

    const syt = parse({ source: tokenize(readFileSync(finalPath).toString()), filename });

    syt.fileRelativePath = filename;
    syt.filename = filename;
    syt.filepath = finalPath;
    syt.isMain = isMain;

    this.parseImport(syt);
    const pkg: string = syt.package.kind === define.CSyntaxKind.PropertyAccessExpression ?
      (syt.package as types.CPropertyAccessExpression).namespace :
      (syt.package as types.CIdentifier).escapedText;

    // 如果出现命名空间重复，则合并起来
    if (this.packageModuleMap.has(pkg)) {
      const oldModule = this.packageModuleMap.get(pkg);
      syt.body.push(...oldModule.body);
      syt.messages.push(...oldModule.messages);
      syt.enums.push(...oldModule.enums);
    }
    this.packageModuleMap.set(pkg, syt);
  }


  parseImport(node: types.CNode) {
    customTraverse(node, {
      visitor: {
        [CSyntaxKind.ImportExpression]: (c: types.CImportExpression) => {
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
    throw new Error(`未找到该文件：${ filename }`);
  }
}
