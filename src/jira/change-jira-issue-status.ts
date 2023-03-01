import { Inputs, JiraIssue, JiraTransitions } from '../config/typings';
import { info } from '../logger';
import { getIssueIdFromBranchName, jiraClient, getTransitionId } from './jira';

type Response = {
  status: boolean;
  message: string;
};

export default async function changeJiraIssueStatus(
  branchName: string,
  configInput: Inputs,
): Promise<Response> {
  const issueId = getIssueIdFromBranchName(branchName);

  if (!issueId) {
    return {
      status: false,
      message: 'Issue id is not found in branch name.',
    };
  }

  const request = jiraClient(configInput.jiraAccount, configInput.jiraToken);

  const issueDetail: JiraIssue | undefined = await request(
    `${configInput.jiraEndpoint}/rest/api/3/issue/${issueId}`,
  );

  info(`Issue detail:`);
  info(JSON.stringify(issueDetail, null, 2));

  if (issueDetail === undefined) {
    return {
      status: false,
      message: 'Issue detail is not found.',
    };
  }

  if (
    issueDetail.fields.status.name.toLowerCase() !==
    configInput.jiraMoveIssueFrom.toLowerCase()
  ) {
    return {
      status: false,
      message: `Issue status is not ${configInput.jiraMoveIssueFrom}.`,
    };
  }

  const availableTransitions:
    | { expand: string; transitions: JiraTransitions[] }
    | undefined = await request(
    `${configInput.jiraEndpoint}/rest/api/3/issue/${issueId}/transitions`,
  );

  info(`Available transitions:`);
  info(JSON.stringify(availableTransitions, null, 2));

  if (availableTransitions === undefined) {
    return {
      status: false,
      message: 'Available transitions are not found.',
    };
  }

  const transitionId = getTransitionId(
    availableTransitions.transitions,
    configInput.jiraMoveIssueTo,
  );

  info(`Transition id: ${transitionId}`);

  if (!transitionId) {
    return {
      status: false,
      message: 'Transition id is not found.',
    };
  }

  const updateTransition = await request(
    `${configInput.jiraEndpoint}/rest/api/3/issue/${issueId}/transitions`,
    'POST',
    { transition: { id: transitionId } },
  );

  return {
    status: true,
    message: 'Jira issue status is updated',
  };
}
