import { sleep } from '../src/Util';

import { timefyFunction } from './core';
import { OverrideThrottleManager } from '../src/OverrideThrottleManager';

const usages = 3;
const duration = 2000;
const throttlemanager = new OverrideThrottleManager({ usages, duration });
const usagesOverride = 2;
const durationOverride = 3000;

describe('OverrideThrottleManager', () => {
  it('#usages', () => {
    expect(throttlemanager.usages).toEqual(usages);
  });

  describe('#getUsagesTotal', () => {
    const id = 'test-get-usages-total';
    expect(throttlemanager.getUsagesTotal(id)).toEqual(usages);

    throttlemanager.setOverride(id, { usages: usagesOverride });
    expect(throttlemanager.getUsagesTotal(id)).toEqual(usagesOverride);

    throttlemanager.deleteOverride(id);
    expect(throttlemanager.getUsagesTotal(id)).toEqual(usages);

    throttlemanager.setOverride(id, { usages: null });
    expect(throttlemanager.getUsagesTotal(id)).toEqual(usages);
  });

  describe('#getUsagesLeft', () => {
    it('should return correct value', async () => {
      const id = 'test-get-usages-left';
      expect(throttlemanager.getUsagesLeft(id)).toEqual(null);

      expect(throttlemanager.use(id)).toEqual(true);
      expect(throttlemanager.getUsagesLeft(id)).toEqual(usages - 1);

      await sleep(200);
      expect(throttlemanager.use(id)).toEqual(true);
      expect(throttlemanager.getUsagesLeft(id)).toEqual(usages - 2);

      await sleep(200);
      expect(throttlemanager.use(id)).toEqual(true);
      expect(throttlemanager.getUsagesLeft(id)).toEqual(usages - 3);

      await sleep(200);
      expect(throttlemanager.use(id)).toEqual(false);
      expect(throttlemanager.getUsagesLeft(id)).toEqual(usages - 3);

      await sleep(duration - 600);
      expect(throttlemanager.getUsagesLeft(id)).toEqual(null);

      expect(throttlemanager.use(id)).toEqual(true);
      expect(throttlemanager.stop(id)).toEqual(true);
      expect(throttlemanager.getUsagesLeft(id)).toEqual(null);
    });

    it('should return correct value with override', async () => {
      const id = 'test-get-usages-left-override';

      throttlemanager.setOverride(id, { usages: usagesOverride });
      expect(throttlemanager.getUsagesLeft(id)).toEqual(null);

      throttlemanager.use(id);
      expect(throttlemanager.getUsagesLeft(id)).toEqual(usagesOverride - 1);

      await sleep(200);
      throttlemanager.use(id);
      expect(throttlemanager.getUsagesLeft(id)).toEqual(usagesOverride - 2);

      await sleep(200);
      throttlemanager.use(id);
      expect(throttlemanager.getUsagesLeft(id)).toEqual(usagesOverride - 2);

      await sleep(duration - 400);
      expect(throttlemanager.getUsagesLeft(id)).toEqual(null);

      throttlemanager.use(id);
      throttlemanager.stop(id);
      expect(throttlemanager.getUsagesLeft(id)).toEqual(null);
    });
  });

  it('#duration', () => {
    expect(throttlemanager.duration).toEqual(duration);
  });

  it('#getDurationTotal', () => {
    const id = 'test-get-duration-total';

    expect(throttlemanager.getDurationTotal(id)).toEqual(duration);

    throttlemanager.setOverride(id, { duration: durationOverride });
    expect(throttlemanager.getDurationTotal(id)).toEqual(durationOverride);

    throttlemanager.deleteOverride(id);
    expect(throttlemanager.getDurationTotal(id)).toEqual(duration);

    throttlemanager.setOverride(id, { duration: null });
    expect(throttlemanager.getDurationTotal(id)).toEqual(duration);
  });

  it('#getDurationLeft', async () => {
    const id = 'test-get-duration-left';
    expect(throttlemanager.getDurationLeft(id)).toEqual(null);

    expect(throttlemanager.use(id)).toEqual(true);
    expect(throttlemanager.getDurationLeft(id)).toBeWithin(duration - 100, duration + 1);

    await sleep(200);
    throttlemanager.use(id);
    expect(throttlemanager.getDurationLeft(id)).toBeWithin(duration - 300, duration - 200 + 1);

    await sleep(200);
    throttlemanager.use(id);
    expect(throttlemanager.getDurationLeft(id)).toBeWithin(duration - 500, duration - 400 + 1);

    await sleep(duration - 400);
    expect(throttlemanager.getDurationLeft(id)).toEqual(null);

    throttlemanager.use(id);
    throttlemanager.stop(id);
    expect(throttlemanager.getDurationLeft(id)).toEqual(null);
  });

  describe('#check', () => {
    it('should return correct value', async () => {
      const id = 'test-check';
      expect(throttlemanager.check(id)).toEqual(true);

      throttlemanager.use(id);
      expect(throttlemanager.check(id)).toEqual(true);

      await sleep(200);
      throttlemanager.use(id);
      expect(throttlemanager.check(id)).toEqual(true);

      await sleep(200);
      throttlemanager.use(id);
      expect(throttlemanager.check(id)).toEqual(false);

      await sleep(200);
      throttlemanager.use(id);
      expect(throttlemanager.check(id)).toEqual(false);

      await sleep(duration - 600);
      expect(throttlemanager.check(id)).toEqual(true);

      throttlemanager.use(id);
      throttlemanager.stop(id);
      expect(throttlemanager.check(id)).toEqual(true);
    });

    it('should return correct value with override', async () => {
      const id = 'test-check-override';
      throttlemanager.setOverride(id, { usages: usagesOverride, duration: durationOverride });
      expect(throttlemanager.check(id)).toEqual(true);

      throttlemanager.use(id);
      expect(throttlemanager.check(id)).toEqual(true);
      await sleep(200);

      throttlemanager.use(id);
      expect(throttlemanager.check(id)).toEqual(false);
      await sleep(durationOverride - 200);

      expect(throttlemanager.check(id)).toEqual(true);
    });
  });

  describe('#on("ready")', () => {
    it('should emit on being ready', async () => {
      const id1 = 'test-event-ready-1';

      throttlemanager.use(id1);

      const result = await timefyFunction(makePromiseEmit, id1, duration * 2);
      expect(result.time).toBeWithin(duration - 100, duration + 100);
    });

    it('should not emit after #stop(id)', async () => {
      const id1 = 'test-event-ready-3';
      const id2 = 'test-event-ready-4';

      throttlemanager.use(id1);
      throttlemanager.use(id2);

      setTimeout(() => throttlemanager.stop(id1), 100);

      await Promise.all([makePromiseNoEmit(id1, duration * 2), makePromiseEmit(id2, duration * 2)]);
    });

    it('should not emit after #stopAll()', async () => {
      const id1 = 'test-event-ready-5';
      const id2 = 'test-event-ready-6';

      throttlemanager.use(id1);
      throttlemanager.use(id2);

      setTimeout(() => throttlemanager.stopAll(), 100);

      await Promise.all([makePromiseNoEmit(id1, duration * 2), makePromiseNoEmit(id2, duration * 2)]);
    });
  });
});

afterAll(() => {
  throttlemanager.stopAll();
});

function makePromiseEmit(id, timeout) {
  return new Promise((resolve, reject) => {
    throttlemanager.on('ready', cid => {
      if (cid === id) resolve(true);
    });
    setTimeout(() => reject(new Error('#on("ready") not emitted')), timeout);
  });
}

function makePromiseNoEmit(id, timeout) {
  return new Promise((resolve, reject) => {
    throttlemanager.on('ready', cid => {
      if (cid === id) reject(new Error('#on("ready") emitted'));
    });
    setTimeout(() => resolve(true), timeout);
  });
}
