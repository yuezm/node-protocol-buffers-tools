/**
 * 将 AST --> nest.js module
 */

import * as types from "Parser/lib/types";
import { transformService } from "./service";
import { transformDto } from 'Transform/lib/nest/dto';
import { TransNestResult } from 'Transform/lib/define';
import transformModule from 'Transform/lib/nest/module';
import { generate } from 'Generator/index';
import { transformController } from 'Transform/lib/nest/controller';

export function transform(node: types.Module): TransNestResult {
  return {
    module: generate(transformModule(node)),
    controller: generate(transformController(node)),
    service: generate(transformService(node)),
    dto: generate(transformDto(node)),
  }
}
