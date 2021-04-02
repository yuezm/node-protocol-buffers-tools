/**
 * 将 AST --> nest.js module
 */

import * as types from "Parser/lib/types";
import { transformService } from "./service";
import { transformDto } from 'Transform/lib/nest/dto';

export function transform(node: types.Module): any {
  return transformDto(node);
}
