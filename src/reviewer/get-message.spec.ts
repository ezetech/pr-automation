import { Config } from '../config/typings';
import { getMessage } from './get-message';
import { expect } from 'chai';

describe('should get message: ', () => {
  const fileChangesGroups: Config['fileChangesGroups'] = {
    ['file-group-1']: ['src/group1/**/*', 'src/test/group1/**/*'],
    ['file-group-2']: ['src/group2/**/*', 'src/test/group2/**/*'],
    ['file-group-common']: ['src/common/**/*', 'config.ts', 'src/specific/tsconfig.json'],
  };
  it('should get readable message about rules (1)', (done) => {
    const result = getMessage({
      createdBy: 'Bob',
      reviewersToAssign: ['Calvin', 'Quade', 'Bob', 'Colin', 'Chet'],
      rulesByCreator: {
        Bob: [
          {
            reviewers: ['Calvin', 'Quade', 'Bob', 'Colin', 'Chet'],
            required: 1,
            assign: 1,
            ifChanged: ['file-group-2'],
          },
          {
            reviewers: ['Vinny', 'Hank'],
            required: 1,
            assign: 1,
            ifChanged: ['file-group-1'],
          },
        ],
      },
      fileChangesGroups: ['file-group-2'],
    });
    expect(result).to.deep.equal(
      '- Calvin, Quade, Bob, Colin, Chet (1 required out of 5)',
    );
    done();
  });
  it('should get readable message about rules (2). Skip line for 0 required from group', (done) => {
    const result = getMessage({
      createdBy: 'Bob',
      reviewersToAssign: ['Calvin', 'Vinny', 'Hank', 'Colin'],
      rulesByCreator: {
        Bob: [
          {
            reviewers: ['Calvin'],
            required: 1,
            assign: 1,
          },
          {
            reviewers: ['Vinny', 'Hank'],
            required: 2,
            assign: 1,
          },
          {
            reviewers: ['Quade', 'Bob', 'Colin', 'Chet'],
            required: 0,
            assign: 1,
          },
        ],
      },
      fileChangesGroups: ['file-group-2'],
    });
    expect(result).to.deep.equal(
      `- Calvin (1 required out of 1)\n- Vinny, Hank (2 required out of 2)`,
    );
    done();
  });
  it('should get readable message about rules (3). Exclude creator from messages', (done) => {
    const result = getMessage({
      createdBy: 'Bob',
      reviewersToAssign: ['Calvin', 'Vinny', 'Hank', 'Colin'],
      rulesByCreator: {
        Bob: [
          {
            reviewers: ['Calvin'],
            required: 1,
            assign: 1,
          },
          {
            reviewers: ['Vinny', 'Hank'],
            required: 2,
            assign: 1,
          },
          {
            reviewers: ['Bob'],
            required: 1,
            assign: 1,
          },
        ],
      },
      fileChangesGroups: ['file-group-2'],
    });
    expect(result).to.deep.equal(
      `- Calvin (1 required out of 1)\n- Vinny, Hank (2 required out of 2)`,
    );
    done();
  });
  it('should get readable message about rules (4). Exclude duplicates', (done) => {
    const result = getMessage({
      createdBy: 'Bob',
      reviewersToAssign: ['Calvin', 'Vinny', 'Hank', 'Colin'],
      rulesByCreator: {
        Bob: [
          {
            reviewers: ['Calvin'],
            required: 1,
            assign: 1,
          },
          {
            reviewers: ['Vinny', 'Hank'],
            required: 2,
            assign: 1,
          },
          {
            reviewers: ['Bob'],
            required: 1,
            assign: 1,
          },
          {
            reviewers: ['Vinny'],
            required: 1,
            assign: 1,
          },
        ],
      },
      fileChangesGroups: ['file-group-2'],
    });
    expect(result).to.deep.equal(
      `- Calvin (1 required out of 1)\n- Vinny (1 required out of 1)\n- Hank (1 required out of 1)`,
    );
    done();
  });
});
