export interface ErrorInfo {
  code: number;
  message?: string;
}

export enum ErrorCode {
  FILE_NOT_EXIST = 10000,
  FILE_NOT_DIR = 10001,
}