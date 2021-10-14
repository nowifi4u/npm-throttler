/* eslint-disable @typescript-eslint/unified-signatures */
import { EventEmitter } from 'stream';
import { EmptyInterface, GetSetCheck } from './Util';

export abstract class BaseThrottleInstance {
  public id: any;
  public counter = 0;
  public readonly manager: BaseThrottleManager<BaseThrottleInstance>;

  public constructor(manager: BaseThrottleManager<BaseThrottleInstance>, id: any) {
    this.id = id;
    this.manager = manager;
  }

  public abstract getUsagesLeft(): number | null;
  public abstract getUsagesTotal(): number;
  public abstract getDurationLeft(): number | null;
  public abstract getDurationTotal(): number;
  public abstract check(): boolean;
  public abstract use(): boolean;
  public abstract start(): boolean;
  public stop(): boolean {
    this.counter = 0;
    return true;
  }
}

export interface ThrottleInstanceOptions {
  emit?: boolean;
}

export const DThrottleInstanceOptions: ThrottleInstanceOptions = {
  emit: true,
};

export class ThrottleInstance extends BaseThrottleInstance {
  public opts: ThrottleInstanceOptions;

  public counter = 0;
  protected _timeout: ReturnType<typeof setTimeout> | null = null;
  protected _timeend: number | null = null;

  protected readonly __onReady = this._onReady.bind(this);

  public constructor(manager: BaseThrottleManager<BaseThrottleInstance>, id: any, opts: ThrottleInstanceOptions = {}) {
    super(manager, id);
    opts = { ...opts, ...DThrottleInstanceOptions };

    this.opts = opts;
  }

  public getUsagesLeft() {
    return this.manager.getUsagesLeft(this.id, { throttle: this });
  }

  public getUsagesTotal() {
    return this.manager.getUsagesTotal(this.id, { throttle: this });
  }

  public getDurationLeft() {
    if (this._timeend === null) return null;
    return this._timeend - Date.now();
  }

  public getDurationTotal() {
    return this.manager.getDurationTotal(this.id, { throttle: this });
  }

  public check() {
    if (this._timeout === null) return true;
    return this.manager.check(this.id, { throttle: this });
  }

  public use() {
    if (this.check()) {
      this.counter++;
      this.start();
      return true;
    }
    return false;
  }

  private _onReady() {
    if (this.opts.emit) this.manager.emit('ready', this.id, this);
    this.stop();
  }

  public start() {
    if (this._timeout === null) {
      const duration = this.getDurationTotal();
      this._timeout = setTimeout(this._onReady.bind(this), duration);
      this._timeend = Date.now() + duration;
      return true;
    }
    return false;
  }

  public stop() {
    if (this._timeout !== null) {
      clearTimeout(this._timeout);
      this.counter = 0;
      this._timeout = null;
      this._timeend = null;
      return true;
    }
    return false;
  }
}

export type IBaseThrottleInstance<_holds extends BaseThrottleInstance> = new (
  manager: BaseThrottleManager<_holds>,
  id: any,
  opts?: ThrottleInstanceOptions,
) => _holds;

export interface OptParamThrottle<_holds extends BaseThrottleInstance> {
  throttle?: _holds;
}

function checkNumber(v: unknown) {
  if (typeof v !== 'number' || Number.isNaN(v) || v < 1) {
    throw new TypeError('Argument must be a Number >= 1.');
  }
  return true;
}

export abstract class BaseThrottleManager<_holds extends BaseThrottleInstance> extends EventEmitter {
  public readonly holds: IBaseThrottleInstance<_holds>;
  public readonly throttles: Map<any, _holds> = new Map();

  @GetSetCheck(checkNumber)
  public usages: number;

  @GetSetCheck(checkNumber)
  public duration: number;

  public constructor(opts: BaseThrottleManagerOptions, holds: IBaseThrottleInstance<_holds>) {
    super();

    this.holds = holds;

    this.usages = opts.usages;
    this.duration = opts.duration;
  }

  public abstract getUsagesLeft(id: any, opts?: EmptyInterface): number | null;
  public abstract getUsagesTotal(id: any, opts?: EmptyInterface): number;
  public abstract getDurationLeft(id: any, opts?: EmptyInterface): number | null;
  public abstract getDurationTotal(id: any, opts?: EmptyInterface): number;
  public abstract check(id: any, opts?: EmptyInterface): boolean;
  public abstract use(id: any, opts?: EmptyInterface): boolean;
  public abstract stop(id: any, opts?: EmptyInterface): boolean;
  public abstract stopAll(): void;
}

export interface BaseThrottleManagerOptions {
  usages: number;
  duration: number;
  [key: string]: any;
}

export class ThrottleManager<_holds extends BaseThrottleInstance> extends BaseThrottleManager<_holds> {
  public readonly throttles: Map<any, _holds> = new Map();

  public constructor(opts: BaseThrottleManagerOptions, holds?: IBaseThrottleInstance<_holds>) {
    super(opts, (holds ?? ThrottleInstance) as IBaseThrottleInstance<_holds>);
  }

  public getUsagesLeft(id: any, { throttle = this.throttles.get(id) }: OptParamThrottle<_holds> = {}): number | null {
    if (throttle) {
      if (throttle.getDurationLeft() === null) return null;
      const usagesTotal = this.getUsagesTotal(id, { throttle });
      return Math.max(usagesTotal - throttle.counter, 0);
    }
    return null;
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  // @ts-expect-error
  public getUsagesTotal(id: any, {}: EmptyInterface = {}): number {
    /* eslint-enable @typescript-eslint/no-unused-vars */
    return this.usages;
  }

  public getDurationLeft(id: any, { throttle = this.throttles.get(id) }: OptParamThrottle<_holds> = {}): number | null {
    if (throttle) {
      return throttle.getDurationLeft();
    }
    return null;
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  // @ts-expect-error
  public getDurationTotal(id: any, {}: EmptyInterface = {}): number {
    /* eslint-enable @typescript-eslint/no-unused-vars */
    return this.duration;
  }

  public check(id: any, { throttle = this.throttles.get(id) }: OptParamThrottle<_holds> = {}): boolean {
    if (throttle) {
      const usagesLeft = this.getUsagesLeft(id, { throttle });
      if (usagesLeft === null) return true;
      return usagesLeft > 0;
    }
    return true;
  }

  public use(id: any, { throttle = this.throttles.get(id) }: OptParamThrottle<_holds> = {}): boolean {
    if (!throttle) {
      throttle = new this.holds(this, id);
      this.throttles.set(id, throttle);
    }
    return throttle.use();
  }

  public stop(id: any, { throttle = this.throttles.get(id) }: OptParamThrottle<_holds> = {}): boolean {
    if (throttle) {
      throttle.stop();
      this.throttles.delete(id);
      return true;
    }
    return false;
  }

  public stopAll() {
    for (const [, throttle] of this.throttles) {
      throttle.stop();
    }
  }
}

const test: BaseThrottleManager<ThrottleInstance> = new ThrottleManager({ usages: 3, duration: 10000 });
test.stopAll();
