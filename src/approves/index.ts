import { withDebugLog } from '../utils';
import { isPrFullyApproved as isPrFullyApprovedFunc } from './is-pr-fully-approved';
import { identifyReviewers as identifyReviewersFunc } from './identify-approvers';

export const identifyReviewers = withDebugLog(identifyReviewersFunc);
export const isPrFullyApproved = withDebugLog(isPrFullyApprovedFunc);
