import { PullsGetResponseData } from '@octokit/types';
import { ReviewerByState, Rule, FunctionResponse, Reviews } from '../config/typings';

type ReviewersLastReviews = {
  total_review: number;
  state: string;
  user: { login: string };
};

export function getReviewersLastReviews(listReviews: Reviews) {
  const response: {
    [key: string]: ReviewersLastReviews;
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
          user: {
            login,
          },
          state: review.state,
          total_review: 0,
        };
      }

      response[login].total_review += 1;
    });
  return Object.values(response);
}

export function filterReviewersByState(
  reviewersFullData: ReviewersLastReviews[],
): ReviewerByState {
  const response: ReviewerByState = {
    requiredChanges: [],
    approve: [],
    commented: [],
  };

  reviewersFullData.forEach((reviewer) => {
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

export function checkRequestedReviewers(
  requestedReviewers: PullsGetResponseData['requested_reviewers'],
): FunctionResponse {
  const requestedChanges = requestedReviewers.map((reviewer) => reviewer.login);

  if (requestedChanges.length > 0) {
    return {
      status: false,
      message: `Waiting [${requestedChanges.join(', ')}] to approve.`,
    };
  }
  return { status: true };
}

/**
 * @param reviews
 * @param reviewersWithRules
 */
export function checkReviewersRequiredChanges(reviews: Reviews, rules: Rule[]) {
  const reviewersByState: ReviewerByState = filterReviewersByState(
    getReviewersLastReviews(reviews),
  );

  if (reviewersByState.requiredChanges.length) {
    return `${reviewersByState.requiredChanges.join(', ')} required changes.`;
  }

  for (const role of rules) {
    if (role.required) {
      const requiredReviewers = role.reviewers.filter((reviewer) => {
        return reviewersByState.approve.includes(reviewer);
      });

      if (requiredReviewers.length < role.required) {
        return `Waiting ${role.required} reviews from ${role.reviewers.join(
          ', ',
        )} to approve.`;
      }
    }
  }

  return true;
}
