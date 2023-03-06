import { Rule, Reviews, Checks } from '../config/typings';
import { warning } from '../logger';
import { checkReviewersRequiredChanges } from './identify-reviews';
import { areCIChecksPassed } from './identify-ci';

type Params = {
  rules: Rule[];
  requiredChecks: string[] | undefined;
  checks: Checks;
  reviews: Reviews;
};

export function isPrFullyApproved({
  rules,
  requiredChecks,
  checks,
  reviews,
}: Params): boolean {
  const checkCIChecks = areCIChecksPassed(checks, requiredChecks);

  if (checkCIChecks !== true) {
    warning(checkCIChecks);
    return false;
  }

  const checkReviewers = checkReviewersRequiredChanges(reviews, rules);

  if (checkReviewers !== true) {
    warning(checkReviewers);
    return false;
  }

  return true;
}
