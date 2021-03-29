/**
 * 将 AST --> nest.js module
 */

import * as types from "Parser/lib/types";
import { ModuleDeclaration } from "typescript";
import { transformService } from "./service";

export function transform(node: types.Module): any {
  return transformService(node);
}