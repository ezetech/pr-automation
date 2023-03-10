import { Rule, Reviews, Checks } from '../config/typings';
import { checkReviewersRequiredChanges, areCIChecksPassed } from './';

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
}: Params): boolean | string {
  const checkCIChecks = areCIChecksPassed({ checks, requiredChecks });

  if (checkCIChecks !== true) {
    return checkCIChecks;
  }

  const checkReviewers = checkReviewersRequiredChanges({ reviews, rules });

  if (checkReviewers !== true) {
    return checkReviewers;
  }

  return true;
}
