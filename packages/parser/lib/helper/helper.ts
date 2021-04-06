import { Node } from 'Parser/lib/types';

export function isNode(n: any): boolean {
  return n instanceof Node;
}

