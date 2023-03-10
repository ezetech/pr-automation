import { Inputs, JiraIssue, JiraTransitions } from '../config/typings';
import { getIssueIdFromBranchName, jiraClient, getTransitionId } from './';

type Response = {
  status: boolean;
  message: string;
};

export async function changeJiraIssueStatus({
  branchName,
  inputs,
}: {
  branchName: string;
  inputs: Inputs;
}): Promise<Response> {
  const issueId = getIssueIdFromBranchName(branchName);

  if (!issueId) {
    return {
      status: false,
      message: 'Issue id is not found in branch name.',
    };
  }

  const request = jiraClient({
    jiraAccount: inputs.jiraAccount,
    jiraToken: inputs.jiraToken,
  });

  const issueDetail: JiraIssue | undefined = await request(
    `${inputs.jiraEndpoint}/rest/api/3/issue/${issueId}`,
  );

  if (issueDetail === undefined) {
    return {
      status: false,
      message: 'Issue detail is not found.',
    };
  }

  if (
    issueDetail.fields.status.name.toLowerCase() !==
    inputs.jiraMoveIssueFrom.toLowerCase()
  ) {
    return {
      status: false,
      message: `Issue status is not ${inputs.jiraMoveIssueFrom}.`,
    };
  }

  const availableTransitions:
    | { expand: string; transitions: JiraTransitions[] }
    | undefined = await request(
    `${inputs.jiraEndpoint}/rest/api/3/issue/${issueId}/transitions`,
  );

  if (availableTransitions === undefined) {
    return {
      status: false,
      message: 'Available transitions are not found.',
    };
  }

  const transitionId = getTransitionId({
    transitions: availableTransitions.transitions,
    transitionName: inputs.jiraMoveIssueTo,
  });

  if (!transitionId) {
    return {
      status: false,
      message: 'Transition id is not found.',
    };
  }

  const updateTransition = await request(
    `${inputs.jiraEndpoint}/rest/api/3/issue/${issueId}/transitions`,
    'POST',
    { transition: { id: transitionId } },
  );

  if (updateTransition === undefined) {
    return {
      status: false,
      message: 'Jira issue status is not updated.',
    };
  }

  return {
    status: true,
    message: 'Jira issue status is updated',
  };
}
