import * as yaml from 'yaml';
import { context, getOctokit } from '@actions/github';
import { getInput } from '@actions/core';
import { WebhookPayload } from '@actions/github/lib/interfaces';
import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types';
import { Endpoints } from '@octokit/types';
import { validateConfig } from './config';
import {
  Config,
  Inputs,
  Strategy,
  Reviews,
  Checks,
  IPullRequest,
  IPullRequestGraphQL,
} from './config/typings';
import { debug, error, warning } from './logger';

function getMyOctokit() {
  const myToken = getInput('token');

  const octokit = getOctokit(myToken);
  return octokit;
}

const transformPullRequestFromContext = (
  data: Required<WebhookPayload>['pull_request'],
): IPullRequest => ({
  author: data.user.login,
  isDraft: data.draft,
  isOpen: data.state === 'open',
  number: data.number,
  labelNames: (data.labels as { name: string }[]).map((label) => label.name),
  branchName: data.head.ref,
  baseBranchName: data.base.ref,
});

const transformPullRequestFromGraphQL = ({
  repository: { pullRequest },
}: IPullRequestGraphQL): IPullRequest => ({
  author: pullRequest.author.login,
  isDraft: pullRequest.isDraft,
  isOpen: pullRequest.state === 'OPEN',
  number: pullRequest.number,
  labelNames: (pullRequest.labels.nodes as { name: string }[]).map((label) => label.name),
  branchName: pullRequest.headRef.name,
  baseBranchName: pullRequest.baseRef.name,
});

export async function getPullRequest({
  name,
  owner,
  pullNumber,
}: {
  name?: string;
  owner?: string;
  pullNumber?: number;
}): Promise<IPullRequest> {
  const pr = context.payload.pull_request;
  // @todo validate PR data
  if (!pr) {
    if (!pullNumber && !name && !owner) {
      throw new Error('No pull_request data in context.payload');
    }
    const octokit = getMyOctokit();
    try {
      const pullRequest = await octokit.graphql<IPullRequestGraphQL>(
        `
          {
            repository(owner: "${owner}", name: "${name}") {
              pullRequest(number: ${pullNumber}) {
                number
                author {
                  login
                }
                isDraft
                state
                labels (first: 100) {
                  nodes {
                    name
                  }
                }
                headRef {
                  name
                }
                baseRef {
                  name
                }
              }
            }
          }
        `,
      );
      if (!pullRequest) {
        throw new Error('No pull_request data in context.payload');
      }
      return transformPullRequestFromGraphQL(pullRequest);
    } catch (err) {
      warning(err as Error);
      throw err;
    }
  }
  debug(`PR event payload: ${JSON.stringify(pr)}`);
  return transformPullRequestFromContext(pr);
}

async function fetchListRequestedReviewers({
  pr,
}: {
  pr: IPullRequest;
}): Promise<string[]> {
  const octokit = getMyOctokit();
  const response = await octokit.rest.pulls.listRequestedReviewers({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: pr.number,
  });
  debug(`fetchListRequestedReviewers response ${JSON.stringify(response)}`);
  const result = response.data.users.map((item: { login: string }) => item.login);

  debug(`fetchListRequestedReviewers result ${JSON.stringify(result)}`);

  return result;
}

function getUsersFromListReviewsResponse(response: any): Record<string, string>[] {
  try {
    const users: Record<string, unknown>[] = response?.data?.users;
    if (!users) {
      const arr = response?.data;
      return arr.map((item: { user: Record<string, string> }) => item.user);
    }
    return [];
  } catch (e) {
    return [];
  }
}

async function fetchListReviews({ pr }: { pr: IPullRequest }): Promise<string[]> {
  const octokit = getMyOctokit();
  const response = await octokit.rest.pulls.listReviews({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: pr.number,
  });
  debug(`fetchListReviews response ${JSON.stringify(response)}`);
  const users = getUsersFromListReviewsResponse(response);
  const obj = users.reduce<Record<string, string>>((result, item) => {
    const login = item?.login as string;
    if (login) {
      result[login] = login;
    }
    return result;
  }, {});
  const result = Object.values(obj);

  debug(`fetchListReviews result ${JSON.stringify(result)}`);

  return result;
}

export async function fetchPullRequestReviewers({ pr }: { pr: IPullRequest }): Promise<{
  allRequestedReviewers: string[];
  currentPendingReviewers: string[];
}> {
  const [arr1, arr2] = await Promise.all([
    fetchListRequestedReviewers({ pr }),
    fetchListReviews({ pr }),
  ]);
  const concatenatedArray = arr1.concat(arr2);
  const uniqueStrings = [...new Set(concatenatedArray)];
  return {
    allRequestedReviewers: uniqueStrings,
    currentPendingReviewers: arr1,
  };
}

export function validatePullRequest(pr: IPullRequest): string | null {
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

function getInputs(): Inputs {
  const [owner, repo] = getInput('repository').split('/');

  return {
    comment: getInput('comment'),
    owner,
    repo,
    pullRequestNumber: Number(getInput('pullRequestNumber', { required: false })),
    sha: getInput('sha', { required: true }),
    strategy: getInput('strategy', { required: true }) as Strategy,
    doNotMergeLabels: getInput('do-not-merge-labels'),
    token: getInput('token', { required: true }),
    config: getInput('config', { required: true }),
    doNotMergeOnBaseBranch: getInput('do-not-merge-on-base-branch'),
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

export async function fetchChangedFiles({ pr }: { pr: IPullRequest }): Promise<string[]> {
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
  pr: IPullRequest,
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

export type CreateIssueCommentResponseData =
  Endpoints['POST /repos/:owner/:repo/issues/:issue_number/comments']['response']['data'];

export async function updateComment(
  existingCommentId: number,
  body: string,
): Promise<CreateIssueCommentResponseData> {
  const octokit = getMyOctokit();
  const updatedComment = await octokit.rest.issues.updateComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    comment_id: existingCommentId,
    body,
  });

  return updatedComment.data;
}

export async function getExistingCommentId(
  issueNumber: number,
  messageId: string,
): Promise<number | undefined> {
  const octokit = getMyOctokit();
  const parameters = {
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber,
    per_page: 100,
  };

  let found;

  for await (const comments of octokit.paginate.iterator(
    octokit.rest.issues.listComments,
    parameters,
  )) {
    // @ts-ignore
    found = comments.data.find(({ body }) => {
      return (body?.search(messageId) ?? -1) > -1;
    });

    if (found) {
      break;
    }
  }

  return found?.id;
}

export async function getLatestCommitDate(pr: IPullRequest): Promise<{
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

export async function createComment({
  comment,
  pr,
}: {
  pr: IPullRequest;
  comment: string;
}): Promise<RestEndpointMethodTypes['issues']['createComment']['response']['data']> {
  const octokit = getMyOctokit();
  let owner = context.repo.owner;
  let repo = context.repo.repo;
  let prNumber = pr.number;
  if (!prNumber || !repo || !owner) {
    const inputs = getInputs();
    owner = inputs.owner;
    repo = inputs.repo;
    prNumber = inputs.pullRequestNumber;
  }

  const response = await octokit.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
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
  pr: IPullRequest,
): Promise<RestEndpointMethodTypes['pulls']['merge']['response']['data'] | null> {
  const octokit = getMyOctokit();
  const inputs = getInputs();

  const doNotMergeBaseBranch = inputs.doNotMergeOnBaseBranch.split(',');

  if (doNotMergeBaseBranch.includes(pr.baseBranchName)) {
    return null;
  }

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

export function getLatestSha(): string {
  return context.payload.after;
}

export type CommitData = {
  message: string;
  parents: unknown[];
};

export async function getCommitData(sha: string): Promise<CommitData> {
  const octokit = getMyOctokit();
  debug(`Fetching commit data of sha ${sha}`);

  const response = await octokit.request(
    'GET /repos/{owner}/{repo}/git/commits/{commit_sha}',
    {
      owner: context.repo.owner,
      repo: context.repo.repo,
      commit_sha: sha,
    },
  );
  if (response.status !== 200) {
    error(`Response.status: ${response.status}`);
    throw new Error(JSON.stringify(response.data));
  }
  const message = response.data.message;
  const parents = response.data.parents;
  debug(`getCommitData. message: ${message}. parents: ${parents}`);
  return {
    message,
    parents,
  };
}
