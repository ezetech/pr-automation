import { info, error, warning } from '../logger';
import * as github from '../github';

export async function run(): Promise<void> {
  try {
    info('Starting pr auto merge.');

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
    // eslint-disable-next-line
    console.log(config);
    // @todo
    // const pr = github.getPullRequest();

    /*
    run after:
     - every approve
     - after label add/remove
     - after CI checks status change

    LOGIC:
    - identify by config and changed files correct groups that have to approve with what amount of approvals.
    - identify if current approved users satisfy to the rules for required approvals
    - if any change requested, return
    - if any change was requested and this person didn't approve after, return
    - if tests are failed, return
    - if PR to master, change issue status in Jira
      - change status only if Jira issue, at this moment, belong to correct status — Code Review
      - return
    - if any PR restrictions to merge, return. Like do-not-merge label or tests are failed
    - merge PR
    - change issue status in Jira
     */

    info('Done');
  } catch (err) {
    error(err as Error);
  }
  return;
}

run();

/*
TASK B0 (not blocking anything)
  GitHub action to run after:
     - every approve
     - after label add/remove
     - after CI checks status change

TASK C0-C1 Jira move to next status/Github merge
  - if PR to master, change issue status in Jira
  - change status only if Jira issue, at this moment,
      belong to correct status — Code Review
  - GitHub merge PR
    - change issue status in Jira

TASK D0 identify approver groups
  - identifyApprovers function

TASK A0 (blocking next tasks) GitHub PR data retrieval
  - getLatestCommitDate function
  - getReviews function

TASK A1 (blocked by 0A) identify current state
  - identifyCurrentState function

TASK A2 (blocked by A0) if PR is fully approved
  - is-pr-fully-approved file
 */
