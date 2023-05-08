import { Checks } from '../config/typings';

export function areCIChecksPassed({
  checks,
  requiredChecks,
}: {
  checks: Checks;
  requiredChecks: string[] | undefined;
}): boolean | string {
  if (requiredChecks === undefined) {
    return true;
  }

  for (const name of requiredChecks) {
    const check = checks.check_runs.find((checkRun) => {
      return checkRun.name === name;
    });
    const error = `Waiting for "${name}" CI check to pass.`;
    if (!check) {
      return error;
    }

    if (check.status !== 'completed' || check.conclusion !== 'success') {
      return error;
    }
  }

  return true;
}
