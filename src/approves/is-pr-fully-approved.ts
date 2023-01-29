/*
Function that returns true if PR is fully approved.
PR is considered NOT fully approved when:
  - some changes requested at current state
  - some changes requested that was not approved lately
  - required PR checks are failed.

If PR is NOT fully approved,
  return a reason why:
    - groups that still waiting for an approval (how many left)
    - users that have requested changes (now or before and it was not approved lately)
    - failed CI checks

Arguments are:
  - currentState (result of identifyCurrentState function)
  - approver groups (result of identifyApprovers function)
  - CI checks statuses @TODO
*/
