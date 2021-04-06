import * as types from 'Parser/lib/types';
import { Visitor } from 'Parser/lib/define';
import { Identifier, Node, NumericLiteral } from 'Parser/lib/types';
import { isNode } from 'Parser/lib/helper/helper';
import { PropertyAccessExpression } from 'Parser/lib/types';

export function createNumericLiteral(text: string, parent: Node | null = null): NumericLiteral {
  return new types.NumericLiteral(text, parent);
}

// 创建标识符
export function createIdentifier(escapedText: string, parent: Node | null = null): Identifier {
  return new types.Identifier(escapedText, parent);
}

export function createPropertyAccessExpression(s: string): PropertyAccessExpression {
  const sl = s.split('\.');
  let i = sl.length - 1;
  const res = new PropertyAccessExpression(null, createIdentifier(sl[i]));
  res.namespace = sl[0];
  let next = res;

  i--;
  while (i >= 0) {
    if (i >= 1) {
      // 多个属性共建 xx.yy.zz.kk
      next.expression = new PropertyAccessExpression(null, createIdentifier(sl[i]));
      next = next.expression;
    } else {
      // 单个属性 xx.yy
      next.expression = createIdentifier(sl[i]);
    }
    i--;
  }
  return res;
}

// 遍历AST，使用Visitor模式遍历，请参考babel
export function traverse(node: Node | null, visitor: Visitor): Node {
  recursion(node);
  return node;

  function recursion(node: Node | null) {
    if (node === null || node.visited || !isNode(node)) return;

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
