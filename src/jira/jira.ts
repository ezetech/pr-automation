import fetch from 'node-fetch';
import { JiraTransitions } from '../config/typings';

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

export function getTransitionId(
  transitions: JiraTransitions[],
  transitionName: string,
): string | null {
  const transition = transitions.find(
    (t) => t.name.toLowerCase() === transitionName.toLowerCase(),
  );

  if (!transition) {
    return null;
  }

  return transition.id;
}

export function jiraClient(jiraAccount: string, jiraToken: string) {
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
    const res = body
      ? await fetch(url, {
          method,
          body: JSON.stringify(body),
          ...options,
        })
      : await fetch(url, { method, ...options });

    if (res.status === 200) {
      const json = await res.json();
      return json as T;
    }
  };
}
