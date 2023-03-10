import { info } from '../logger';
import { Config, DefaultRules, Rule } from '../config/typings';

function getReviewers({
  reviewers,
  createdBy,
}: Pick<Rule, 'assign' | 'reviewers'> & {
  createdBy: string;
}): Set<string> {
  const result = new Set<string>();
  reviewers.forEach((reviewer) => {
    if (reviewer === createdBy) {
      return;
    }
    return result.add(reviewer);
  });
  return result;
}

function identifyReviewersByDefaultRules({
  byFileGroups,
  fileChangesGroups,
  createdBy,
}: {
  byFileGroups: DefaultRules['byFileGroups'];
  fileChangesGroups: string[];
  requestedReviewerLogins: string[];
  createdBy: string;
}): Rule[] {
  const rulesByFileGroup = byFileGroups;
  const ruleList: Rule[] = [];
  fileChangesGroups.forEach((fileGroup) => {
    const rules = rulesByFileGroup[fileGroup];
    if (!rules) {
      return;
    }
    rules.forEach((rule) => {
      const reviewers = getReviewers({
        reviewers: rule.reviewers,
        createdBy,
      });

      ruleList.push({
        reviewers: [...reviewers],
        required: rule.required,
        assign: rule.assign,
      });
    });
  });
  return ruleList;
}

export function identifyReviewers({
  createdBy,
  rulesByCreator,
  fileChangesGroups,
  defaultRules,
  requestedReviewerLogins,
}: {
  createdBy: string;
  rulesByCreator: Config['rulesByCreator'];
  defaultRules?: Config['defaultRules'];
  fileChangesGroups: string[];
  requestedReviewerLogins: string[];
}): Rule[] {
  const rules = rulesByCreator[createdBy];
  if (!rules) {
    info(`No rules for creator ${createdBy} were found.`);
    if (defaultRules) {
      info('Using default rules');
      return identifyReviewersByDefaultRules({
        byFileGroups: defaultRules.byFileGroups,
        fileChangesGroups,
        createdBy,
        requestedReviewerLogins,
      });
    } else {
      return [];
    }
  }
  const fileChangesGroupsMap = fileChangesGroups.reduce<Record<string, string>>(
    (result, group) => {
      result[group] = group;
      return result;
    },
    {},
  );
  const result: Rule[] = [];
  rules.forEach((rule) => {
    if (rule.ifChanged) {
      const matchFileChanges = rule.ifChanged.some((group) =>
        Boolean(fileChangesGroupsMap[group]),
      );
      if (!matchFileChanges) {
        return;
      }
    }
    const reviewers = getReviewers({
      reviewers: rule.reviewers,
      createdBy,
    });

    result.push({
      reviewers: [...reviewers],
      required: rule.required,
    });
  });
  return [...result];
}
