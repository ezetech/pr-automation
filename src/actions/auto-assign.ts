import { getInput } from '@actions/core';
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

export async function run(): Promise<void> {
  try {
    info('Starting pr auto assign.');

    const inputs = {
      checkReviewerOnSage:
        getInput('check-reviewer-on-sage', { required: false }) === 'true',
      sageUrl: getInput('sage-url', { required: false }),
      sageToken: getInput('sage-token', { required: false }),
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
    const pr = github.getPullRequest();
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
    const requestedReviewerLogins = await github.fetchPullRequestReviewers({ pr });
    const fileChangesGroups = identifyFileChangeGroups({
      fileChangesGroups: config.fileChangesGroups,
      changedFiles,
    });
    info(`Identified changed file groups: ${fileChangesGroups.join(', ')}`);

    info(
      `Identifying reviewers based on the changed files and PR creator. requestedReviewerLogins: ${JSON.stringify(
        requestedReviewerLogins,
      )}`,
    );

    const absentEmployeesToday: string[] = inputs.checkReviewerOnSage
      ? await getEmployeesWhoAreOutToday({
          sageBaseUrl: inputs.sageUrl,
          sageToken: inputs.sageToken,
        })
      : [];

    const sageUsers = config.sageUsers || {};
    const absentReviewersLogins = requestedReviewerLogins.filter((reviewer) => {
      const sageUser = sageUsers[reviewer];
      return sageUser && absentEmployeesToday.includes(sageUser[0].email);
    });

    const reviewers = identifyReviewers({
      createdBy: author,
      fileChangesGroups,
      rulesByCreator: config.rulesByCreator,
      defaultRules: config.defaultRules,
      requestedReviewerLogins: requestedReviewerLogins,
      absentReviewersLogins: absentReviewersLogins,
    });
    info(`Author: ${author}. Identified reviewers: ${reviewers.join(', ')}`);

    if (reviewers.length === 0) {
      info(`No reviewers were matched for author ${author}. Terminating the process`);
      return;
    }
    await github.assignReviewers(pr, reviewers);

    info(`Requesting review to ${reviewers.join(', ')}`);

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
        reviewersToAssign: reviewers,
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
