# PR automation

This is github action that auto assigns reviewers for PR, auto merges it based on your rules and many more 

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
- `required` — amount of required approves for that list
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


## Local development

For local development you can use [act](https://github.com/nektos/act) tool.

```bash
act -s GITHUB_TOKEN=yourtoken
```

### Commands

`npm run test` for running tests

`npm run build` for bundling whole code of action to 1 file. File will be placed to `/dist/`
