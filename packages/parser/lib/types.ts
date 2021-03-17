import { NodeFlags, SyntaxKind } from './define';

// 基本node，包含基础属性
export class Node {
  readonly kind: SyntaxKind; // 节点类型

  parent: Node | null; // 父节点
  flags: NodeFlags; // 节点特殊标记

  // 节点位于代码位置
  line: number;
  offset: number;

  constructor(kind: SyntaxKind, parent: Node | null = null, flags: NodeFlags = NodeFlags.Unknown) {
    this.kind = kind;
    this.parent = parent;
    this.flags = flags;
  }
}

export class Module extends Node {
  body: Node[]; // 当前模块文件的所有子节点

  filename: string;
  package: string;
  syntax: string;


  constructor(body: Node[] = []) {
    super(SyntaxKind.Module, null);
    this.body = body;
  }

  append(...child: Node[]): void {
    this.body.push(...child);
  }
}

// 声明
export class ServiceDeclaration extends Node {
  name: Identifier; // service 名称
  members: FunctionDeclaration[]; // service内部函数

  constructor(name: Identifier, member: FunctionDeclaration[], parent: Node | null = null) {
    super(SyntaxKind.ServiceDeclaration, parent);
    this.members = member;
    this.name = name;
  }

  append(child: FunctionDeclaration) {
    this.members.push(child);
  }

}

export class FunctionDeclaration extends Node {
  name: Identifier; // 函数名称
  parameters: Identifier; // 函数参数
  returns: Identifier; // 函数返回值

  constructor(name: Identifier, parameters: Identifier, returns: Identifier, parent: Node | null = null) {
    super(SyntaxKind.FunctionDeclaration, parent);
    this.name = name;
    this.parameters = parameters;
    this.returns = returns;
  }
}

export class MessageDeclaration extends Node {
  name: Identifier;
  members: MessageElement[];

  constructor(name: Identifier, members: MessageElement[], parent: Node | null = null) {
    super(SyntaxKind.MessageDeclaration, parent);
    this.name = name;
    this.members = members;
  }

  append(child: MessageElement) {
    this.members.push(child);
  }
}

export class MessageElement extends Node {
  name: Identifier;
  type: Identifier | PropertyAccessExpression;

  constructor(name: Identifier, type: Identifier | PropertyAccessExpression, parent: Node) {
    super(SyntaxKind.MessageDeclaration, parent);
    this.name = name;
    this.type = type;
  }
}

export class EnumDeclaration extends Node {
  name: Identifier;
  members: EnumElement[];

  constructor(name: Identifier, members: EnumElement[], parent: Node | null = null) {
    super(SyntaxKind.MessageDeclaration, parent);
    this.name = name;
    this.members = members;
  }

  append(child: EnumElement) {
    this.members.push(child);
  }
}

export class EnumElement extends Node {
  name: Identifier;
  initializer: NumericLiteral;

  constructor(name: Identifier, initializer: NumericLiteral, parent: Node) {
    super(SyntaxKind.MessageDeclaration, parent);
    this.name = name;
    this.initializer = initializer;
  }
}

// 表达式
export class Expression extends Node {
  expression: Node; // 表达式的标识

  constructor(expression: Identifier, kind?: SyntaxKind, parent: Node | null = null) {
    super(kind || SyntaxKind.Expression, parent);
    this.expression = expression;
  }
}

export class PropertyAccessExpression extends Expression {
  name: Identifier;

  constructor(expression: Identifier, name: Identifier, parent: Node | null = null) {
    super(expression, SyntaxKind.PropertyAccessExpression, parent);
    this.name = name;
  }
}

export class Identifier extends Node {
  escapedText: string; // 字面量

  constructor(escapedText: string, parent: Node | null = null) {
    super(SyntaxKind.Identifier, parent);
    this.escapedText = escapedText;
  }
}

// 字面量
export abstract class Literal extends Node {
  text: string; // 字面量的值
}

export class StringLiteral extends Literal {
  constructor(text: string, parent: Node | null = null) {
    super(SyntaxKind.StringLiteral, parent);
    this.text = text;
  }
}

export class NumericLiteral extends Literal {
  constructor(text: string, parent: Node | null = null) {
    super(SyntaxKind.NumericLiteral, parent);
    this.text = text;
  }
}
