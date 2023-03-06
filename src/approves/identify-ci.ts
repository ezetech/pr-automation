import { Checks } from '../config/typings';

export function areCIChecksPassed(checks: Checks, requiredChecks: string[] | undefined) {
  if (requiredChecks === undefined) {
    return true;
  }

  for (const name of requiredChecks) {
    const check = checks.check_runs.find((checkRun) => {
      return checkRun.name === name;
    });

    if (check && (check.status !== 'completed' || check.conclusion !== 'success')) {
      return `Waiting for "${name}" CI check to pass.`;
    }
  }

  return true;
}
