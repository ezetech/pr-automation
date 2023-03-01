import { expect } from 'chai';

import { getTransitionId, getIssueIdFromBranchName } from './jira';
import { JiraTransitions } from '../config/typings';

describe('Should test getIssueIdFromBranchName:', () => {
  it('Should return null if branch name is empty', () => {
    expect(getIssueIdFromBranchName('')).to.be.null;
  });

  it('Should return null if branch name is not in correct format', () => {
    expect(getIssueIdFromBranchName('branch')).to.be.null;
    expect(getIssueIdFromBranchName('1-TEST-somthing-something')).to.be.null;
  });

  it('Should return TEST-1 if branch name is in correct format', () => {
    expect(getIssueIdFromBranchName('TEST-1-something-asdasd-asdasd')).to.be.equal(
      'TEST-1',
    );
  });
});

describe('Should test getTransitionId:', () => {
  const transitions: JiraTransitions[] = [
    {
      id: '11',
      name: 'To Do',
      to: {
        description: '',
        iconUrl: 'https://test-github-actions.atlassian.net/',
        name: 'To Do',
        id: '10000',
        statusCategory: {
          self: 'https://test-github-actions.atlassian.net/rest/api/3/statuscategory/2',
          id: 2,
          key: 'new',
          colorName: 'blue-gray',
          name: 'To Do',
        },
      },
    },
    {
      id: '21',
      name: 'In Progress',
      to: {
        description:
          'This issue is being actively worked on at the moment by the assignee.',
        iconUrl:
          'https://test-github-actions.atlassian.net/images/icons/statuses/inprogress.png',
        name: 'In Progress',
        id: '3',
        statusCategory: {
          self: 'https://test-github-actions.atlassian.net/rest/api/3/statuscategory/4',
          id: 4,
          key: 'indeterminate',
          colorName: 'yellow',
          name: 'In Progress',
        },
      },
    },
    {
      id: '31',
      name: 'Done',
      to: {
        description: '',
        iconUrl: 'https://test-github-actions.atlassian.net/',
        name: 'Done',
        id: '10001',
        statusCategory: {
          self: 'https://test-github-actions.atlassian.net/rest/api/3/statuscategory/3',
          id: 3,
          key: 'done',
          colorName: 'green',
          name: 'Done',
        },
      },
    },
    {
      id: '41',
      name: 'Code Review',
      to: {
        description: 'This status is managed internally by Jira Software',
        iconUrl: 'https://test-github-actions.atlassian.net/',
        name: 'Code Review',
        id: '10010',
        statusCategory: {
          self: 'https://test-github-actions.atlassian.net/rest/api/3/statuscategory/4',
          id: 4,
          key: 'indeterminate',
          colorName: 'yellow',
          name: 'In Progress',
        },
      },
    },
    {
      id: '51',
      name: 'Ready For QA',
      to: {
        description: 'This status is managed internally by Jira Software',
        iconUrl: 'https://test-github-actions.atlassian.net/',
        name: 'Ready For QA',
        id: '10011',
        statusCategory: {
          self: 'https://test-github-actions.atlassian.net/rest/api/3/statuscategory/4',
          id: 4,
          key: 'indeterminate',
          colorName: 'yellow',
          name: 'In Progress',
        },
      },
    },
  ];

  it('Should return null if transition name is empty', () => {
    expect(getTransitionId(transitions, '')).to.be.null;
  });

  it('Should return null if transition name is wrong', () => {
    expect(getTransitionId(transitions, 'test')).to.be.null;
    expect(getTransitionId(transitions, 'Ready For')).to.be.null;
  });

  it('Should return transition id if transition name is correct', () => {
    expect(getTransitionId(transitions, 'Ready For QA')).to.be.equal('51');
    expect(getTransitionId(transitions, 'Done')).to.be.equal('31');
  });

  it('Should return transition id if transition name is correct and lowercase', () => {
    expect(getTransitionId(transitions, 'ready for qa')).to.be.equal('51');
    expect(getTransitionId(transitions, 'done')).to.be.equal('31');
  });
});
