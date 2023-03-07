import { withDebugLog } from '../utils';

import {
  getIssueIdFromBranchName as getIssueIdFromBranchNameFunc,
  jiraClient as jiraClientFunc,
  getTransitionId as getTransitionIdFunc,
} from './jira';

import { changeJiraIssueStatus as changeJiraIssueStatusFunc } from './change-jira-issue-status';

export const changeJiraIssueStatus = withDebugLog(changeJiraIssueStatusFunc);
export const getIssueIdFromBranchName = withDebugLog(getIssueIdFromBranchNameFunc);
export const jiraClient = withDebugLog(jiraClientFunc);
export const getTransitionId = withDebugLog(getTransitionIdFunc);
