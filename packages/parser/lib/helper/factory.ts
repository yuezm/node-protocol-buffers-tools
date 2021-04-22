import * as types from 'Parser/lib/types';
import { CVisitor } from 'Parser/lib/define';
import { CIdentifier, CNode, CNumericLiteral } from 'Parser/lib/types';
import { isNode } from 'Parser/lib/helper/helper';
import { CPropertyAccessExpression } from 'Parser/lib/types';

export function customCreateNumericLiteral(text: string, parent: CNode | null = null): CNumericLiteral {
  return new types.CNumericLiteral(text, parent);
}

// 创建标识符
export function customCreateIdentifier(escapedText: string, parent: CNode | null = null): CIdentifier {
  return new types.CIdentifier(escapedText, parent);
}

// 创建属性访问 xx.yy.zz
export function customCreatePropertyAccessExpression(s: string): CPropertyAccessExpression {
  if (!s.includes('\.')) return null;
  const sl = s.split('\.');
  let i = sl.length - 1;
  const res = new CPropertyAccessExpression(null, customCreateIdentifier(sl[i]));
  res.namespace = sl[0];
  let next = res;

  i--;
  while (i >= 0) {
    if (i >= 1) {
      // 多个属性共建 xx.yy.zz.kk
      next.expression = new CPropertyAccessExpression(null, customCreateIdentifier(sl[i]));
      next = next.expression;
    } else {
      // 单个属性 xx.yy
      next.expression = customCreateIdentifier(sl[i]);
    }
    i--;
  }
  return res;
}

// 遍历AST，使用Visitor模式遍历，请参考babel
export function customTraverse(node: CNode | null, visitor?: CVisitor): CNode {
  recursion(node);
  return node;

  function recursion(node: CNode | null) {
    if (node === null || node.visited || !isNode(node)) return;
    node.visited = true;
    if (Reflect.has(visitor.visitor, node.kind)) {
      Reflect.get(visitor.visitor, node.kind)(node);
    }
    for (const key of Reflect.ownKeys(node)) {
      if (key === 'parent') continue; // 目前先暂时处理下，循环引用的问题
      const v: CNode | CNode[] | any = Reflect.get(node, key);
      if (Array.isArray(v)) {
        for (const n of v) {
          recursion(n);
        }
      } else {
        isNode(v) && recursion(v);
      }
    }
  }
}
