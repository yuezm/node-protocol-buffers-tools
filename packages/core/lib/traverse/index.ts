// 遍历AST，使用Visitor模式遍历，请参考babel
import { CNode, CVisitor } from '../parser';
import { isNode } from '../util';

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
