import * as types from 'Parser/lib/types';
import { Visitor } from 'Parser/lib/define';
import { Identifier, Node, NumericLiteral, ServiceDeclaration } from 'Parser/lib/types';
import { isNode } from 'Parser/lib/helper/helper';

export function createNumericLiteral(text: string, parent: Node | null = null): NumericLiteral {
  return new types.NumericLiteral(text, parent);
}

// 创建标识符
export function createIdentifier(escapedText: string, parent: Node | null = null): Identifier {
  return new types.Identifier(escapedText, parent);
}

// 创建函数声明
export function createFunctionDeclaration(name: string, parameters: string, returns: string, parent: ServiceDeclaration) {
  return new types.FunctionDeclaration(createIdentifier(name), createIdentifier(parameters), createIdentifier(returns), parent)
}


// 转换代码，根据AST进行代码转换
export function traverse(node: Node | null, visitor: Visitor): Node {
  recursion(node);
  return node;

  function recursion(node: Node | null) {
    if (node === null || node.visited) return;

    if (Reflect.has(visitor.visitor, node.kind)) {
      Reflect.get(visitor.visitor, node.kind)(node);
    }

    for (const key of Reflect.ownKeys(node)) {
      if (key === 'parent') continue; // 目前先暂时处理下，循环引用的问题
      const v: Node | Node[] | any = Reflect.get(node, key);
      if (Array.isArray(v)) {
        for (const n of v) {
          recursion(n);
        }
      } else {
        isNode(v) && (v.visited = true) && recursion(v);
      }
    }
  }
}
