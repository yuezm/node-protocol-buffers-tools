export interface TransformOptions {
  package: string;
}

export interface TransformServiceOptions extends TransformOptions {
  filename: string; // 文件名，指的是 import "xx" 中的 xx
  filepath: string; // 文件的完整路径
  fileRelativePath: string; // 文件基于 --path的路径，这个是用于后续引入声明所使用的路径

  serviceName?: string; // 次属性主要用于 function 使用，表示该 function 调用哪个 service 的方法
  serviceRpcName?: string;
}

export interface TransformDtoOptions extends TransformOptions {
  enumSet: Set<string>;
  messageSet: Set<string>;
}
