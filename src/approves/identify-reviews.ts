import { ReviewerByState, Rule, Reviews } from '../config/typings';
import { getRulesThatHaveAtLeastOneApprover } from './index';

export function getReviewersLastReviews(listReviews: Reviews) {
  const response: {
    [key: string]: Reviews[0] & { total_review: number };
  } = {};

  listReviews
    .slice()
    .reverse()
    .forEach((review) => {
      const login = review?.user?.login;

      if (!login) {
        return;
      }

      if (!response[login]) {
        response[login] = {
          ...review,
          total_review: 1,
        };
      } else {
        response[login].total_review += 1;
      }
    });
  return Object.values(response).slice().reverse();
}

export function filterReviewersByState(reviewersFullData: Reviews): ReviewerByState {
  const response: ReviewerByState = {
    requiredChanges: [],
    approve: [],
    commented: [],
  };

  reviewersFullData.forEach((reviewer) => {
    if (!reviewer.user) {
      return;
    }

    switch (reviewer.state) {
      case 'APPROVED':
        response.approve.push(reviewer.user.login);
        break;

      case 'CHANGES_REQUESTED':
        response.requiredChanges.push(reviewer.user.login);
        break;
      case 'COMMENTED':
        response.commented.push(reviewer.user.login);
        break;
      default:
    }
  });

  return response;
}

/**
 * skipRuleThatHaveNoAssignedReviewers.
 * will skip rule groups that are not assigned completely for some reason.
 * It happens when reviewers from some group were not assigned in case of being our of office.
 * making it true by default for every case. might consider making it as param.
 *
 * Check if all required reviewers approved the PR
 * @returns true if all required reviewers approved the PR, otherwise return a string with the error message
 */
export function checkReviewersRequiredChanges({
  reviews,
  rules,
  requestedReviewerLogins,
  skipRuleThatHaveNoAssignedReviewers = true,
}: {
  reviews: Reviews;
  rules: Rule[];
  requestedReviewerLogins: string[];
  skipRuleThatHaveNoAssignedReviewers?: boolean;
}): string | boolean {
  if (!reviews.length) {
    return 'Waiting for reviews.';
  }

  const reviewersByState: ReviewerByState = filterReviewersByState(
    getReviewersLastReviews(reviews),
  );

  if (reviewersByState.requiredChanges.length) {
    return `${reviewersByState.requiredChanges.join(', ')} required changes.`;
  }
  const rulesToMatch = skipRuleThatHaveNoAssignedReviewers
    ? getRulesThatHaveAtLeastOneApprover({ rules, requestedReviewerLogins })
    : rules;

  if (rulesToMatch.length === 0) {
    return 'It appears that there are no rules for this PR based on what users that were assigned';
  }

  for (const role of rulesToMatch) {
    if (role.required) {
      const requiredReviewers = role.reviewers.filter((reviewer) => {
        return reviewersByState.approve.includes(reviewer);
      });

      if (requiredReviewers.length < role.required) {
        return `Waiting ${role.required} approve(s) from ${role.reviewers.join(
          ', ',
        )} to approve.`;
      }
    }
  }

  return true;
}
