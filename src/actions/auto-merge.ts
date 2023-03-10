import * as core from '@actions/core';
import * as github from '../github';
import { info, error, warning } from '../logger';
import { isPrFullyApproved, identifyReviewers } from '../approves';
import { identifyFileChangeGroups } from '../reviewer';
import { changeJiraIssueStatus } from '../jira';

export async function run(): Promise<void> {
  try {
    info('Staring PR auto merging.');

    const inputs = github.getInputs();

    let config;

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

    const prValidationError = github.validatePullRequest(pr);

    if (prValidationError) {
      warning(prValidationError);
      return;
    }

    const { author, branchName } = pr;

    const changedFiles = await github.fetchChangedFiles({ pr });
    const fileChangesGroups = identifyFileChangeGroups({
      fileChangesGroups: config.fileChangesGroups,
      changedFiles,
    });

    const rules = identifyReviewers({
      createdBy: author,
      fileChangesGroups,
      rulesByCreator: config.rulesByCreator,
      defaultRules: config.defaultRules,
      requestedReviewerLogins: pr.requestedReviewerLogins,
    });

    const checks = await github.getCIChecks();

    const reviews = await github.getReviews();

    const isPrFullyApprovedResponse = isPrFullyApproved({
      rules,
      requiredChecks: config?.options?.requiredChecks,
      reviews,
      checks,
    });

    if (isPrFullyApprovedResponse !== true) {
      info(isPrFullyApprovedResponse || 'PR is not fully approved');
      return;
    }

    if (inputs.comment) {
      await github.createComment(inputs.comment);
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

    core.setOutput('merged', true);
  } catch (err) {
    error(err as Error);
  }
  return;
}

run();
