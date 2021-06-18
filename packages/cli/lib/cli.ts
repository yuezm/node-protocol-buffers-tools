import { existsSync, readFileSync } from "fs";
import { join, resolve } from 'path';
import {
  customTraverse,
  parse,
  tokenize,
  CSyntaxKind,
  CModule,
  CPropertyAccessExpression,
  CIdentifier,
  CImportExpression,
  CNode
} from '@node_pb_tool/core';
import { CliOptions } from "./define";

export class Cli {
  modules: CModule[] = [];
  packageModuleMap: Map<string, CModule>;
  options: CliOptions;

  static GOOGLE_PATH = join(__dirname, '../../..');

  constructor(options: CliOptions) {
    this.options = options;
    this.packageModuleMap = new Map<string, CModule>();
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
    const pkg: string = syt.package.kind === CSyntaxKind.PropertyAccessExpression ?
      (syt.package as CPropertyAccessExpression).namespace :
      (syt.package as CIdentifier).escapedText;

    // 如果出现命名空间重复，则合并起来
    if (this.packageModuleMap.has(pkg)) {
      const oldModule = this.packageModuleMap.get(pkg);
      syt.body.push(...oldModule.body);
      syt.messages.push(...oldModule.messages);
      syt.enums.push(...oldModule.enums);
    }
    this.packageModuleMap.set(pkg, syt);
  }

  parseImport(node: CNode) {
    customTraverse(node, {
      visitor: {
        [CSyntaxKind.ImportExpression]: (c: CImportExpression) => {
          this.parseByPath(c.expression.escapedText);
        }
      }
    })
  }

  serializeFilePath(filename: string) {
    if (existsSync(filename)) return resolve(filename);

    // 需要对引入的Google，单独处理
    if (filename.startsWith('google')) {
      return join(Cli.GOOGLE_PATH, filename)
    }

    // 已声明路径查询
    for (const p of this.options.path) {
      if (existsSync(join(p, filename))) return join(p, filename);
    }
    throw new Error(`未找到该文件：${ filename }`);
  }
}
