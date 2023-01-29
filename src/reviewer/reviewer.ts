import * as minimatch from 'minimatch';
import { info } from '../logger';
import { Config, DefaultRules, Rule } from '../config/typings';
import { getRandomItemFromArray } from '../utils';

export function shouldRequestReview({
  isDraft,
  options,
  currentLabels,
}: {
  isDraft: boolean;
  options?: Config['options'];
  currentLabels: string[];
}): boolean {
  if (isDraft) {
    return false;
  }
  if (!options) {
    return true;
  }
  const includesIgnoredLabels = currentLabels.some((currentLabel) => {
    return options.ignoredLabels.includes(currentLabel);
  });
  if (includesIgnoredLabels) {
    return false;
  }

  return true;
}

function getReviewersBasedOnRule({
  assign,
  reviewers,
  createdBy,
  requestedReviewerLogins,
}: Pick<Rule, 'assign' | 'reviewers'> & {
  createdBy: string;
  requestedReviewerLogins: string[];
}) {
  const result = new Set<string>();
  if (!assign) {
    reviewers.forEach((reviewer) => {
      if (reviewer === createdBy) {
        return;
      }
      return result.add(reviewer);
    });
    return result;
  }
  const preselectAlreadySelectedReviewers = reviewers.reduce<string[]>(
    (alreadySelectedReviewers, reviewer) => {
      const alreadyRequested = requestedReviewerLogins.includes(reviewer);
      if (alreadyRequested) {
        alreadySelectedReviewers.push(reviewer);
      }
      return alreadySelectedReviewers;
    },
    [],
  );
  const selectedList = [...preselectAlreadySelectedReviewers];
  while (selectedList.length < assign) {
    const reviewersWithoutRandomlySelected = reviewers.filter((reviewer) => {
      return !selectedList.includes(reviewer);
    });
    const randomReviewer = getRandomItemFromArray(reviewersWithoutRandomlySelected);
    selectedList.push(randomReviewer);
  }
  selectedList.forEach((randomlySelected) => {
    result.add(randomlySelected);
  });
  return result;
}

function identifyReviewersByDefaultRules({
  byFileGroups,
  fileChangesGroups,
  createdBy,
  requestedReviewerLogins,
}: {
  byFileGroups: DefaultRules['byFileGroups'];
  fileChangesGroups: string[];
  requestedReviewerLogins: string[];
  createdBy: string;
}): string[] {
  const rulesByFileGroup = byFileGroups;
  const set = new Set<string>();
  fileChangesGroups.forEach((fileGroup) => {
    const rules = rulesByFileGroup[fileGroup];
    if (!rules) {
      return;
    }
    rules.forEach((rule) => {
      const reviewers = getReviewersBasedOnRule({
        assign: rule.assign,
        reviewers: rule.reviewers,
        requestedReviewerLogins,
        createdBy,
      });
      reviewers.forEach((reviewer) => set.add(reviewer));
    });
  });
  return [...set];
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
}): string[] {
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
  const result = new Set<string>();
  rules.forEach((rule) => {
    if (rule.ifChanged) {
      const matchFileChanges = rule.ifChanged.some((group) =>
        Boolean(fileChangesGroupsMap[group]),
      );
      if (!matchFileChanges) {
        return;
      }
    }
    const reviewers = getReviewersBasedOnRule({
      assign: rule.assign,
      reviewers: rule.reviewers,
      createdBy,
      requestedReviewerLogins,
    });
    reviewers.forEach((reviewer) => result.add(reviewer));
  });
  return [...result];
}

export function identifyFileChangeGroups({
  fileChangesGroups,
  changedFiles,
}: {
  fileChangesGroups: Config['fileChangesGroups'];
  changedFiles: string[];
}): string[] {
  const set = new Set<string>();
  changedFiles.forEach((changedFile) => {
    for (const [groupName, patterns] of Object.entries(fileChangesGroups)) {
      patterns.forEach((pattern) => {
        const matches = minimatch(changedFile, pattern);
        if (matches) {
          set.add(groupName);
        }
      });
    }
  });
  return [...set];
}
