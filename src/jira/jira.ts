import fetch from 'node-fetch';
import { JiraTransitions } from '../config/typings';
import { debug } from '../logger';

export function getIssueIdFromBranchName(branch: string): string | null {
  const split = branch.split('-');

  if (split.length < 2) {
    return null;
  }

  if (!split[0].match(/^[a-zA-Z]+$/)) {
    return null;
  }

  if (!split[1].match(/^[0-9]+$/)) {
    return null;
  }

  return `${split[0]}-${split[1]}`;
}

export function getTransitionId({
  transitions,
  transitionName,
}: {
  transitions: JiraTransitions[];
  transitionName: string;
}): string | null {
  const transition = transitions.find(
    (t) => t.name.toLowerCase() === transitionName.toLowerCase(),
  );

  if (!transition) {
    return null;
  }

  return transition.id;
}

export function jiraClient({
  jiraAccount,
  jiraToken,
}: {
  jiraAccount: string;
  jiraToken: string;
}) {
  const token = Buffer.from(`${jiraAccount}:${jiraToken}`).toString('base64');

  const options = {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Basic ${token}`,
    },
  };

  return async <T = any>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any | undefined,
  ) => {
    debug(
      `[jiraClientRequest]. Request: ${JSON.stringify({
        url,
        method,
        body,
      })}`,
    );
    const res = body
      ? await fetch(url, {
          method,
          body: JSON.stringify(body),
          ...options,
        })
      : await fetch(url, { method, ...options });
    debug(`[jiraClientRequest]. Response status: ${res.status}`);
    if (res.ok) {
      const json = await res.json();
      return json as T;
    }
  };
}
