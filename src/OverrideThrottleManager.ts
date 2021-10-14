/* eslint-disable @typescript-eslint/unified-signatures */
import {
  BaseThrottleManagerOptions,
  IBaseThrottleInstance,
  ThrottleInstance,
  ThrottleManager,
} from './ThrottleManager';
import { GetSetCheck } from './Util';

export * from './ThrottleManager';

export interface ThrottleOverrideOptions {
  usages?: number | null;
  duration?: number | null;
}

const DThrottleOverrideOptions: ThrottleOverrideOptions = {
  usages: null,
  duration: null,
};

function checkNumberNull(v: unknown) {
  if (v !== null) {
    if (typeof v !== 'number' || Number.isNaN(v) || v < 1) {
      throw new TypeError('Argument must be a Number >= 1.');
    }
  }
  return true;
}

export class BaseThrottleOverride {
  @GetSetCheck(checkNumberNull)
  public usages: number | null;

  @GetSetCheck(checkNumberNull)
  public duration: number | null;

  public constructor(opts: ThrottleOverrideOptions);
  public constructor(opts: ThrottleOverrideOptions = {}) {
    opts = { ...DThrottleOverrideOptions, ...opts };

    this.usages = opts.usages ?? null;
    this.duration = opts.duration ?? null;
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type IBaseThrottleOverride<_holdsOverride extends BaseThrottleOverride> = new (opts?: Object) => _holdsOverride;

export interface OptParamOverride<_holdsOverride extends BaseThrottleOverride> {
  override?: _holdsOverride;
}

export class OverrideThrottleManager<
  _holds extends ThrottleInstance = ThrottleInstance,
  _holdsOverride extends BaseThrottleOverride = BaseThrottleOverride,
> extends ThrottleManager<_holds> {
  public readonly holdsOverride: IBaseThrottleOverride<_holdsOverride>;
  public overrides: Map<any, _holdsOverride> = new Map();

  public constructor(
    opts: BaseThrottleManagerOptions,
    holds?: IBaseThrottleInstance<_holds>,
    holdsOverride?: IBaseThrottleOverride<_holdsOverride>,
  ) {
    super(opts, holds);

    this.holdsOverride = (holdsOverride ?? BaseThrottleOverride) as IBaseThrottleOverride<_holdsOverride>;
  }

  public getUsagesTotal(id: any, { override = this.overrides.get(id) }: OptParamOverride<_holdsOverride> = {}): number {
    return override?.usages ?? this.usages;
  }

  public getDurationTotal(
    id: any,
    { override = this.overrides.get(id) }: OptParamOverride<_holdsOverride> = {},
  ): number {
    return override?.duration ?? this.duration;
  }

  public setOverride(id: any, override: ThrottleOverrideOptions) {
    let ov = this.overrides.get(id);
    if (ov) {
      if ('usages' in override) ov.usages = override.usages ?? null;
      if ('duration' in override) ov.duration = override.duration ?? null;
    } else {
      ov = new this.holdsOverride(override);
      this.overrides.set(id, ov);
    }
    return ov;
  }

  public deleteOverride(id: any) {
    return this.overrides.delete(id);
  }
}
