import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types';

export type Rule = {
  reviewers: string[];
  required: number;
  assign?: number;
  ifChanged?: string[];
};

export type DefaultRules = {
  byFileGroups: Record<string, Rule[]>;
};

type Options = {
  ignoredLabels: string[];
  requiredChecks?: string[];
};

export type Config = {
  fileChangesGroups: Record<string, string[]>;
  defaultRules?: DefaultRules;
  rulesByCreator: Record<string, Rule[]>;
  options?: Options;
  postReviewOptions?: {};
};

export type ReviewerByState = {
  requiredChanges: string[];
  approve: string[];
  commented: string[];
};

export type State = 'CHANGES_REQUESTED' | 'APPROVED' | 'COMMENTED';

export type Author = {
  login: string;
};

export type Strategy = 'merge' | 'squash' | 'rebase';

export type FunctionResponse = {
  status: boolean;
  message?: string;
};

export type Reviews = RestEndpointMethodTypes['pulls']['listReviews']['response']['data'];
export type Checks = RestEndpointMethodTypes['checks']['listForRef']['response']['data'];

export type JiraStatusCategory = {
  self: string;
  id: number;
  key: string;
  colorName: string;
  name: string;
};

export type JiraStatus = {
  description: string;
  iconUrl: string;
  name: string;
  id: string;
  statusCategory: JiraStatusCategory;
};

export type JiraTransitions = {
  id: string;
  name: string;
  to: JiraStatus;
};

export type JiraIssue = {
  id: string;
  key: string;
  created: Date;
  fields: {
    status: JiraStatus;
  };
};

export interface Inputs {
  comment: string;
  repo: string;
  owner: string;
  pullRequestNumber: number;
  sha: string;
  strategy: Strategy;
  token: string;
  doNotMergeLabels: string;
  config: string;
  doNotMergeOnBaseBranch: string;
  shouldChangeJiraIssueStatus: boolean;
  jiraToken: string;
  jiraAccount: string;
  jiraEndpoint: string;
  jiraMoveIssueFrom: string;
  jiraMoveIssueTo: string;
}

export interface Reviewer {
  author: Author;
  user: Author;
  state: State;
  body: string;
  createdAt?: Date;
  updatedAt?: Date;
  submittedAt?: Date;
}
