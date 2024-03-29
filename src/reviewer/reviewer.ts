import * as minimatch from 'minimatch';
import { info, debug } from '../logger';
import { Config, DefaultRules, Rule } from '../config/typings';
import { getRandomItemFromArray } from '../utils';
import { CommitData } from '../github';

function checkIsMergePRCommit({ parents, message }: CommitData): boolean {
  if (parents.length < 2) {
    return false;
  }

  return message.startsWith('Merge pull request');
}

function checkIsMergeFromBranch(
  { parents, message }: CommitData,
  branchToCheck: string,
): boolean {
  if (parents.length < 2) {
    return false;
  }

  const normalizedMessage = message.replace(/['`"]/g, '"');

  const mergePattern1 = `Merge branch "${branchToCheck}"`;
  const mergePattern2 = `Merge remote-tracking branch "origin/${branchToCheck}"`;

  return (
    normalizedMessage.startsWith(mergePattern1) ||
    normalizedMessage.startsWith(mergePattern2)
  );
}

export function shouldRequestReview({
  isDraft,
  options,
  commitData,
  currentLabels,
}: {
  isDraft: boolean;
  commitData?: CommitData;
  options?: Config['options'];
  currentLabels: string[];
}): boolean {
  if (isDraft) {
    return false;
  }
  if (!options) {
    return true;
  }
  const { ignoredLabels, ignoreReassignForMergedPRs, ignoreReassignForMergeFrom } =
    options;
  const includesIgnoredLabels = currentLabels.some((currentLabel) => {
    return (ignoredLabels || []).includes(currentLabel);
  });
  if (includesIgnoredLabels) {
    return false;
  }
  if (ignoreReassignForMergedPRs && commitData) {
    const isMergePRCommit = checkIsMergePRCommit(commitData);
    debug(`isMergePRCommit: ${isMergePRCommit}`);
    if (isMergePRCommit) {
      return false;
    }
  }
  if (ignoreReassignForMergeFrom && commitData) {
    const isMergeFromIgnoredBranch = checkIsMergeFromBranch(
      commitData,
      ignoreReassignForMergeFrom,
    );
    debug(`isMergeFromIgnoredBranch: ${isMergeFromIgnoredBranch}`);
    if (isMergeFromIgnoredBranch) {
      return false;
    }
  }

  return true;
}

function getReviewersBasedOnRule({
  assign,
  reviewers,
  createdBy,
  requestedReviewerLogins,
  absentReviewersLogins,
}: Pick<Rule, 'assign' | 'reviewers'> & {
  createdBy: string;
  requestedReviewerLogins: string[];
  absentReviewersLogins: string[];
}): Set<string> {
  const result = new Set<string>();
  const availableReviewers = reviewers.filter((reviewer) => {
    if (reviewer === createdBy) {
      return false;
    }
    return !absentReviewersLogins.includes(reviewer);
  });
  if (!assign) {
    return new Set(availableReviewers);
  }
  const preselectAlreadySelectedReviewers = availableReviewers.reduce<string[]>(
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

  const maxAmountToAddReviewers =
    availableReviewers.length >= assign ? assign : availableReviewers.length;

  while (selectedList.length < maxAmountToAddReviewers) {
    const reviewersWithoutRandomlySelected = availableReviewers.filter((reviewer) => {
      return !selectedList.includes(reviewer);
    });
    const randomReviewer = getRandomItemFromArray(reviewersWithoutRandomlySelected);
    if (randomReviewer) {
      selectedList.push(randomReviewer);
    }
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
  absentReviewersLogins,
}: {
  byFileGroups: DefaultRules['byFileGroups'];
  fileChangesGroups: string[];
  requestedReviewerLogins: string[];
  createdBy: string;
  absentReviewersLogins: string[];
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
        absentReviewersLogins,
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
  absentReviewersLogins,
}: {
  createdBy: string;
  rulesByCreator: Config['rulesByCreator'];
  defaultRules?: Config['defaultRules'];
  fileChangesGroups: string[];
  requestedReviewerLogins: string[];
  absentReviewersLogins: string[];
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
        absentReviewersLogins,
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
      absentReviewersLogins,
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
