import { debug } from './logger';

export function getRandomItemFromArray<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function withDebugLog<In, Out>(executeFunction: (params: In) => Out) {
  return function (param: In) {
    debug(`[${executeFunction.name}]. Params: ${JSON.stringify(param)}`);
    const result = executeFunction(param);
    debug(`[${executeFunction.name}]. Result: ${JSON.stringify(result)}`);
    return result;
  };
}
