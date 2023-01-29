import { withDebugLog } from '../utils';
import { identifyApprovers as identifyApproversFunc } from './identify-approvers';

export const identifyApprovers = withDebugLog(identifyApproversFunc);
