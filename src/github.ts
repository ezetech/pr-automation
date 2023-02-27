import * as yaml from 'yaml';
import { context, getOctokit } from '@actions/github';
import { getInput } from '@actions/core';
import { WebhookPayload } from '@actions/github/lib/interfaces';
import { validateConfig } from './config';
import { Config, Reviewer, ReviewerByState } from './config/typings';
import { debug, error, warning, info } from './logger';

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

  get number(): number {
    return this._pr.number;
  }
  get labelNames(): string[] {
    return (this._pr.labels as { name: string }[]).map((label) => label.name);
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

export type Reviews = {
  author: string;
  state: string;
  submittedAt: Date;
};

export async function getReviews(pr: PullRequest): Promise<Reviews[]> {
  const octokit = getMyOctokit();
  const reviews = await octokit.paginate(
    'GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews',
    {
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: pr.number,
    },
  );
  return reviews.reduce<Reviews[]>((result, review) => {
    // if (review.state !== 'APPROVED') {
    //   return result;
    // }
    if (!review.user) {
      warning(`No review.user provided for review ${review.id}`);
      return result;
    }
    if (!review.submitted_at) {
      warning(`No review.submitted_at provided for review ${review.id}`);
      return result;
    }
    result.push({
      state: review.state,
      author: review.user.login,
      submittedAt: new Date(review.submitted_at),
    });
    return result;
  }, []);
}

export async function getReviewsByGraphQL(pr: PullRequest): Promise<Reviewer[]> {
  const octokit = getMyOctokit();
  try {
    let hasNextPage = true;
    let reviewsParam = 'last: 100';
    let response: Reviewer[] = [];

    do {
      const queryResult = await octokit.graphql<any>(`
      {
        repository(owner: "${context.repo.owner}", name: "${context.repo.repo}") {
          pullRequest(number: ${pr.number}) {
            reviews(${reviewsParam}) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                author {
                  login
                }
                state
                body
                createdAt
                updatedAt
              }  
            }
          }
        }
      }
    `);
      const reviewsResponse = queryResult.repository.pullRequest.reviews;

      info('--------------- reviewsResponse ------------------');
      info(JSON.stringify(reviewsResponse, null, 2));

      response = [...reviewsResponse.nodes, ...response];
      hasNextPage = reviewsResponse.pageInfo.hasNextPage;
      reviewsParam = `last: 100, after: ${reviewsResponse.pageInfo.endCursor}`;
    } while (hasNextPage);

    return response;
  } catch (err) {
    warning(err as Error);
    throw err;
  }
}
