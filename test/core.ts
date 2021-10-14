// @ts-expect-error
import * as matchers from 'jest-extended';
expect.extend(matchers);

import { _Function, _AsyncFunction } from './global';

import { Console } from 'console';
global.console = new Console(process.stdout, process.stderr);

export interface timefyFunctionResult {
  time?: number;
  result?: any;
}

export interface timefyFunctionError {
  time?: number;
  error?: any;
}

export async function timefyFunction(fn: _Function | _AsyncFunction, ...args: any[]): Promise<timefyFunctionResult> {
  const start = process.hrtime.bigint();
  const result = await fn(...args);
  const stop = process.hrtime.bigint();
  return {
    result,
    time: Number(stop - start) / 1e6,
  };
}

export async function timefyFunctionSafe(
  fn: _Function | _AsyncFunction,
  ...args: any[]
): Promise<timefyFunctionResult | timefyFunctionError> {
  const start = process.hrtime.bigint();
  try {
    const result = await fn(...args);
    const stop = process.hrtime.bigint();
    const time = Number(stop - start) / 1e6;
    return { time, result };
  } catch (error) {
    const stop = process.hrtime.bigint();
    const time = Number(stop - start) / 1e6;
    return { time, error };
  }
}

// ---------------------------------- //
//             For debug              //
// ---------------------------------- //

export function JSONstringifyArray(obj: any): string {
  return JSON.stringify(obj, (k, v) => {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return k && v && typeof v !== 'number' ? (Array.isArray(v) ? '[object Array]' : `${v}`) : v;
  });
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function wrapLogFunction(fn: _Function | _AsyncFunction, prefix?: string) {
  /* eslint-disable no-invalid-this, @typescript-eslint/restrict-template-expressions */
  return function wrapperLogger(this: any, ...args: any[]) {
    const result = fn.call(this, ...args);
    console.log(
      `${prefix ? `[${prefix}] ` : ''}${this?.constructor?.name ?? ''}.${fn.name} ${JSONstringifyArray(
        args,
      )} => ${String(result)}`,
    );
    return result;
  };
  /* eslint-enable no-invalid-this, @typescript-eslint/restrict-template-expressions */
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function proxifyLogMethods<T extends Object>(target: T, prefix?: string): T {
  const fmap = {};
  return new Proxy(target, {
    get: (target, propKey) => {
      const propValue = target[propKey];
      if (typeof propValue !== 'function') return propValue;
      if (propValue.prototype) return propValue;
      return (fmap[propKey] ??= wrapLogFunction(propValue, prefix));
    },
  });
}
