const DELIMITED_RE = /[\s{}=;:[\],'"()<>]/g; // 划界符正则，空白、{、}、=、;、:、[、]、,、'、"、(、)、<、>

// 引号正则
const STRING_DOUBLE_RE = /(?:"([^"\\]*(?:\\.[^"\\]*)*)")/g; // 双引号正则
const STRING_SINGLE_RE = /(?:'([^'\\]*(?:\\.[^'\\]*)*)')/g; // 单引号正则

// 注释正则
const SET_COMMENT_RE = /^ *[*/]+ */;
const SET_COMMENT_ALT_RE = /^\s*\*?\/*/;

const SET_SPLIT_RE = /\n/g; // 换行符

// 空格正则
const WHITESPACE_RE = /\s/;

// 特殊字符，例如转义字符正则
const UNESCAPE_RE = /\\(.?)/g;

const UNESCAPE_MAP = {
  "0": "\0",
  "r": "\r",
  "n": "\n",
  "t": "\t"
};

export enum LookBackENum {
  TWO = 2, // 匹配 /* //
  THREE = 3, // 匹配 /** ///
}


export default class Tokenizer {
  private readonly source: string;
  private readonly alternateCommentMode: boolean;

  // 代码的位置
  offset: number;
  lineOffset: number;
  length: number;
  line: number;

  // 注释相关字段
  commentType: null | string;
  commentText: null | string;
  commentLine: number;
  commentLineEmpty: boolean;
  commentIsLeading: boolean;

  stack: string[];

  stringDelimit: null | string;

  constructor(source: string, alternateCommentMode = false) {
    this.source = source;
    this.alternateCommentMode = alternateCommentMode;

    this.offset = 0;
    this.lineOffset = 1;
    this.length = source.length;
    this.line = 1;

    this.commentType = null;
    this.commentText = null;
    this.commentLine = 0;
    this.commentLineEmpty = false;
    this.commentIsLeading = false;

    this.stack = [];

    this.stringDelimit = null;
  }

  static unescape(str: string): string {
    return str.replace(UNESCAPE_RE, function ($0, $1) {
      switch ($1) {
        case "\\":
        case "":
          return $1;
        default:
          return UNESCAPE_MAP[$1] || "";
      }
    });
  }

  illegal(subject: string): Error {
    return Error("illegal " + subject + " (line " + this.line + ")");
  }

  linePlus(): number {
    this.line++;
    this.lineOffset = 0;
    return this.line;
  }

  offsetPlus(): number {
    this.offset++;
    this.lineOffset++;
    return this.offset;
  }

  setOffsetValue(v: number): number {
    this.lineOffset = this.lineOffset + v - this.offset;
    this.offset = v;
    return this.offset;
  }

  // 读取一个字符串
  readString(): string {
    const re = this.stringDelimit === "'" ? STRING_SINGLE_RE : STRING_DOUBLE_RE;
    re.lastIndex = this.offset - 1;
    const match = re.exec(this.source);

    if (!match) throw this.illegal("string");
    // this.offset = re.lastIndex;
    this.setOffsetValue(re.lastIndex);
    // 使用栈来记录是单引号还是双引号，并保持引号合并
    this.push(this.stringDelimit);
    this.stringDelimit = null;
    return Tokenizer.unescape(match[1]);
  }

  push(token: string): void {
    this.stack.push(token);
  }

  charAt(pos: number): string {
    return this.source.charAt(pos);
  }

  // 解析注释
  setComment(start: number, end: number, isLeading: boolean) {
    this.commentType = this.source.charAt(start++);
    this.commentLine = this.line;
    this.commentLineEmpty = false;
    this.commentIsLeading = isLeading;

    // 匹配注释字符的长度，例如
    const lookBack = this.alternateCommentMode ? LookBackENum.TWO : LookBackENum.THREE;
    let commentOffset = start - lookBack;
    let c;

    do {
      if (--commentOffset < 0 || (c = this.source.charAt(commentOffset)) === "\n") {
        this.commentLineEmpty = true;
        break;
      }
    } while (c === " " || c === "\t");

    const lines = this.source.substring(start, end).split(SET_SPLIT_RE);
    for (let i = 0; i < lines.length; ++i) {
      lines[i] = lines[i].replace(this.alternateCommentMode ? SET_COMMENT_ALT_RE : SET_COMMENT_RE, "").trim();
    }
    return this.commentText = lines.join("\n").trim();
  }

  // 双斜线注释
  isDoubleSlashCommentLine(startOffset: number): boolean {
    const endOffset = this.findEndOfLine(startOffset);
    // see if remaining line matches comment pattern
    const lineText = this.source.substring(startOffset, endOffset);
    // look for 1 or 2 slashes since startOffset would already point past
    // the first slash that started the comment.
    return /^\s*\/{1,2}/.test(lineText);
  }

  // find end of cursor's line
  findEndOfLine(cursor: number): number {
    let endOffset = cursor;
    while (endOffset < this.length && this.charAt(endOffset) !== "\n") {
      endOffset++;
    }
    return endOffset;
  }

  // 关键方法，获取下一个token
  next(): string | null {
    // 结束读取字符串
    if (this.stack.length > 0) return this.stack.shift();
    // 开始读取字符串
    if (this.stringDelimit !== null) return this.readString();
    let repeat = false;
    let prev: string;
    let curr: string;
    let start: number;
    let isDoc: boolean;
    let isLeadingComment = this.offset === 0;

    do {
      // 读取完了
      if (this.offset === this.length) return null;
      repeat = false;

      // 取空格
      while (WHITESPACE_RE.test(curr = this.charAt(this.offset))) {
        // 取换行
        if (curr === "\n") {
          isLeadingComment = true;
          this.linePlus();
        }
        // if (++this.offset === this.length) return null;
        if (this.offsetPlus() === this.length) return null;
      }

      if (this.charAt(this.offset) === "/") {
        // if (++this.offset === this.length) throw this.illegal("comment");
        if (this.offsetPlus() === this.length) throw this.illegal("comment");

        if (this.charAt(this.offset) === "/") { // Line
          if (!this.alternateCommentMode) {
            // check for triple-slash comment
            isDoc = this.charAt(start = this.offset + 1) === "/";

            // while (this.charAt(++this.offset) !== "\n") {
            while (this.charAt(this.offsetPlus()) !== "\n") {
              if (this.offset === this.length) return null;
            }
            // ++this.offset;
            this.offsetPlus();
            if (isDoc) {
              this.setComment(start, this.offset - 1, isLeadingComment);
            }
            this.linePlus();
            repeat = true;
          } else {
            // check for double-slash comments, consolidating consecutive lines
            start = this.offset;
            isDoc = false;

            if (this.isDoubleSlashCommentLine(this.offset)) {
              isDoc = true;
              do {
                const endOffset = this.findEndOfLine(this.offset);
                if (this.source[endOffset] === '\n') {
                  this.linePlus();
                }
                this.setOffsetValue(endOffset);
                if (this.offset === this.length) {
                  break;
                }
                this.offsetPlus();
              } while (this.isDoubleSlashCommentLine(this.offset));
            } else {
              // this.offset = Math.min(this.length, this.findEndOfLine(this.offset) + 1);
              this.setOffsetValue(Math.min(this.length, this.findEndOfLine(this.offset) + 1));
            }
            if (isDoc) {
              this.setComment(start, this.offset, isLeadingComment);
            }
            // this.linePlus(); // 此处计算容易造成多斜线注释时的BUG
            repeat = true;
          }
        } else if ((curr = this.charAt(this.offset)) === "*") { /* Block */
          // check for /** (regular comment mode) or /* (alternate comment mode)
          start = this.offset + 1;
          isDoc = this.alternateCommentMode || this.charAt(start) === "*";
          do {
            if (curr === "\n") {
              this.linePlus();
            }
            // if (++this.offset === this.length) {
            if (this.offsetPlus() === this.length) {
              throw this.illegal("comment");
            }
            prev = curr;
            curr = this.charAt(this.offset);
          } while (prev !== "*" || curr !== "/");
          // ++this.offset;
          this.offsetPlus();
          if (isDoc) {
            this.setComment(start, this.offset - 2, isLeadingComment);
          }
          repeat = true;
        } else {
          return "/";
        }
      }
    } while (repeat);
    // offset !== length if we got here

    let end = this.offset;
    DELIMITED_RE.lastIndex = 0;
    const delimit = DELIMITED_RE.test(this.charAt(end++));

    if (!delimit) {
      while (end < this.length && !DELIMITED_RE.test(this.charAt(end))) {
        ++end
      }
    }
    const token = this.source.substring(this.offset, this.setOffsetValue(end));
    if (token === "\"" || token === "'") {
      this.stringDelimit = token;
    }
    return token;
  }
}
