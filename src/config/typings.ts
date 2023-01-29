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
