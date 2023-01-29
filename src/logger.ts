import {
  info as logInfo,
  error as logError,
  debug as logDebug,
  warning as logWarning,
} from '@actions/core';

const isTest = process.env.NODE_ENV === 'test';

export const info = isTest ? () => {} : logInfo;
export const error = isTest ? () => {} : logError;
export const debug = isTest ? () => {} : logDebug;
export const warning = isTest ? () => {} : logWarning;
