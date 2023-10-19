import { Rule, Reviews, Checks } from '../config/typings';
import { checkReviewersRequiredChanges, areCIChecksPassed } from './';

type Params = {
  rules: Rule[];
  requiredChecks: string[] | undefined;
  checks: Checks;
  reviews: Reviews;
  requestedReviewerLogins: string[];
  currentPendingReviewers: string[];
};

export function isPrFullyApproved({
  rules,
  requiredChecks,
  checks,
  reviews,
  requestedReviewerLogins,
  currentPendingReviewers,
}: Params): boolean | string {
  const checkCIChecks = areCIChecksPassed({ checks, requiredChecks });

  if (checkCIChecks !== true) {
    return checkCIChecks;
  }

  const checkReviewers = checkReviewersRequiredChanges({
    reviews,
    rules,
    requestedReviewerLogins,
    currentPendingReviewers,
  });

  if (checkReviewers !== true) {
    return checkReviewers;
  }

  return true;
}
