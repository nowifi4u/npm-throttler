import { sleep } from '../src/Util';

import { ThrottleManager, ThrottleInstance } from '../src/ThrottleManager';
import { timefyFunction } from './core';

const usages = 3;
const duration = 2000;
const throttlemanager = new ThrottleManager({ usages, duration });

describe('ThrottleInstance', () => {
  function createThrottleInstance(prefix?: string) {
    void prefix;
    return new ThrottleInstance(throttlemanager, 'test-throttle-instance', { emit: false });
  }

  it('#getUsagesTotal', () => {
    const throttleinstance = createThrottleInstance('#getUsagesTotal');
    expect(throttleinstance.getUsagesTotal()).toEqual(usages);
  });

  it('#getUsagesLeft', async () => {
    const throttleinstance = createThrottleInstance('#getUsagesLeft');
    expect(throttleinstance.getUsagesLeft()).toEqual(null);

    expect(throttleinstance.use()).toEqual(true);
    expect(throttleinstance.getUsagesLeft()).toEqual(usages - 1);

    await sleep(200);
    expect(throttleinstance.use()).toEqual(true);
    expect(throttleinstance.getUsagesLeft()).toEqual(usages - 2);

    await sleep(200);
    expect(throttleinstance.use()).toEqual(true);
    expect(throttleinstance.getUsagesLeft()).toEqual(usages - 3);

    await sleep(200);
    expect(throttleinstance.use()).toEqual(false);
    expect(throttleinstance.getUsagesLeft()).toEqual(usages - 3);

    await sleep(duration - 600);
    expect(throttleinstance.getUsagesLeft()).toEqual(null);

    expect(throttleinstance.use()).toEqual(true);
    expect(throttleinstance.stop()).toEqual(true);
    expect(throttleinstance.getUsagesLeft()).toEqual(null);
  });

  it('#getDurationTotal', () => {
    const throttleinstance = createThrottleInstance('#getDurationTotal');
    expect(throttleinstance.getDurationTotal()).toEqual(duration);
  });

  it('#getDurationLeft', async () => {
    const throttleinstance = createThrottleInstance('#getDurationLeft');
    expect(throttleinstance.getDurationLeft()).toEqual(null);

    expect(throttleinstance.use()).toEqual(true);
    expect(throttleinstance.getDurationLeft()).toBeWithin(duration - 100, duration + 1);

    await sleep(200);
    expect(throttleinstance.use()).toEqual(true);
    expect(throttleinstance.getDurationLeft()).toBeWithin(duration - 300, duration - 200);

    await sleep(200);
    expect(throttleinstance.use()).toEqual(true);
    expect(throttleinstance.getDurationLeft()).toBeWithin(duration - 500, duration - 400);

    await sleep(duration - 400);
    expect(throttleinstance.getDurationLeft()).toEqual(null);

    expect(throttleinstance.use()).toEqual(true);
    expect(throttleinstance.stop()).toEqual(true);
    expect(throttleinstance.getDurationLeft()).toEqual(null);
  });

  it('#check', async () => {
    const throttleinstance = createThrottleInstance('#check');
    expect(throttleinstance.check()).toEqual(true);

    expect(throttleinstance.use()).toEqual(true);
    expect(throttleinstance.check()).toEqual(true);

    await sleep(200);
    expect(throttleinstance.use()).toEqual(true);
    expect(throttleinstance.check()).toEqual(true);

    await sleep(200);
    expect(throttleinstance.use()).toEqual(true);
    expect(throttleinstance.check()).toEqual(false);

    await sleep(200);
    expect(throttleinstance.use()).toEqual(false);
    expect(throttleinstance.check()).toEqual(false);

    await sleep(duration - 600);
    expect(throttleinstance.check()).toEqual(true);

    expect(throttleinstance.use()).toEqual(true);
    expect(throttleinstance.stop()).toEqual(true);
    expect(throttleinstance.check()).toEqual(true);
  });
});

describe('ThrottleManager', () => {
  it('#usages', () => {
    expect(throttlemanager.usages).toEqual(usages);
  });

  it('#getUsagesTotal', () => {
    const id = 'test-get-usages-total';
    expect(throttlemanager.getUsagesTotal(id)).toEqual(usages);
  });

  it('#getUsagesLeft', async () => {
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

  it('#duration', () => {
    expect(throttlemanager.duration).toEqual(duration);
  });

  it('#getDurationTotal', () => {
    const id = 'test-get-duration-total';
    expect(throttlemanager.getDurationTotal(id)).toEqual(duration);
  });

  it('#getDurationLeft', async () => {
    const id = 'test-duration';
    expect(throttlemanager.getDurationLeft(id)).toEqual(null);

    expect(throttlemanager.use(id)).toEqual(true);
    expect(throttlemanager.getDurationLeft(id)).toBeWithin(duration - 100, duration + 1);

    await sleep(200);
    expect(throttlemanager.use(id)).toEqual(true);
    expect(throttlemanager.getDurationLeft(id)).toBeWithin(duration - 300, duration - 200 + 1);

    await sleep(200);
    expect(throttlemanager.use(id)).toEqual(true);
    expect(throttlemanager.getDurationLeft(id)).toBeWithin(duration - 500, duration - 400 + 1);

    await sleep(duration - 400);
    expect(throttlemanager.getDurationLeft(id)).toEqual(null);
  });

  it('#check', async () => {
    const id = 'test-check';
    expect(throttlemanager.check(id)).toEqual(true);

    expect(throttlemanager.use(id)).toEqual(true);
    expect(throttlemanager.check(id)).toEqual(true);

    await sleep(200);
    expect(throttlemanager.use(id)).toEqual(true);
    expect(throttlemanager.check(id)).toEqual(true);

    await sleep(200);
    expect(throttlemanager.use(id)).toEqual(true);
    expect(throttlemanager.check(id)).toEqual(false);

    await sleep(200);
    expect(throttlemanager.use(id)).toEqual(false);
    expect(throttlemanager.check(id)).toEqual(false);

    await sleep(duration - 600);
    expect(throttlemanager.use(id)).toEqual(true);
    expect(throttlemanager.stop(id)).toEqual(true);
    expect(throttlemanager.check(id)).toEqual(true);
  });

  describe('#on("ready")', () => {
    it('should emit on being ready', async () => {
      const id1 = 'test-event-ready-1';

      expect(throttlemanager.use(id1)).toEqual(true);

      const result = await timefyFunction(makePromiseEmit, id1, duration * 2);
      expect(result.time).toBeWithin(duration, duration + 100 + 1);
    });

    it('should not emit after #stop(id)', async () => {
      const id1 = 'test-event-ready-3';
      const id2 = 'test-event-ready-4';

      expect(throttlemanager.use(id1)).toEqual(true);
      expect(throttlemanager.use(id2)).toEqual(true);

      throttlemanager.stop(id1);

      await Promise.all([makePromiseNoEmit(id1, duration * 2), makePromiseEmit(id2, duration * 2)]);
    });

    it('should not emit after #stopAll()', async () => {
      const id1 = 'test-event-ready-5';
      const id2 = 'test-event-ready-6';

      expect(throttlemanager.use(id1)).toEqual(true);
      expect(throttlemanager.use(id2)).toEqual(true);

      throttlemanager.stopAll();

      await Promise.all([makePromiseNoEmit(id1, duration * 2), makePromiseNoEmit(id2, duration * 2)]);
    });
  });
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

afterAll(() => {
  throttlemanager.stopAll();
});
