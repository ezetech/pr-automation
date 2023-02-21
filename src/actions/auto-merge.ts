import { inspect } from 'util';
import * as core from '@actions/core';
import * as github from '@actions/github';
import { Inputs, Strategy, ReviewerBySate, Reviewer } from '../config/typings';
import { info, debug, warning, error } from '../logger';
import {
  getReviewsByGraphQL,
  removeDuplicateReviewer,
  filterReviewersByState,
} from '../github';

export async function run(): Promise<void> {
  try {
    info('Staring PR auto merging.');

    let doNotMerge = false;

    const [owner, repo] = core.getInput('repository').split('/');

    const configInput: Inputs = {
      comment: core.getInput('comment'),
      owner,
      repo,
      pullRequestNumber: Number(core.getInput('pullRequestNumber', { required: true })),
      sha: core.getInput('sha', { required: true }),
      strategy: core.getInput('strategy', { required: true }) as Strategy,
      token: core.getInput('token', { required: true }),
    };

    debug(`Inputs: ${inspect(configInput)}`);

    const client = github.getOctokit(configInput.token);

    const { data: pullRequest } = await client.pulls.get({
      owner,
      repo,
      pull_number: configInput.pullRequestNumber,
    });
    info('Checking requested reviewers.');

    if (pullRequest?.requested_reviewers) {
      const requestedChanges = pullRequest?.requested_reviewers?.map(
        (reviewer) => reviewer.login,
      );

      if (requestedChanges.length > 0) {
        warning(`Waiting [${requestedChanges.join(', ')}] to approve.`);
        doNotMerge = true;
      }
    }

    info('Checking required changes status.');

    // TODO Fix Typescript Error
    // @ts-ignore
    const reviewers: Reviewer[] = await getReviewsByGraphQL(pullRequest);

    const reviewersByState: ReviewerBySate = filterReviewersByState(
      removeDuplicateReviewer(reviewers),
      reviewers,
    );

    if (reviewersByState.requiredChanges.length) {
      warning(`${reviewersByState.requiredChanges.join(', ')} required changes.`);
      doNotMerge = true;
    }

    info(`${reviewersByState.approve.join(', ')} approved changes.`);

    info('Checking CI status.');

    const { data: checks } = await client.checks.listForRef({
      owner: configInput.owner,
      repo: configInput.repo,
      ref: configInput.sha,
    });

    const totalStatus = checks.total_count;
    const totalSuccessStatuses = checks.check_runs.filter(
      (check) => check.conclusion === 'success' || check.conclusion === 'skipped',
    ).length;

    if (totalStatus - 1 !== totalSuccessStatuses) {
      warning(
        `Not all status success, ${totalSuccessStatuses} out of ${
          totalStatus - 1
        } (ignored this check) success`,
      );
      doNotMerge = true;
    }

    if (doNotMerge) {
      return;
    }

    if (configInput.comment) {
      const { data: resp } = await client.issues.createComment({
        owner: configInput.owner,
        repo: configInput.repo,
        issue_number: configInput.pullRequestNumber,
        body: configInput.comment,
      });

      debug(`Post comment ${inspect(configInput.comment)}`);
      core.setOutput('commentID', resp.id);
    }

    info('Merging...');

    await client.pulls.merge({
      owner,
      repo,
      pull_number: configInput.pullRequestNumber,
      merge_method: configInput.strategy,
    });

    core.setOutput('merged', true);
  } catch (err) {
    error(err as Error);
  }
  return;
}

run();
