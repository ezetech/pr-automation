import { expect } from 'chai';
import { Reviews, State, ReviewerByState } from '../config/typings';

import {
  getReviewersLastReviews,
  filterReviewersByState,
  checkReviewersRequiredChanges,
} from './';

const reviewsTemplate: Reviews[0] = {
  id: 123456789,
  node_id: 'abc',
  user: {
    login: 'test',
    id: 123456789,
    node_id: 'abc',
    avatar_url: 'https://avatars.test.com/u/123456789?v=4',
    url: 'http://api.test.com/users/test',
    html_url: 'http://test.com/test',
    gists_url: 'http://api.test.com/users/test/gists{/gist_id}',
    gravatar_id: 'abc',
    followers_url: 'http://api.test.com/users/test/followers',
    following_url: 'http://api.test.com/users/test/following{/other_user}',
    starred_url: 'http://api.test.com/users/test/starred{/owner}{/repo}',
    subscriptions_url: 'http://api.test.com/users/test/subscriptions',
    organizations_url: 'http://api.test.com/users/test/orgs',
    repos_url: 'http://api.test.com/users/test/repos',
    events_url: 'http://api.test.com/users/test/events{/privacy}',
    received_events_url: 'http://api.test.com/users/test/received_events',
    type: 'User',
    site_admin: false,
  },
  body: 'test',
  state: 'CHANGES_REQUESTED',
  html_url: 'http://test.com/pull/80#pullrequestreview-1327365830',
  pull_request_url: 'http://api.test.com/repos/test/test/pulls/1234',
  author_association: 'COLLABORATOR',
  _links: {
    html: {
      href: 'http://test.com/pull/80#pullrequestreview-123456789',
    },
    pull_request: {
      href: 'http://api.test.com/repos/test/test/pulls/123456789',
    },
  },
  submitted_at: '2023-03-06T23:16:35Z',
  commit_id: 'abc',
};

function generateReviewsExample(login: string, state: State): Reviews[0] {
  const reviewsExample = JSON.parse(JSON.stringify(reviewsTemplate));

  const result: Reviews[0] = {
    ...reviewsExample,
    state,
  };

  if (result.user) {
    result.user.login = login;
  }

  return result;
}

describe('should test getReviewersLastReviews: ', () => {
  it('should return empty array if no reviews', () => {
    expect(getReviewersLastReviews([])).to.deep.equal([]);
  });

  it('should return "APPROVED" array', () => {
    const result = getReviewersLastReviews([
      generateReviewsExample('test', 'CHANGES_REQUESTED'),
      generateReviewsExample('test', 'APPROVED'),
    ]);

    expect(result).to.deep.equal([
      {
        ...generateReviewsExample('test', 'APPROVED'),
        total_review: 2,
      },
    ]);
  });

  it('should return Reviewers last reviews', () => {
    const result = getReviewersLastReviews([
      generateReviewsExample('test1', 'APPROVED'),
      generateReviewsExample('test1', 'CHANGES_REQUESTED'),
      generateReviewsExample('test2', 'CHANGES_REQUESTED'),
    ]);

    expect(result).to.deep.equal([
      {
        ...generateReviewsExample('test1', 'CHANGES_REQUESTED'),
        total_review: 2,
      },
      {
        ...generateReviewsExample('test2', 'CHANGES_REQUESTED'),
        total_review: 1,
      },
    ]);
  });
});

describe('should test filterReviewersByState: ', () => {
  it('should return empty object if no reviews', () => {
    expect(filterReviewersByState([])).to.deep.equal({
      requiredChanges: [],
      approve: [],
      commented: [],
    });
  });

  it('should return reviewers who required changes PR', () => {
    const getLastReviews = getReviewersLastReviews([
      generateReviewsExample('test1', 'APPROVED'),
      generateReviewsExample('test1', 'CHANGES_REQUESTED'),
      generateReviewsExample('test2', 'CHANGES_REQUESTED'),
    ]);

    const result = filterReviewersByState(getLastReviews);

    expect(result).to.deep.equal({
      requiredChanges: ['test1', 'test2'],
      approve: [],
      commented: [],
    });
  });

  it('should return reviewers who required changes and approve PR', () => {
    const getLastReviews = getReviewersLastReviews([
      generateReviewsExample('test1', 'CHANGES_REQUESTED'),
      generateReviewsExample('test1', 'APPROVED'),
      generateReviewsExample('test2', 'CHANGES_REQUESTED'),
    ]);

    const result = filterReviewersByState(getLastReviews);

    expect(result).to.deep.equal({
      requiredChanges: ['test2'],
      approve: ['test1'],
      commented: [],
    });
  });

  it('should return reviewers who required changes, approve and commented PR', () => {
    const getLastReviews = getReviewersLastReviews([
      generateReviewsExample('test1', 'CHANGES_REQUESTED'),
      generateReviewsExample('test1', 'APPROVED'),
      generateReviewsExample('test2', 'CHANGES_REQUESTED'),
      generateReviewsExample('test3', 'COMMENTED'),
    ]);

    const result = filterReviewersByState(getLastReviews);

    expect(result).to.deep.equal({
      requiredChanges: ['test2'],
      approve: ['test1'],
      commented: ['test3'],
    });
  });
});

describe('should test checkReviewersRequiredChanges: ', () => {
  it('should return error message if there is no reviews', () => {
    expect(checkReviewersRequiredChanges({ reviews: [], rules: [] })).to.equal(
      'Waiting for reviews.',
    );
  });

  it('should return error message if reviewer required changes', () => {
    const reviews = getReviewersLastReviews([
      generateReviewsExample('test1', 'CHANGES_REQUESTED'),
      generateReviewsExample('test1', 'APPROVED'),
      generateReviewsExample('test2', 'CHANGES_REQUESTED'),
      generateReviewsExample('test3', 'APPROVED'),
    ]);

    const result = checkReviewersRequiredChanges({
      reviews,
      rules: [
        {
          reviewers: ['test1', 'test2', 'test3'],
          required: 1,
        },
      ],
    });

    expect(result).to.equal('test2 required changes.');
  });

  it('should return error message if reviewers required changes', () => {
    const reviews = getReviewersLastReviews([
      generateReviewsExample('test1', 'CHANGES_REQUESTED'),
      generateReviewsExample('test2', 'CHANGES_REQUESTED'),
      generateReviewsExample('test3', 'APPROVED'),
    ]);

    const result = checkReviewersRequiredChanges({
      reviews,
      rules: [
        {
          reviewers: ['test1', 'test2', 'test3'],
          required: 1,
        },
      ],
    });

    expect(result).to.equal('test1, test2 required changes.');
  });

  it('should return true if list one reviewer approve and no one required changes', () => {
    const reviews = getReviewersLastReviews([
      generateReviewsExample('test1', 'APPROVED'),
    ]);

    const result = checkReviewersRequiredChanges({
      reviews,
      rules: [
        {
          reviewers: ['test1', 'test2', 'test3'],
          required: 1,
        },
      ],
    });

    expect(result).to.equal(true);
  });

  it('should return true if list two reviewer approve and no one required changes', () => {
    const reviews = getReviewersLastReviews([
      generateReviewsExample('test1', 'APPROVED'),
      generateReviewsExample('test2', 'APPROVED'),
    ]);

    const result = checkReviewersRequiredChanges({
      reviews,
      rules: [
        {
          reviewers: ['test1', 'test2', 'test3'],
          required: 2,
        },
      ],
    });

    expect(result).to.equal(true);
  });

  it("should return error message if all required reviewer don't approve yet", () => {
    const reviews = getReviewersLastReviews([
      generateReviewsExample('test1', 'APPROVED'),
    ]);

    const result = checkReviewersRequiredChanges({
      reviews,
      rules: [
        {
          reviewers: ['test1', 'test2', 'test3'],
          required: 2,
        },
      ],
    });

    expect(result).to.equal('Waiting 2 reviews from test1, test2, test3 to approve.');
  });
});
