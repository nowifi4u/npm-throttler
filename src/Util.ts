export type Optional<T> = T | undefined | null;
export interface EmptyInterface {}

/**
 * Parameter decorator for creating getter / setter
 * with checker being called upon using setter
 */
export function GetSetCheck(checker: (v: unknown) => boolean, opts?: PropertyDescriptor) {
  return (target: any, key: string | symbol) => {
    let val = target[key];

    const getter = () => val;
    const setter = (v: unknown) => {
      if (!checker(v)) throw new Error(`Invalid value being set to parameter "${String(key)}": ${String(v)}`);
      val = v;
    };

    Object.defineProperty(target, key, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true,
      ...opts,
    });
  };
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
