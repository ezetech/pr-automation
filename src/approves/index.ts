import { withDebugLog } from '../utils';
import { isPrFullyApproved as isPrFullyApprovedFunc } from './is-pr-fully-approved';
import { identifyReviewers as identifyReviewersFunc } from './identify-approvers';
import { areCIChecksPassed as areCIChecksPassedFunc } from './identify-ci';
import {
  checkReviewersRequiredChanges as checkReviewersRequiredChangesFunc,
  getReviewersLastReviews as getReviewersLastReviewsFunc,
  filterReviewersByState as filterReviewersByStateFunc,
} from './identify-reviews';

export const identifyReviewers = withDebugLog(identifyReviewersFunc);
export const isPrFullyApproved = withDebugLog(isPrFullyApprovedFunc);
export const areCIChecksPassed = withDebugLog(areCIChecksPassedFunc);
export const checkReviewersRequiredChanges = withDebugLog(
  checkReviewersRequiredChangesFunc,
);
export const getReviewersLastReviews = withDebugLog(getReviewersLastReviewsFunc);
export const filterReviewersByState = withDebugLog(filterReviewersByStateFunc);
