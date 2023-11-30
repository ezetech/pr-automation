import { getInput } from '@actions/core';
import { version } from '../../package.json';
import { info, error, warning, debug } from '../logger';
import * as github from '../github';
import {
  getMessage,
  identifyFileChangeGroups,
  identifyReviewers,
  shouldRequestReview,
} from '../reviewer';

import { getEmployeesWhoAreOutToday } from '../sage';
import { CommitData } from '../github';
import { convertSageEmailsToUsernames } from '../utils';

export async function run(): Promise<void> {
  try {
    info(`Starting pr auto assign version ${version}`);

    const [owner, repo] = getInput('repository').split('/');
    const inputs = {
      owner,
      repo,
      checkReviewerOnSage:
        getInput('check-reviewer-on-sage', { required: false }) === 'true',
      sageUrl: getInput('sage-url', { required: false }),
      sageToken: getInput('sage-token', { required: false }),
      pullRequestNumber: Number(getInput('pullRequestNumber', { required: true })),
    };

    let config;

    debug('fetching config');
    try {
      config = await github.fetchConfig();
    } catch (err) {
      if ((err as Record<string, unknown>).status === 404) {
        warning(
          'No configuration file is found in the base branch; terminating the process',
        );
        info(JSON.stringify(err));
        return;
      }
      throw err;
    }
    const pr = await github.getPullRequest({
      name: inputs.repo,
      owner: inputs.owner,
      pullNumber: inputs.pullRequestNumber,
    });
    const { isDraft, author } = pr;

    const latestSha = github.getLatestSha();
    let commitData: undefined | CommitData;
    if (config.options?.ignoreReassignForMergedPRs && latestSha) {
      commitData = await github.getCommitData(latestSha);
    }

    if (
      !shouldRequestReview({
        isDraft,
        commitData,
        options: config.options,
        currentLabels: pr.labelNames,
      })
    ) {
      info(
        `Matched the ignoring rules ${JSON.stringify({
          isDraft,
          commitData,
          prLabels: pr.labelNames,
        })}; terminating the process.`,
      );
      return;
    }

    debug('Fetching changed files in the pull request');
    const changedFiles = await github.fetchChangedFiles({ pr });
    debug('Fetching pull request reviewers');
    const { allRequestedReviewers, currentPendingReviewers } =
      await github.fetchPullRequestReviewers({ pr });
    const fileChangesGroups = identifyFileChangeGroups({
      fileChangesGroups: config.fileChangesGroups,
      changedFiles,
    });
    info(`Identified changed file groups: ${fileChangesGroups.join(', ')}`);

    info(
      `Identifying reviewers based on the changed files and PR creator. currentPendingReviewers: ${JSON.stringify(
        currentPendingReviewers,
      )}. allRequestedReviewers: ${JSON.stringify(allRequestedReviewers)}`,
    );

    const absentEmployeesEmails: string[] = inputs.checkReviewerOnSage
      ? await getEmployeesWhoAreOutToday({
          sageBaseUrl: inputs.sageUrl,
          sageToken: inputs.sageToken,
        })
      : [];

    const absentReviewersLogins = convertSageEmailsToUsernames({
      configSageUsers: config.sageUsers,
      emailsList: absentEmployeesEmails,
    });

    const reviewersToAssign = identifyReviewers({
      createdBy: author,
      fileChangesGroups,
      rulesByCreator: config.rulesByCreator,
      defaultRules: config.defaultRules,
      requestedReviewerLogins: allRequestedReviewers,
      absentReviewersLogins,
    });
    info(`Author: ${author}. Identified reviewers: ${reviewersToAssign.join(', ')}`);

    if (reviewersToAssign.length === 0) {
      info(`No reviewers were matched for author ${author}. Terminating the process`);
      return;
    }
    await github.assignReviewers(pr, reviewersToAssign);

    info(`Requesting review to ${reviewersToAssign.join(', ')}`);

    const messageId = config.options?.withMessage?.messageId;
    debug(`messageId: ${messageId}`);
    if (messageId) {
      const existingCommentId = await github.getExistingCommentId(pr.number, messageId);
      info(`existingCommentId: ${existingCommentId}`);
      const message = getMessage({
        createdBy: author,
        fileChangesGroups,
        rulesByCreator: config.rulesByCreator,
        defaultRules: config.defaultRules,
        reviewersToAssign,
      });
      const body = `${messageId}\n\n${message}`;
      if (existingCommentId) {
        debug('Updating comment');
        await github.updateComment(existingCommentId, body);
      } else {
        debug('Creating comment');
        await github.createComment({ comment: body, pr });
      }
      info(`Commenting on PR, body: "${body}"`);
    }

    info('Done');
  } catch (err) {
    error(err as Error);
  }
  return;
}

run();
