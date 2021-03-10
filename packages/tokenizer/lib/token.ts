const delimitReg = /[\s{}=;:[\],'"()<>]/g;
const stringDoubleRe = /(?:"([^"\\]*(?:\\.[^"\\]*)*)")/g;
const stringSingleRe = /(?:'([^'\\]*(?:\\.[^'\\]*)*)')/g;

const setCommentRe = /^ *[*/]+ */;
const setCommentAltRe = /^\s*\*?\/*/;
const setCommentSplitRe = /\n/g;
const whitespaceRe = /\s/;

const UNESCAPE_REG = /\\(.?)/g;

const unescapeMap = {
  "0": "\0",
  "r": "\r",
  "n": "\n",
  "t": "\t"
};


export class Token {
  /**
   * 整理 \ 类的字符串
   * @param str
   */
  unescape(str) {
    return str.replace(UNESCAPE_REG, function ($0, $1) {
      switch ($1) {
        case "\\":
        case "":
          return $1;
        default:
          return unescapeMap[$1] || "";
      }
    });
  }
}
