# PR automation

This is github action that auto assigns reviewers for PR, auto merges it based on your rules and many more 

* [Auto Assign](#assign)
* [Auto Merge](#merge)
* [Change Jira Issue Status](#jira)

<a name='assign'></a>
# Auto assign

## Usage for auto assigning reviewers

Create a workflow file in `.github/workflows` (e.g. `.github/workflows/auto-assign.yml`):

Required inputs:
- token (GITHUB_TOKEN)
- config (configuration path)

### Example of workflow file

```yamlex
name: Auto Request Review

on:
  pull_request:
    types: [opened, ready_for_review, reopened, synchronize]

jobs:
  auto-request-review:
    name: Auto Request Review
    runs-on: ubuntu-latest
    steps:
      - name: Use PR auto assign action
        uses: TBD
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          config: .github/pr-automation-rules.yml
```

### Configuration
Whole configuration file looks like

```yamlex
options:
  ignoredLabels:
    - Feature Branch
rulesByCreator:
  user1:
    - reviewers:
        - user2
      required: 1
    - reviewers:
        - user3
        - user4
      required: 1
      ifChanged:
        - group-2-files
        - common-files
    - reviewers:
        - user5
        - user6
        - user7
      required: 1
      assign: 2
    - reviewers:
        - user0
      required: 1
fileChangesGroups:
  common-files:
    - README.md
    - package-lock.json
    - package.json
    - 'src/common/**/*'
  group-1-files:
    - 'src/group-1/**/*'
  group-2-files:
    - 'src/group-2/**/*'

defaultRules:
  byFileGroups:
    group-1-files:
      - reviewers:
          - user0
        required: 1
      - reviewers:
          - user1
          - user2
        required: 1
      - reviewers:
          - user5
          - user6
          - user7
        required: 1
        assign: 1
    group-2-files:
      - reviewers:
          - user0
        required: 1
      - reviewers:
          - user3
          - user4
        required: 1
      - reviewers:
          - user9
          - user10
          - user11
        required: 1
        assign: 1
    common-files:
      - reviewers:
          - user0
        required: 1
      - reviewers:
          - user1
          - user2
        required: 1
      - reviewers:
          - user3
          - user4
        required: 1
      - reviewers:
          - user5
          - user6
          - user7
        required: 0
        assign: 1
      - reviewers:
          - user9
          - user10
          - user11
        required: 0
        assign: 1

```
#### Specify file groups

You can file groups based using [glob](https://en.wikipedia.org/wiki/Glob_(programming)) expressions.

```yamlex
fileChangesGroups:
  common-files:
    - README.md
    - .gitignore
    - package.json
    - 'src/common/**/*'
  group-1-files:
    - 'src/group-1/**/*'
  group-2-files:
    - 'src/group-2/**/*'
```

#### Assign reviewer by who created a PR
```yamlex
rulesByCreator:
  user1:
    - reviewers:
        - user2
      required: 1
    - reviewers:
        - user3
        - user4
      required: 1
      ifChanged:
        - group-2-files
        - common-files
    - reviewers:
        - user5
        - user6
        - user7
      required: 1
      assign: 2
    - reviewers:
        - user0
      required: 1
```
- `reviewers` — list of who will be asked for review
- `required` — amount of rChange Jira Issue Statusequired approves for that list
- `assign` — you can assign not whole list, but only, for example, 2 out of 3. These 2 will be randomly picked.
- `ifChanged` — apply the rule (assign reviewers) only if changed specific group(s) of file.

#### Default rules based on file groups.

```yamlex
defaultRules:
  byFileGroups:
    group-1-files:
      - reviewers:
          - user0
        required: 1
      - reviewers:
          - user1
          - user2
        required: 1
      - reviewers:
          - user5
          - user6
          - user7
        required: 1
        assign: 1
```
- `reviewers` — list of who will be asked for review
- `required` — amount of required approves for that list
- `assign` — you can assign not whole list, but only, for example, 2 out of 3. These 2 will be randomly picked.

#### Options
You can skip auto assign action by labelling your PR.
Also, it skips when PR is draft by default.
```yamlex
options:
  ignoredLabels:
    - bug
    - need help
```

<a name='merge'></a>
# Auto merge

This Github Action will check if all required reviewers approved PR and after that, it will merge automatically.

### Usage for auto merge
Create a workflow file in `.github/workflows` (e.g. `.github/workflows/auto-merge.yml`):

## Inputs

| Name                               | Required | Description                                                                                                         |
| ---------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------|
| `token`                            | yes      | A GitHub Token other than the default `GITHUB_TOKEN` needs to be specified in order to be able to enable auto-merge.|
| `config`                           | yes      | Configuration path.                                                                                                 |
| `do-not-merge-labels`              | no       | Specify labels names when you don't want to merge automatically                                                     |
| `do-not-merge-on-base-branch`      | no       | Specify branch names where you don't want to merge automatically                                                    |
| `comment`                          | no       | Before merging Github Action will add a comment in PR                                                               |
| `strategy`                         | no       | Default it's `merge` strategy but you can specific also `squash` or `rebase`                                        |

### Example of workflow file

```yamlex
name: Auto Merge Request

on:
  status:
  pull_request:
    types: [opened, ready_for_review, reopened, synchronize, edited, labeled, unlabeled]
  pull_request_review:
    types: [submitted, qedited, dismissed]

jobs:
  auto-merge-request:
    name: Auto merge
    runs-on: ubuntu-latest
    steps:
      - name: Use PR auto merge action
        uses: ezetech/pr-automation/auto-merge@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          config: '.github/pr-automation-rules.yml'
          comment: 'Test Commit After Merge'
          do-not-merge-labels: do-not-merge,do-not-merge2
          do-not-merge-on-base-branch: master,main
```

### Required Checks

In the configuration file you can add the `requiredChecks` parameter and specify the CI checks names that you want to wait before merging automatically.

```yamlex
options:
  requiredChecks:
    - Auto Request Review # CI Name
  ignoredLabels:
    - Feature Branch
rulesByCreator:
  user1:
    - reviewers:
        - user2
      required: 1
    - reviewers:
        - user3
        - user4
      required: 1
      ifChanged:
        - group-2-files
        - common-files
    - reviewers:
        - user5
        - user6
        - user7
      required: 1
      assign: 2
    - reviewers:
        - user0
      required: 1
fileChangesGroups:
  common-files:
    - README.md
    - package-lock.json
    - package.json
    - 'src/common/**/*'
  group-1-files:
    - 'src/group-1/**/*'
  group-2-files:
    - 'src/group-2/**/*'
```

<a name='jira'></a>
# Change Jira Issue Status 

This Github Action can change Jira Issue after successfully merging PR.

> To change Jira issue status, you need to give the PR a specific name like: `TEST-1-something` where TEST-1 is a Jira issue ID or `TEST-2-bla-bla` where TEST-2 is a Jira issue ID etc.

## Inputs

| Name                               | Required | Description                                                                                                         |
| ---------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------|
| `should-change-jira-issue-status`  | yes      | Default it's `false`                                                                                                |
| `jira-token`                       | yes      | See <a href='https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/' target="_blank">this link</a> to get more detail on how to generate token |
| `jira-account`                     | yes      | See <a href='https://developer.atlassian.com/cloud/jira/platform/basic-auth-for-rest-apis/' target="_blank">Using Jira API with Basic header scheme</a> |
| `jira-endpoint`                    | yes      | See <a href='https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/#version' target="_blank">Jira Rest API docs</a> |
| `jira-move-issue-from`             | yes      | If the status does not found or the issue does not have this status, do nothing.                                    |
| `jira-move-issue-to`               | yes      | If the status does not found, do nothing.                                                                           |

### Example of workflow file

```yamlex
name: Auto Merge Request

on:
  status:
  pull_request:
    types: [opened, ready_for_review, reopened, synchronize, edited, labeled, unlabeled]
  pull_request_review:
    types: [submitted, qedited, dismissed]

jobs:
  auto-merge-request:
    name: Auto merge
    runs-on: ubuntu-latest
    steps:
      - name: Use PR auto merge action
        uses: ezetech/pr-automation/auto-merge@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          config: '.github/pr-automation-rules.yml'
          comment: 'Test Commit After Merge'
          do-not-merge-labels: do-not-merge,do-not-merge2
          do-not-merge-on-base-branch: master,main
          should-change-jira-issue-status: true
          jira-token: ${{ secrets.JIRA_TOKEN }}
          jira-account: ${{ secrets.JIRA_ACCOUNT }}
          jira-endpoint: https://example.atlassian.net
          jira-move-issue-from: Code Review
          jira-move-issue-to: Ready For QA
```


## Local development

For local development you can use [act](https://github.com/nektos/act) tool.

```bash
act -s GITHUB_TOKEN=yourtoken
```

### Commands

`npm run test` for running tests

`npm run build` for bundling whole code of action to 1 file. File will be placed to `/dist/`
