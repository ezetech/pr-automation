import { expect } from 'chai';
import { PullsGetResponseData } from '@octokit/types';
import { Checks } from '../config/typings';
import { checkDoNotMergeLabels, checkCI } from './identify-ci';

describe('should test checkDoNotMergeLabels: ', () => {
  const labels: PullsGetResponseData['labels'] = [
    {
      id: 123456789,
      node_id: 'MDU6TGFiZWwxMjM0NTY3ODk=',
      url: 'https://api.github.com/repos/octocat/Hello-World/labels/do%20not%20merge',
      name: 'do not merge',
      color: 'ffffff',
      default: false,
      description: 'This PR should not be merged',
    },
    {
      id: 123456789,
      node_id: 'MDU6TGFiZWwxMjM0NTY3ODk=',
      url: 'https://api.github.com/repos/octocat/Hello-World/labels/do%20not%20merge',
      name: 'bug',
      color: 'ffffff',
      default: false,
      description: 'bug label',
    },
  ];

  it('should return false if the PR has a "do not merge" label', () => {
    const doNotMergeLabels = 'do not merge';

    const result = checkDoNotMergeLabels(labels, doNotMergeLabels);

    expect(result).to.be.equal(false);
  });

  it('should return true if the PR don\'t have "do-not-merge" label', () => {
    const doNotMergeLabels = 'do-not-merge';

    const result = checkDoNotMergeLabels(labels, doNotMergeLabels);

    expect(result).to.be.equal(true);
  });

  it('should return false if the PR has a "do not merge" label', () => {
    const doNotMergeLabels = 'do not merge,cancel,stop';

    const result = checkDoNotMergeLabels(labels, doNotMergeLabels);

    expect(result).to.be.equal(false);
  });
});

describe('should test checkCI: ', () => {
  it('should return false if there are more than one CI checks in progress', () => {
    const checks: Checks = {
      total_count: 4,
      check_runs: [
        {
          name: 'test',
          status: 'completed',
          conclusion: 'success',
        },
        {
          name: 'test 2',
          status: 'in_progress',
          conclusion: '',
        },
        {
          name: 'test 3',
          status: 'in_progress',
          conclusion: 'success',
        },
        {
          name: 'test 4',
          status: 'in_progress',
          conclusion: '',
        },
      ],
    };

    const result = checkCI(checks);

    expect(result).to.be.equal(false);
  });

  it('should return true if there is one "in_progress" CI and other "success" CI', () => {
    const checks: Checks = {
      total_count: 3,
      check_runs: [
        {
          name: 'test',
          status: 'completed',
          conclusion: 'success',
        },
        {
          name: 'test 2',
          status: 'in_progress',
          conclusion: '',
        },
        {
          name: 'test 3',
          status: 'in_progress',
          conclusion: 'success',
        },
      ],
    };

    const result = checkCI(checks);

    expect(result).to.be.equal(true);
  });

  it('should return false if there is list one error CI', () => {
    const checks: Checks = {
      total_count: 3,
      check_runs: [
        {
          name: 'test',
          status: 'completed',
          conclusion: 'success',
        },
        {
          name: 'test 2',
          status: 'in_progress',
          conclusion: '',
        },
        {
          name: 'test 3',
          status: 'in_progress',
          conclusion: 'error',
        },
      ],
    };

    const result = checkCI(checks);

    expect(result).to.be.equal(false);
  });
});
