import { Rule } from '../config/typings';

export function getRulesThatHaveAtLeastOneApprover({
  rules,
  requestedReviewerLogins,
}: {
  rules: Rule[];
  requestedReviewerLogins: string[];
}): Rule[] {
  return rules.reduce<Rule[]>((result, rule) => {
    const someApproverFromRuleAssigned = rule.reviewers.some((reviewerFromRule) =>
      requestedReviewerLogins.includes(reviewerFromRule),
    );
    if (someApproverFromRuleAssigned) {
      result.push(rule);
    }
    return result;
  }, []);
}
