import fetch from 'node-fetch';
import { info } from '../logger';
import { SageEmployee, SageLeaveManagement } from '../config/typings';

export async function filterReviewersWhoDontWorkToday({
  sageBaseUrl,
  sageToken,
  reviewers,
  sageUsers,
}: {
  sageBaseUrl: string;
  sageToken: string;
  reviewers: string[];
  sageUsers: {
    [key: string]: {
      email: string;
    }[];
  };
}): Promise<string[]> {
  const employeesWhoDontWorkToday = await getEmployeesWhoDontWorkToday({
    sageBaseUrl,
    sageToken,
  });

  reviewers = reviewers.filter((reviewer) => {
    if (sageUsers[reviewer]) {
      return !employeesWhoDontWorkToday.includes(sageUsers[reviewer][0].email);
    }

    return true;
  });

  return reviewers;
}

async function getEmployeesWhoDontWorkToday({
  sageBaseUrl,
  sageToken,
}: {
  sageBaseUrl: string;
  sageToken: string;
}): Promise<string[]> {
  const client = sageClient({
    sageBaseUrl,
    sageToken,
  });

  const leaveManagement = await getLeaveManagement({
    sageBaseUrl,
    sageToken,
  });

  let page: number | null = 1;
  let data: string[] = [];

  do {
    const sageResponse: SageEmployee | undefined = await client(
      `employees?page=${page}`,
      'GET',
    );

    if (sageResponse !== undefined) {
      page = sageResponse.meta.next_page;

      const employees = sageResponse.data.filter((employee) =>
        leaveManagement.includes(employee.id),
      );

      data = [...data, ...employees.map((employee) => employee.email)];
    } else {
      page = null;
    }
  } while (page !== null);

  return data;
}

async function getLeaveManagement({
  sageBaseUrl,
  sageToken,
}: {
  sageBaseUrl: string;
  sageToken: string;
}): Promise<number[]> {
  const client = sageClient({
    sageBaseUrl,
    sageToken,
  });

  const from = new Date().toISOString().split('T')[0];
  const to = new Date().toISOString().split('T')[0];

  let page: number | null = 1;
  let data: number[] = [];

  do {
    const sageResponse: SageLeaveManagement | undefined = await client(
      `leave-management/requests?from=${from}&to=${to}&page=${page}`,
      'GET',
    );

    if (sageResponse !== undefined) {
      page = sageResponse.meta.next_page;

      const approvedLeaveManagement = sageResponse.data.filter(
        (leaveManagement) => leaveManagement.status_code === 'approved',
      );

      data = [
        ...data,
        ...approvedLeaveManagement.map((leaveManagement) => leaveManagement.employee_id),
      ];
    } else {
      page = null;
    }
  } while (page !== null);

  return data;
}

function sageClient({
  sageBaseUrl,
  sageToken,
}: {
  sageBaseUrl: string;
  sageToken: string;
}) {
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
