import { getInput, setOutput } from '@actions/core';
import { version } from '../../package.json';
import * as github from '../github';
import { info, error, warning, debug } from '../logger';
import { isPrFullyApproved, identifyReviewers } from '../approves';
import { identifyFileChangeGroups } from '../reviewer';
import { changeJiraIssueStatus } from '../jira';

export async function run(): Promise<void> {
  try {
    info(`Staring PR auto merge version ${version}.`);

    const [owner, repo] = getInput('repository').split('/');
    const inputs = {
      owner,
      repo,
      pullRequestNumber: Number(getInput('pullRequestNumber', { required: true })),
      comment: getInput('comment'),
      shouldChangeJiraIssueStatus:
        getInput('should-change-jira-issue-status', {
          required: true,
        }) === 'true',
      jiraToken: getInput('jira-token', { required: true }),
      jiraAccount: getInput('jira-account', { required: true }),
      jiraEndpoint: getInput('jira-endpoint', { required: true }),
      jiraMoveIssueFrom: getInput('jira-move-issue-from', { required: true }),
      jiraMoveTransitionName: getInput('jira-move-transition-name', { required: true }),
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

    const prValidationError = github.validatePullRequest(pr);

    if (prValidationError) {
      warning(prValidationError);
      return;
    }

    const { author, branchName } = pr;

    debug('Fetching changed files in the pull request');
    const changedFiles = await github.fetchChangedFiles({ pr });

    debug('Fetching pull request reviewers');
    const { allRequestedReviewers, currentPendingReviewers } =
      await github.fetchPullRequestReviewers({ pr });

    const fileChangesGroups = identifyFileChangeGroups({
      fileChangesGroups: config.fileChangesGroups,
      changedFiles,
    });

    const rules = identifyReviewers({
      createdBy: author,
      fileChangesGroups,
      rulesByCreator: config.rulesByCreator,
      defaultRules: config.defaultRules,
      requestedReviewerLogins: allRequestedReviewers,
    });

    const checks = await github.getCIChecks();

    const reviews = await github.getReviews();

    const isPrFullyApprovedResponse = isPrFullyApproved({
      rules,
      requiredChecks: config?.options?.requiredChecks,
      reviews,
      checks,
      requestedReviewerLogins: allRequestedReviewers,
      currentPendingReviewers,
    });

    if (isPrFullyApprovedResponse !== true) {
      info(isPrFullyApprovedResponse || 'PR is not fully approved');
      return;
    }

    if (inputs.comment) {
      await github.createComment({ comment: inputs.comment, pr });
    }

    await github.mergePullRequest(pr);

    if (inputs.shouldChangeJiraIssueStatus) {
      const jiraResponse = await changeJiraIssueStatus({ branchName, inputs });

      if (jiraResponse.status) {
        info(jiraResponse.message);
      } else {
        warning(jiraResponse.message);
      }
    }

    setOutput('merged', true);
  } catch (err) {
    error(err as Error);
  }
  return;
}

run();
