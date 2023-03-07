import { ReviewerByState, Rule, Reviews } from '../config/typings';

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
 * Check if all required reviewers approved the PR
 *
 * @param reviews
 * @param rules
 *
 * @returns true if all required reviewers approved the PR, otherwise return a string with the error message
 */
export function checkReviewersRequiredChanges({
  reviews,
  rules,
}: {
  reviews: Reviews;
  rules: Rule[];
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

  for (const role of rules) {
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
