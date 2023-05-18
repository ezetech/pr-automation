import fetch from 'node-fetch';
import { info, warning } from '../logger';
import { SageOutOfOfficeToday } from '../config/typings';

export async function getEmployeesWhoAreOutToday({
  sageBaseUrl,
  sageToken,
}: {
  sageBaseUrl: string;
  sageToken: string;
}): Promise<string[]> {
  try {
    const client = sageClient({
      sageBaseUrl,
      sageToken,
    });

    const date = new Date().toISOString().split('T')[0];
    const result: string[] = [];

    const sageResponse: SageOutOfOfficeToday | undefined = await client(
      `leave-management/out-of-office-today?date=${date}`,
      'GET',
    );

    if (sageResponse !== undefined && sageResponse.data.length > 0) {
      sageResponse.data.forEach((response) => {
        result.push(response.employee.email);
      });
    }

    info(`Employees reviewers who don't work today: ${result.join(', ')}`);

    return result;
  } catch (err) {
    warning('Sage Error: ' + JSON.stringify(err, null, 2));
    return [];
  }
}

function sageClient({
  sageBaseUrl,
  sageToken,
}: {
  sageBaseUrl: string;
  sageToken: string;
}): (
  url: string,
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: any | undefined,
) => Promise<any> {
  const options = {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Auth-Token': sageToken,
    },
  };

  return async <T = any>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any | undefined,
  ) => {
    const fullUrl = `${sageBaseUrl}/api/${url}`;

    info(`Sage request: ${fullUrl}`);
    const res = body
      ? await fetch(fullUrl, {
          method,
          body: JSON.stringify(body),
          ...options,
        })
      : await fetch(fullUrl, { method, ...options });

    if (res.status === 200) {
      const json = await res.json();
      return json as T;
    } else {
      return undefined;
    }
  };
}
