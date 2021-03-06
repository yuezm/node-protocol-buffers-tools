import { TokenType } from '../tokenizer';
import { ParserOptions } from './define';
import Parser from './parser';
import { CEnumDeclaration, CMessageDeclaration, CModule, CServiceDeclaration } from './types';

import { customCreateIdentifier, customCreatePropertyAccessExpression, formatPath } from '../util';

export * from './types';
export * from './define';

export function parse(options: ParserOptions): CModule {
  const parser = new Parser(options);

  const root = new CModule(); // 模块根节点，认为每一个文件为一个模块

  let serviceSyt: null | CServiceDeclaration = null; // 表示当前作为父级的Service节点，用于给Function节点赋值
  let messageSyt: null | CMessageDeclaration = null;
  let enumSyt: null | CEnumDeclaration = null;

  let token = parser.next();

  while (token !== null) {
    // 对于关键字整理
    if (token.type === TokenType.KEYWORD) {
      switch (token.value) {
        // 解析语法规则
        case 'syntax':
          parser.parseSyntax();
          break;

        // 解析包名
        case 'package':
          parser.parsePackage();
          break;

        // 解析import语法
        case 'import':
          root.append(parser.parseImport());
          break;

        // 解析service语法
        case 'service':
          root.append(serviceSyt = parser.parseService());
          break;

        // 解析函数
        case 'rpc':
          serviceSyt.append(parser.parseMethod(serviceSyt));
          break;

        // 解析 message
        case 'message':
          root.append(messageSyt = parser.parseMessage());
          break;

        case 'enum':
          root.append(enumSyt = parser.parseEnum());
          break;
      }
    }

    // 对符号的整理
    else if (token.type === TokenType.SYMBOL) {
      // 由于 protocol buffer 不会多个包裹，则此处无需使用栈来保证顺序
      if (token.value === '}') {
        serviceSyt = null;
        messageSyt = null;
        enumSyt = null;
      }
    }

    // 对于变量的整理
    else if (token.type == TokenType.VARIABLE) {
      // 此时需要判断下，当前的变量属于哪个区间
      if (messageSyt !== null) {
        messageSyt.append(parser.parseMessageElement(messageSyt));
      } else if (enumSyt !== null) {
        enumSyt.append(parser.parseEnumElement(enumSyt));
      }
    }

    token = parser.next();
  }


  root.filename = options.filename;
  root.syntax = parser.syntax;
  root.enums = parser.enums;
  root.messages = parser.messages;

  const pkg = parser.package || formatPath(options.filename);
  if (pkg.includes('\.')) {
    root.package = customCreatePropertyAccessExpression(pkg);
  } else {
    root.package = customCreateIdentifier(pkg);
  }
  return root;
}
