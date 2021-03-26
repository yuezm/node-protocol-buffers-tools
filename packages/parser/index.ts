import { TokenType } from 'tokenizer';
import { ParserOptions } from './lib/define';
import Parser from './lib/parser';
import { EnumDeclaration, MessageDeclaration, Module, PropertyAccessExpression, ServiceDeclaration } from './lib/types';

export * from './lib/define';
export * from './lib/types';
export * from './lib/helper/helper';

import * as factory from './lib/helper/factory';
import * as transform from './lib/helper/transform';
import { formatPath } from 'Common/lib/path';

export {
  factory,
  transform,
}

export function parse(options: ParserOptions) {
  const parser = new Parser(options);

  const root = new Module(); // 模块根节点，认为每一个文件为一个模块

  let serviceSyt: null | ServiceDeclaration = null; // 表示当前作为父级的Service节点，用于给Function节点赋值
  let messageSyt: null | MessageDeclaration = null;
  let enumSyt: null | EnumDeclaration = null;

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
          if (serviceSyt !== null) {
            throw parser.illegal(token);
          }
          root.append(serviceSyt = parser.parseService());
          break;

        // 解析函数
        case 'rpc':
          serviceSyt.append(parser.parseMethod(serviceSyt));
          break;

        // 解析 message
        case 'message':
          if (serviceSyt !== null) {
            throw parser.illegal(token);
          }
          root.append(messageSyt = parser.parseMessage());
          break;

        case 'enum':
          if (serviceSyt !== null) {
            throw parser.illegal(token);
          }
          root.append(enumSyt = parser.parseEnum());
          break;
      }
    }

    // 对符号的整理
    else if (token.type === TokenType.SYMBOL) {
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

  const pkg = parser.package || formatPath(options.filename);
  if (pkg.includes('\.')) {
    const typeList = pkg.split('\.');
    root.package = new PropertyAccessExpression(factory.createIdentifier(typeList[ 0 ]), factory.createIdentifier(typeList[ 1 ]));
  } else {
    root.package = factory.createIdentifier(pkg);
  }
  return root;
}
