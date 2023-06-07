import { Config } from './config/typings';
import { debug } from './logger';

export function getRandomItemFromArray<T>(items: T[]): T | undefined {
  return items[Math.floor(Math.random() * items.length)];
}

export function withDebugLog<In, Out>(executeFunction: (params: In) => Out) {
  return function (param: In) {
    debug(`[${executeFunction.name}]. Params: ${JSON.stringify(param)}`);
    const result = executeFunction(param);
    debug(`[${executeFunction.name}]. Result: ${JSON.stringify(result)}`);
    return result;
  };
}

interface ConvertSageEmailsToUsernamesProps {
  configSageUsers: Config['sageUsers'];
  emailsList: string[];
}

export function convertSageEmailsToUsernames({
  configSageUsers,
  emailsList,
}: ConvertSageEmailsToUsernamesProps): string[] {
  if (!configSageUsers) {
    return [];
  }

  const loginsFromEmails = Object.keys(configSageUsers).reduce((logins, login) => {
    const email = configSageUsers[login][0].email;

    if (emailsList.includes(email)) {
      logins.push(login);
    }

    return logins;
  }, [] as string[]);

  return loginsFromEmails;
}
