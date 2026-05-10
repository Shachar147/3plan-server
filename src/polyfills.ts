/**
 * @nestjs/typeorm@7 reads util.isNullOrUndefined from Node's `util` module.
 * That helper was never standard on `util` and does not exist on newer Node.
 * This side-effect must run before any module that imports @nestjs/typeorm is evaluated,
 * so it lives in its own file imported first from main.ts (imports are hoisted before module body).
 */
import * as util from 'util';

if (typeof (util as any).isNullOrUndefined !== 'function') {
  (util as any).isNullOrUndefined = (value: unknown) =>
    value === null || value === undefined;
}
