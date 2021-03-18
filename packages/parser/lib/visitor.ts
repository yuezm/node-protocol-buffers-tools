import { Node } from './types';
import { Visitor } from './define';
import { isNode } from './helper';

export function traverse(node: Node | null, visitor: Visitor): Node {
  recursion(node);
  return node;

  function recursion(node: Node | null) {
    if (node === null || node.visited) return;

    if (Reflect.has(visitor.visitor, node.kind)) {
      Reflect.get(visitor.visitor, node.kind)(node);
    }

    for (const key of Reflect.ownKeys(node)) {
      if (key === 'parent') continue;
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
