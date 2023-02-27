import { expect } from 'chai';
import { PullsGetResponseData, PullsGetReviewResponseData } from '@octokit/types';
import {
  checkRequestedReviewers,
  checkReviewersRequiredChanges,
  getReviewersLastReviews,
  filterReviewersByState,
} from './identify-reviews';

const requested_reviewers: PullsGetResponseData['requested_reviewers'] = [
  {
    login: 'user',
    id: 7796684,
    node_id: 'MDQ6VXNlcjc3OTY2ODQ=',
    avatar_url: 'https://avatars.githubusercontent.com/u/7796684?v=4',
    gravatar_id: '',
    url: 'https://api.github.com/users/lasha3044',
    html_url: 'https://github.com/lasha3044',
    followers_url: 'https://api.github.com/users/lasha3044/followers',
    following_url: 'https://api.github.com/users/lasha3044/following{/other_user}',
    gists_url: 'https://api.github.com/users/lasha3044/gists{/gist_id}',
    starred_url: 'https://api.github.com/users/lasha3044/starred{/owner}{/repo}',
    subscriptions_url: 'https://api.github.com/users/lasha3044/subscriptions',
    organizations_url: 'https://api.github.com/users/lasha3044/orgs',
    repos_url: 'https://api.github.com/users/lasha3044/repos',
    events_url: 'https://api.github.com/users/lasha3044/events{/privacy}',
    received_events_url: 'https://api.github.com/users/lasha3044/received_events',
    type: 'User',
    site_admin: false,
  },
];

describe('should test checkRequestedReviewers:', () => {
  it('should return true if there are no requested reviewers', () => {
    const result = checkRequestedReviewers([]);

    expect(result).to.be.equal(true);
  });

  it('should return false if there are requested reviewers', () => {
    const result = checkRequestedReviewers(requested_reviewers);

    expect(result).to.be.equal(false);
  });
});

describe('should test checkReviewersRequiredChanges:', () => {
  const reviewers: PullsGetReviewResponseData[] = [
    {
      id: 1315528639,
      node_id: 'PRR_kwDOI96fUM5OaV-_',
      user: {
        login: 'user1',
        id: 125407394,
        node_id: 'U_kgDOB3mQog',
        avatar_url: 'https://avatars.githubusercontent.com/u/125407394?v=4',
        gravatar_id: '',
        url: 'https://api.github.com/users/lashapetriashvili-ezetech',
        html_url: 'https://github.com/lashapetriashvili-ezetech',
        followers_url: 'https://api.github.com/users/lashapetriashvili-ezetech/followers',
        following_url:
          'https://api.github.com/users/lashapetriashvili-ezetech/following{/other_user}',
        gists_url:
          'https://api.github.com/users/lashapetriashvili-ezetech/gists{/gist_id}',
        starred_url:
          'https://api.github.com/users/lashapetriashvili-ezetech/starred{/owner}{/repo}',
        subscriptions_url:
          'https://api.github.com/users/lashapetriashvili-ezetech/subscriptions',
        organizations_url: 'https://api.github.com/users/lashapetriashvili-ezetech/orgs',
        repos_url: 'https://api.github.com/users/lashapetriashvili-ezetech/repos',
        events_url:
          'https://api.github.com/users/lashapetriashvili-ezetech/events{/privacy}',
        received_events_url:
          'https://api.github.com/users/lashapetriashvili-ezetech/received_events',
        type: 'User',
        site_admin: false,
      },
      body: '',
      state: 'CHANGES_REQUESTED',
      html_url:
        'https://github.com/lasha-petriashvili/test-pr-automation/pull/53#pullrequestreview-1315528639',
      pull_request_url:
        'https://api.github.com/repos/lasha-petriashvili/test-pr-automation/pulls/53',
      _links: {
        html: {
          href: 'https://github.com/lasha-petriashvili/test-pr-automation/pull/53#pullrequestreview-1315528639',
        },
        pull_request: {
          href: 'https://api.github.com/repos/lasha-petriashvili/test-pr-automation/pulls/53',
        },
      },
      submitted_at: '2023-02-27T12:58:15Z',
      commit_id: '09b386f1e69bca76c45b2ed692e89ed6546ba8b6',
    },
  ];

  it('should return true if there are no reviewers', () => {
    const result = checkReviewersRequiredChanges([]);

    expect(result).to.be.equal(true);
  });

  it('should return false if there are reviewer and it\'s state equal "CHANGES_REQUESTED', () => {
    const result = checkReviewersRequiredChanges(reviewers);

    expect(result).to.be.equal(false);
  });
});

const reviewers: PullsGetReviewResponseData[] = [
  {
    id: 1315528641,
    node_id: 'PRR_kwDOI96fUM5OaV-_',
    user: {
      login: 'user1',
      id: 125407394,
      node_id: 'U_kgDOB3mQog',
      avatar_url: 'https://avatars.githubusercontent.com/u/125407394?v=4',
      gravatar_id: '',
      url: 'https://api.github.com/users/lashapetriashvili-ezetech',
      html_url: 'https://github.com/lashapetriashvili-ezetech',
      followers_url: 'https://api.github.com/users/lashapetriashvili-ezetech/followers',
      following_url:
        'https://api.github.com/users/lashapetriashvili-ezetech/following{/other_user}',
      gists_url: 'https://api.github.com/users/lashapetriashvili-ezetech/gists{/gist_id}',
      starred_url:
        'https://api.github.com/users/lashapetriashvili-ezetech/starred{/owner}{/repo}',
      subscriptions_url:
        'https://api.github.com/users/lashapetriashvili-ezetech/subscriptions',
      organizations_url: 'https://api.github.com/users/lashapetriashvili-ezetech/orgs',
      repos_url: 'https://api.github.com/users/lashapetriashvili-ezetech/repos',
      events_url:
        'https://api.github.com/users/lashapetriashvili-ezetech/events{/privacy}',
      received_events_url:
        'https://api.github.com/users/lashapetriashvili-ezetech/received_events',
      type: 'User',
      site_admin: false,
    },
    body: '',
    state: 'CHANGES_REQUESTED',
    html_url:
      'https://github.com/lasha-petriashvili/test-pr-automation/pull/53#pullrequestreview-1315528639',
    pull_request_url:
      'https://api.github.com/repos/lasha-petriashvili/test-pr-automation/pulls/53',
    _links: {
      html: {
        href: 'https://github.com/lasha-petriashvili/test-pr-automation/pull/53#pullrequestreview-1315528639',
      },
      pull_request: {
        href: 'https://api.github.com/repos/lasha-petriashvili/test-pr-automation/pulls/53',
      },
    },
    submitted_at: '2023-02-27T12:58:15Z',
    commit_id: '09b386f1e69bca76c45b2ed692e89ed6546ba8b6',
  },
  {
    id: 1315528640,
    node_id: 'PRR_kwDOI96fUM5OaV-_',
    user: {
      login: 'user2',
      id: 125407394,
      node_id: 'U_kgDOB3mQog',
      avatar_url: 'https://avatars.githubusercontent.com/u/125407394?v=4',
      gravatar_id: '',
      url: 'https://api.github.com/users/lashapetriashvili-ezetech',
      html_url: 'https://github.com/lashapetriashvili-ezetech',
      followers_url: 'https://api.github.com/users/lashapetriashvili-ezetech/followers',
      following_url:
        'https://api.github.com/users/lashapetriashvili-ezetech/following{/other_user}',
      gists_url: 'https://api.github.com/users/lashapetriashvili-ezetech/gists{/gist_id}',
      starred_url:
        'https://api.github.com/users/lashapetriashvili-ezetech/starred{/owner}{/repo}',
      subscriptions_url:
        'https://api.github.com/users/lashapetriashvili-ezetech/subscriptions',
      organizations_url: 'https://api.github.com/users/lashapetriashvili-ezetech/orgs',
      repos_url: 'https://api.github.com/users/lashapetriashvili-ezetech/repos',
      events_url:
        'https://api.github.com/users/lashapetriashvili-ezetech/events{/privacy}',
      received_events_url:
        'https://api.github.com/users/lashapetriashvili-ezetech/received_events',
      type: 'User',
      site_admin: false,
    },
    body: '',
    state: 'APPROVED',
    html_url:
      'https://github.com/lasha-petriashvili/test-pr-automation/pull/53#pullrequestreview-1315528639',
    pull_request_url:
      'https://api.github.com/repos/lasha-petriashvili/test-pr-automation/pulls/53',
    _links: {
      html: {
        href: 'https://github.com/lasha-petriashvili/test-pr-automation/pull/53#pullrequestreview-1315528639',
      },
      pull_request: {
        href: 'https://api.github.com/repos/lasha-petriashvili/test-pr-automation/pulls/53',
      },
    },
    submitted_at: '2023-02-27T12:58:15Z',
    commit_id: '09b386f1e69bca76c45b2ed692e89ed6546ba8b6',
  },
  {
    id: 1315528639,
    node_id: 'PRR_kwDOI96fUM5OaV-_',
    user: {
      login: 'user2',
      id: 125407394,
      node_id: 'U_kgDOB3mQog',
      avatar_url: 'https://avatars.githubusercontent.com/u/125407394?v=4',
      gravatar_id: '',
      url: 'https://api.github.com/users/lashapetriashvili-ezetech',
      html_url: 'https://github.com/lashapetriashvili-ezetech',
      followers_url: 'https://api.github.com/users/lashapetriashvili-ezetech/followers',
      following_url:
        'https://api.github.com/users/lashapetriashvili-ezetech/following{/other_user}',
      gists_url: 'https://api.github.com/users/lashapetriashvili-ezetech/gists{/gist_id}',
      starred_url:
        'https://api.github.com/users/lashapetriashvili-ezetech/starred{/owner}{/repo}',
      subscriptions_url:
        'https://api.github.com/users/lashapetriashvili-ezetech/subscriptions',
      organizations_url: 'https://api.github.com/users/lashapetriashvili-ezetech/orgs',
      repos_url: 'https://api.github.com/users/lashapetriashvili-ezetech/repos',
      events_url:
        'https://api.github.com/users/lashapetriashvili-ezetech/events{/privacy}',
      received_events_url:
        'https://api.github.com/users/lashapetriashvili-ezetech/received_events',
      type: 'User',
      site_admin: false,
    },
    body: '',
    state: 'REQUEST_CHANGES',
    html_url:
      'https://github.com/lasha-petriashvili/test-pr-automation/pull/53#pullrequestreview-1315528639',
    pull_request_url:
      'https://api.github.com/repos/lasha-petriashvili/test-pr-automation/pulls/53',
    _links: {
      html: {
        href: 'https://github.com/lasha-petriashvili/test-pr-automation/pull/53#pullrequestreview-1315528639',
      },
      pull_request: {
        href: 'https://api.github.com/repos/lasha-petriashvili/test-pr-automation/pulls/53',
      },
    },
    submitted_at: '2023-02-27T12:58:15Z',
    commit_id: '09b386f1e69bca76c45b2ed692e89ed6546ba8b6',
  },
];

describe('should test checkReviewersRequiredChanges:', () => {
  it('should return false if there are two reviewers but one\'s state is a "CHANGES_REQUESTED', () => {
    const result = checkReviewersRequiredChanges(reviewers);

    expect(result).to.be.equal(false);
  });
});

describe('should test getReviewersLastReviews', () => {
  it('should return empty array', () => {
    const result = getReviewersLastReviews([]);

    expect(result).to.deep.equal([]);
  });

  it('should return array of last reviews', () => {
    const result = getReviewersLastReviews(reviewers);

    expect(result).to.deep.equal([
      { ...result[0], total_review: 1 },
      { ...result[1], total_review: 2 },
    ]);
  });
});

describe('should test filterReviewersByState', () => {
  it('should return empty object', () => {
    const result = filterReviewersByState([]);

    expect(result).to.deep.equal({
      requiredChanges: [],
      approve: [],
      commented: [],
    });
  });

  it('should return array of last reviews who required changes and approve PR', () => {
    const result = filterReviewersByState(reviewers);

    expect(result).to.deep.equal({
      requiredChanges: ['user1'],
      approve: ['user2'],
      commented: [],
    });
  });
});
