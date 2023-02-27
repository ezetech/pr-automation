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

export type Checks = {
  total_count: number;
  check_runs: {
    name: string;
    status: string;
    conclusion: string;
  }[];
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
