import * as yaml from 'yaml';
import { context, getOctokit } from '@actions/github';
import { getInput } from '@actions/core';
import { WebhookPayload } from '@actions/github/lib/interfaces';
import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types';
import { validateConfig } from './config';
import { Config, Inputs, Strategy, Reviews, Checks } from './config/typings';
import { debug, error, warning } from './logger';

function getMyOctokit() {
  const myToken = getInput('token');

  const octokit = getOctokit(myToken);
  return octokit;
}

class PullRequest {
  private _pr: Required<WebhookPayload>['pull_request'];
  constructor(data: Required<WebhookPayload>['pull_request']) {
    this._pr = data;
  }

  get author(): string {
    return this._pr.user.login;
  }

  get isDraft(): boolean {
    return Boolean(this._pr.draft);
  }

  get isOpen(): boolean {
    return this._pr.state === 'open';
  }

  get number(): number {
    return this._pr.number;
  }

  get labelNames(): string[] {
    return (this._pr.labels as { name: string }[]).map((label) => label.name);
  }

  get branchName(): string {
    return this._pr.head.ref;
  }

  get baseBranchName(): string {
    return this._pr.base.ref;
  }

  get requestedReviewerLogins(): string[] {
    return (this._pr.requested_reviewers as { login: string }[]).map(
      (label) => label.login,
    );
  }
}

export function getPullRequest(): PullRequest {
  const pr = context.payload.pull_request;
  // @todo validate PR data
  if (!pr) {
    throw new Error('No pull_request data in context.payload');
  }
  debug(`PR event payload: ${JSON.stringify(pr)}`);
  return new PullRequest(pr);
}

export function validatePullRequest(pr: PullRequest): string | null {
  if (pr.isDraft) {
    return `Pull request #${pr.number} is a draft`;
  }

  if (!pr.isOpen) {
    return `Pull request #${pr.number} is not open`;
  }

  if (doesContainIgnoreMergeLabels(pr.labelNames)) {
    return `Pull request #${pr.number} contains ignore merge labels`;
  }

  return null;
}

export function getInputs(): Inputs {
  const [owner, repo] = getInput('repository').split('/');

  return {
    comment: getInput('comment'),
    owner,
    repo,
    pullRequestNumber: Number(getInput('pullRequestNumber', { required: true })),
    sha: getInput('sha', { required: true }),
    strategy: getInput('strategy', { required: true }) as Strategy,
    doNotMergeLabels: getInput('do-not-merge-labels'),
    token: getInput('token', { required: true }),
    config: getInput('config', { required: true }),
  };
}

export async function fetchConfig(): Promise<Config> {
  const octokit = getMyOctokit();
  const path = getInput('config');

  const response = await octokit.rest.repos.getContent({
    owner: context.repo.owner,
    repo: context.repo.repo,
    path,
    ref: context.ref,
  });
  if (response.status !== 200) {
    error(`Response.status: ${response.status}`);
    throw new Error(JSON.stringify(response.data));
  }
  const data = response.data as {
    type: string;
    content: string;
    encoding: 'base64';
  };
  if (data.type !== 'file') {
    throw new Error('Failed to get config');
  }

  const content = Buffer.from(data.content, data.encoding).toString();
  const parsedConfig = yaml.parse(content);
  return validateConfig(parsedConfig);
}

export async function fetchChangedFiles({ pr }: { pr: PullRequest }): Promise<string[]> {
  const octokit = getMyOctokit();

  const changedFiles: string[] = [];

  const perPage = 100;
  let page = 0;
  let numberOfFilesInCurrentPage: number;

  do {
    page += 1;

    const { data: responseBody } = await octokit.rest.pulls.listFiles({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: pr.number,
      page,
      per_page: perPage,
    });

    numberOfFilesInCurrentPage = responseBody.length;
    changedFiles.push(...responseBody.map((file: any) => file.filename));
  } while (numberOfFilesInCurrentPage === perPage);

  return changedFiles;
}

export async function assignReviewers(
  pr: PullRequest,
  reviewers: string[],
): Promise<void> {
  const octokit = getMyOctokit();
  await octokit.rest.pulls.requestReviewers({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: pr.number,
    reviewers: reviewers,
  });
  return;
}

export async function getLatestCommitDate(pr: PullRequest): Promise<{
  latestCommitDate: Date;
  authoredDateString: string;
}> {
  const octokit = getMyOctokit();
  try {
    const queryResult = await octokit.graphql<any>(`
      {
        repository(owner: "${context.repo.owner}", name: "${context.repo.repo}") {
          pullRequest(number: ${pr.number}) {
            title
            number
            commits(last: 1) {
              edges {
                node {
                  commit {
                    authoredDate
                  }
                }
              }
            }
          }
        }
      }
    `);

    // @todo
    const authoredDateString =
      queryResult.repository.pullRequest.commits.edges[0].node.commit.authoredDate;
    const latestCommitDate = new Date(authoredDateString);
    return {
      latestCommitDate,
      authoredDateString,
    };
  } catch (err) {
    warning(err as Error);
    throw err;
  }
}

export async function getReviews(): Promise<Reviews> {
  const octokit = getMyOctokit();
  const inputs = getInputs();

  const response = await octokit.pulls.listReviews({
    owner: inputs.owner,
    repo: inputs.repo,
    pull_number: inputs.pullRequestNumber,
  });

  if (response.status !== 200) {
    throw new Error(`Failed to get reviews: ${response.status}`);
  }

  return response.data;
}

export async function getCIChecks(): Promise<Checks> {
  const octokit = getMyOctokit();
  const inputs = getInputs();

  const response = await octokit.checks.listForRef({
    owner: inputs.owner,
    repo: inputs.repo,
    ref: inputs.sha,
  });

  if (response.status !== 200) {
    throw new Error(`Failed to get CI checks: ${response.status}`);
  }

  return response.data;
}

export async function createComment(
  comment: string,
): Promise<RestEndpointMethodTypes['issues']['createComment']['response']['data']> {
  const octokit = getMyOctokit();
  const inputs = getInputs();

  const response = await octokit.issues.createComment({
    owner: inputs.owner,
    repo: inputs.repo,
    issue_number: inputs.pullRequestNumber,
    body: comment,
  });

  if (response.status !== 201) {
    throw new Error(`Failed to create comment: ${response.status}`);
  }

  return response.data;
}

export function doesContainIgnoreMergeLabels(labels: string[]): boolean {
  const inputs = getInputs();

  const doNotMergeLabelsList = inputs.doNotMergeLabels.split(',');

  const check = labels.find((label) => {
    return doNotMergeLabelsList.includes(label);
  });

  if (check) {
    return true;
  }

  return false;
}

export async function mergePullRequest(
  pr: PullRequest,
): Promise<RestEndpointMethodTypes['pulls']['merge']['response']['data'] | null> {
  const octokit = getMyOctokit();
  const inputs = getInputs();

  if (pr.baseBranchName !== 'master' && pr.baseBranchName !== 'main') {
    const response = await octokit.pulls.merge({
      owner: inputs.owner,
      repo: inputs.repo,
      pull_number: inputs.pullRequestNumber,
      merge_method: inputs.strategy,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to create comment: ${response.status}`);
    }

    return response.data;
  }

  return null;
}
