import { Reviews } from '../github';

type ReviewStatus = 'APPROVED' | 'CHANGES_REQUESTED' | 'PENDING';

/*
function that returns current state of approvals of PR,
The same way we see it in GitHub Pull Request page.

for example,
  PR could have multiple approves,
  but there was +1 commit added that was not approved.
  Therefore, PR is not approved.

latestRequestChanges is needed to identify a user who was re-requested
but had request changes before.
Should be null if that user approved PR lately after changes requested

for example,
  - reviewer 1 — approved
  - reviewer 2 — requested changes
  - +1 commit added
  - reviewer 1 — pending (we need to state that he requested changes before)
  - reviewer 2 — pending

we need this for a case when everyone approved a PR,
but a person who had requested changes, didn't approve it.
*/

export function identifyCurrentState({
  reviews,
  latestCommitDate,
}: {
  reviews: Reviews[];
  latestCommitDate: Date;
}): {
  user: string;
  reviewStatus: ReviewStatus;
  date: Date;
  latestRequestChanges: {
    date: Date;
  } | null;
}[] {
  return [];
}
