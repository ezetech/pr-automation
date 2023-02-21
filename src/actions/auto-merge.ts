import { inspect } from 'util';
import * as core from '@actions/core';
import * as github from '@actions/github';
import { Inputs, Strategy, Reviewer } from '../config/typings';
import { info, debug, error } from '../logger';
import { getReviewsByGraphQL } from '../github';

export async function run(): Promise<void> {
  try {
    info('Staring PR auto merging.');

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

    info('Checking required changes status.');

    // TODO fix TypeScript error
    // @ts-ignore
    const reviewers: Reviewer[] = await getReviewsByGraphQL(pullRequest);

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
      throw new Error(
        `Not all status success, ${totalSuccessStatuses} out of ${
          totalStatus - 1
        } (ignored this check) success`,
      );
    }

    info(JSON.stringify(reviewers, null, 2));
  } catch (err) {
    error(err as Error);
  }
  return;
}

run();
