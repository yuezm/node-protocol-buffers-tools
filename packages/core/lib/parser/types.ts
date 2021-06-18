import { CKeyWordType, CNodeFlags, CSyntaxKind } from './define';

// 基本node，包含基础属性
export class CNode {
  readonly kind: CSyntaxKind; // 节点类型

  parent: CNode | null; // 父节点
  flags: CNodeFlags; // 节点特殊标记

  // 节点位于代码位置
  line: number;
  offset: number;

  visited?: boolean;

  constructor(kind: CSyntaxKind, parent: CNode | null = null, flags: CNodeFlags = CNodeFlags.Unknown) {
    this.kind = kind;
    this.parent = parent;
    this.flags = flags;
  }
}

// 模块，表示一个文件
export class CModule extends CNode {
  body: CNode[]; // 当前模块文件的所有子节点
  package: CIdentifier | CPropertyAccessExpression;
  messages: string[];
  enums: string[];

  syntax: string;

  filename: string; // 文件名
  filepath: string; // 文件的路径
  fileRelativePath: string; // 文件的相对路径

  isMain = false; // 是否为主模块，还是依赖模块


  constructor(body: CNode[] = []) {
    super(CSyntaxKind.Module, null);
    this.body = body;
  }

  append(...child: CNode[]): void {
    this.body.push(...child);
  }
}

// service 声明
export class CServiceDeclaration extends CNode {
  name: CIdentifier; // service 名称
  members: CFunctionDeclaration[]; // service内部函数

  constructor(name: CIdentifier, member: CFunctionDeclaration[], parent: CNode | null = null) {
    super(CSyntaxKind.ServiceDeclaration, parent);
    this.members = member;
    this.name = name;
  }

  append(child: CFunctionDeclaration) {
    this.members.push(child);
  }

}

// 函数申明
export class CFunctionDeclaration extends CNode {
  name: CIdentifier; // 函数名称
  parameters: CTypeNode; // 函数参数
  returns: CTypeNode; // 函数返回值

  constructor(name: CIdentifier, parameters: CTypeNode, returns: CTypeNode, parent: CNode | null = null) {
    super(CSyntaxKind.FunctionDeclaration, parent);
    this.name = name;
    this.parameters = parameters;
    this.returns = returns;
  }
}

// message 声明
export class CMessageDeclaration extends CNode {
  name: CIdentifier;
  members: CMessageElement[];

  constructor(name: CIdentifier, members: CMessageElement[], parent: CNode | null = null) {
    super(CSyntaxKind.MessageDeclaration, parent);
    this.name = name;
    this.members = members;
  }

  append(child: CMessageElement) {
    this.members.push(child);
  }
}

// message 内部属性
export class CMessageElement extends CNode {
  name: CIdentifier;
  type: CTypeNode;

  constructor(name: CIdentifier, type: CTypeNode, parent: CNode) {
    super(CSyntaxKind.MessageElement, parent);
    this.name = name;
    this.type = type;
  }
}

// 枚举 声明
export class CEnumDeclaration extends CNode {
  name: CIdentifier;
  members: CEnumElement[];

  constructor(name: CIdentifier, members: CEnumElement[], parent: CNode | null = null) {
    super(CSyntaxKind.EnumDeclaration, parent);
    this.name = name;
    this.members = members;
  }

  append(child: CEnumElement) {
    this.members.push(child);
  }
}

// 枚举 内部属性
export class CEnumElement extends CNode {
  name: CIdentifier;
  initializer: CNumericLiteral;
  type: CTypeNode;

  constructor(name: CIdentifier, type: CTypeNode, initializer: CNumericLiteral, parent: CNode) {
    super(CSyntaxKind.EnumElement, parent);
    this.name = name;
    this.initializer = initializer;
    this.type = type;
  }
}

// 表达式
export abstract class CExpression extends CNode {
}

// import 表达式
export class CImportExpression extends CExpression {
  expression: CIdentifier;

  constructor(expression: CIdentifier, parent: CNode | null = null) {
    super(CSyntaxKind.ImportExpression, parent);
    this.expression = expression;
  }
}

// 属性访问 表达式 xx.yy
export class CPropertyAccessExpression extends CExpression {
  name: CIdentifier;
  expression: CIdentifier | CPropertyAccessExpression;
  namespace: string; // 该类型的命名空间，例如xx.yy.zz，命名空间为xx

  constructor(expression: CIdentifier | CPropertyAccessExpression, name: CIdentifier, parent: CNode | null = null) {
    super(CSyntaxKind.PropertyAccessExpression, parent);
    this.name = name;
    this.expression = expression;
  }
}

// 标识符
export class CIdentifier extends CNode {
  escapedText: string; // 字面量

  constructor(escapedText: string, parent: CNode | null = null) {
    super(CSyntaxKind.Identifier, parent);
    this.escapedText = escapedText;
  }
}

// 类型
export abstract class CTypeNode extends CNode {
}

// 关键字类型，为ts原生类型，例如 number、string...
export class CKeyWordTypeNode extends CTypeNode {
  constructor(kind: CKeyWordType, parent: CNode | null = null) {
    super(kind, parent);
  }
}

// 关键字类型，引用类型，例如以 message 声明为类型
export class CTypeReferenceNode extends CTypeNode {
  expression: CIdentifier | CPropertyAccessExpression;

  constructor(expression: CIdentifier | CPropertyAccessExpression, parent: CNode | null = null) {
    super(CSyntaxKind.TypeReference, parent);
    this.expression = expression;
  }
}

// 字面量
export abstract class CLiteral extends CNode {
  text: string; // 字面量的值
}

// 字符串字面量
export class CStringLiteral extends CLiteral {
  constructor(text: string, parent: CNode | null = null) {
    super(CSyntaxKind.StringLiteral, parent);
    this.text = text;
  }
}

// 数字字面量
export class CNumericLiteral extends CLiteral {
  constructor(text: string, parent: CNode | null = null) {
    super(CSyntaxKind.NumericLiteral, parent);
    this.text = text;
  }
}
