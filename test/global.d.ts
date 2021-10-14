import 'jest-extended';

type BaseArray = readonly unknown[];
type _Function<argT extends BaseArray = any, resT = any> = (...args: argT) => resT;
type _AsyncFunction<argT extends BaseArray = any, resT = any> = _Function<argT, Promise<resT>>;
