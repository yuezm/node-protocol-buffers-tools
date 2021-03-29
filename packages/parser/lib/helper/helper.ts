import { Expression, Identifier, Node, PropertyAccessExpression } from 'Parser/lib/types';
import { SyntaxKind } from '../define';

export function isNode(n: any): boolean {
  return n instanceof Node;
}

export function getPropertyAccessOriginStr(node: PropertyAccessExpression): string[] {
  const result: string[] = [ node.name.escapedText ];
  let next = node.expression;

  while (next !== null) {
    if (next.kind === SyntaxKind.Identifier) {
      result.unshift((next as Identifier).escapedText);
      next = null;
    } else {
      result.unshift((next as PropertyAccessExpression).name.escapedText)
      next = (next as PropertyAccessExpression).expression;
    }
  }
  return result;
}
