import { PullsGetResponseData } from '@octokit/types';
import { Checks } from '../config/typings';

import { warning, info } from '../logger';

export function checkCI(checks: Checks): boolean {
  info(JSON.stringify(checks, null, 2));

  const totalInProgress = checks.check_runs.filter((check) => {
    if (check.status === 'in_progress' && check.conclusion === null) {
      return true;
    }
  }).length;

  if (totalInProgress > 1) {
    warning(`Waiting for ${totalInProgress - 1} CI checks to finish.`);

    return false;
  }

  const totalStatus = checks.total_count;
  const totalSuccess = checks.check_runs.filter(
    (check) => check.conclusion === 'success' || check.conclusion === 'skipped',
  ).length;

  if (totalStatus - 1 !== totalSuccess) {
    warning(
      `Not all status success, ${totalSuccess} out of ${
        totalStatus - 1
      } (ignored this check) success`,
    );
    return false;
  }

  return true;
}

export function checkDoNotMergeLabels(
  labels: PullsGetResponseData['labels'],
  doNotMergeLabels: string,
): boolean {
  const doNotMergeLabelsList = doNotMergeLabels.split(',');
  const check = labels.find((label) => {
    return doNotMergeLabelsList.includes(label.name);
  });

  if (check) {
    warning(`Pull request has a ${doNotMergeLabels} label.`);
    return false;
  }

  return true;
}
