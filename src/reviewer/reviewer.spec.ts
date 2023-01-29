import { expect } from 'chai';
import { Config } from '../config/typings';
import { identifyFileChangeGroups, identifyReviewers, shouldRequestReview } from './';

describe('should test identifyFileChangeGroups: ', () => {
  const fileChangesGroups: Config['fileChangesGroups'] = {
    ['file-group-1']: ['src/group1/**/*', 'src/test/group1/**/*'],
    ['file-group-2']: ['src/group2/**/*', 'src/test/group2/**/*'],
    ['file-group-common']: ['src/common/**/*', 'config.ts', 'src/specific/tsconfig.json'],
  };
  it('should identify changed files for group 1 + common', (done) => {
    const result = identifyFileChangeGroups({
      fileChangesGroups,
      changedFiles: ['src/group1/dir1/a.ts', 'src/group1/dir2/b.ts', 'config.ts'],
    });
    expect(result).to.deep.equal(['file-group-1', 'file-group-common']);
    done();
  });
  it('should identify changed files for group 1 + common', (done) => {
    const result = identifyFileChangeGroups({
      fileChangesGroups,
      changedFiles: ['src/group1/a.ts', 'src/group1/b.ts', 'config.ts'],
    });
    expect(result).to.deep.equal(['file-group-1', 'file-group-common']);
    done();
  });
  it('should identify changed files for only common group', (done) => {
    const result = identifyFileChangeGroups({
      fileChangesGroups,
      changedFiles: ['src/common/a.ts'],
    });
    expect(result).to.deep.equal(['file-group-common']);
    done();
  });
  it('should identify changed files for group 1 + group 2', (done) => {
    const result = identifyFileChangeGroups({
      fileChangesGroups,
      changedFiles: ['src/group1/a.ts', 'src/test/group2/a.ts'],
    });
    expect(result).to.deep.equal(['file-group-1', 'file-group-2']);
    done();
  });
  it('should identify changed files for group 1 + group 2', (done) => {
    const result = identifyFileChangeGroups({
      fileChangesGroups,
      changedFiles: ['src/group1/a.ts', 'src/test/group2/a.ts'],
    });
    expect(result).to.deep.equal(['file-group-1', 'file-group-2']);
    done();
  });
  it('should identify changed files for only common group', (done) => {
    const result = identifyFileChangeGroups({
      fileChangesGroups,
      changedFiles: ['src/specific/tsconfig.json'],
    });
    expect(result).to.deep.equal(['file-group-common']);
    done();
  });
});

describe('Should test identifyReviewers: ', () => {
  const rulesByCreator = {
    Alfred: [
      { reviewers: ['Calvin'], required: 1 },
      {
        reviewers: ['Colin', 'Chet'],
        required: 1,
        ifChanged: ['file-group-1', 'file-group-common'],
      },
      {
        reviewers: ['Hank', 'Vinny'],
        required: 1,
        ifChanged: ['file-group-2', 'file-group-common'],
      },
      { reviewers: ['Quade'], required: 1 },
    ],
    Vinny: [
      { reviewers: ['Hank'], required: 1 },
      {
        reviewers: ['Colin', 'Chet'],
        required: 1,
        ifChanged: ['file-group-1', 'file-group-common'],
      },
      {
        reviewers: ['Duffy', 'Chris', 'Don'],
        required: 1,
        assign: 2,
      },
      { reviewers: ['Quade'], required: 1 },
    ],
  };
  it('Should assign proper reviewers for Bob. Should not ask himself for review', (done) => {
    const result = identifyReviewers({
      requestedReviewerLogins: [],
      createdBy: 'Bob',
      rulesByCreator: {
        Bob: [{ reviewers: ['Calvin', 'Quade', 'Bob'], required: 1 }],
      },
      fileChangesGroups: ['file-group-2'],
    });
    expect(result).to.include('Calvin', 'Calvin is required');
    expect(result).to.include('Quade', 'Quade is required');
    expect(result).to.not.include('Bob', 'Bob should be absent');
    expect(result.length).to.be.equal(2);
    done();
  });
  it('Should assign same reviewers for Bob 1000 times. Because 1 approver was already requested before', (done) => {
    const times = 1000;
    for (let i = 0; i < times; i++) {
      const result = identifyReviewers({
        requestedReviewerLogins: ['Quade'],
        createdBy: 'Bob',
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
      expect(result).to.include('Quade', 'Quade is required');
      expect(result.length).to.be.equal(1);
    }
    done();
  });
  it('Should assign same reviewers for Bob 1000 times. Because 3 approvers were already requested before', (done) => {
    const times = 1000;
    for (let i = 0; i < times; i++) {
      const result = identifyReviewers({
        requestedReviewerLogins: ['Colin', 'Quade', 'Vinny'],
        createdBy: 'Bob',
        rulesByCreator: {
          Bob: [
            {
              reviewers: [
                'Calvin',
                'Quade',
                'Bob',
                'Colin',
                'Chet',
                'Vinny',
                'Hank',
                'Tobias',
              ],
              required: 1,
              assign: 1,
            },
          ],
        },
        fileChangesGroups: ['file-group-2'],
      });
      expect(result).to.include('Colin', 'Colin is required');
      expect(result).to.include('Quade', 'Quade is required');
      expect(result).to.include('Vinny', 'Vinny is required');
      expect(result.length).to.be.equal(3);
    }
    done();
  });
  it('Should assign same reviewers for Bob 1000 times by using default rules. Because 3 approvers were already requested before', (done) => {
    const times = 1000;
    for (let i = 0; i < times; i++) {
      const result = identifyReviewers({
        requestedReviewerLogins: ['Colin', 'Quade', 'Vinny'],
        createdBy: 'Bob',
        defaultRules: {
          byFileGroups: {
            'file-group-1': [
              {
                reviewers: [
                  'Calvin',
                  'Quade',
                  'Bob',
                  'Colin',
                  'Chet',
                  'Vinny',
                  'Hank',
                  'Tobias',
                ],
                required: 1,
                assign: 1,
              },
            ],
          },
        },
        rulesByCreator: {},
        fileChangesGroups: ['file-group-1'],
      });
      expect(result).to.include('Colin', 'Colin is required');
      expect(result).to.include('Quade', 'Quade is required');
      expect(result).to.include('Vinny', 'Vinny is required');
      expect(result.length).to.be.equal(3);
    }
    done();
  });
  it('Should assign proper reviewers for Vinny. file-group-2 changed', (done) => {
    const result = identifyReviewers({
      requestedReviewerLogins: [],
      createdBy: 'Vinny',
      rulesByCreator,
      fileChangesGroups: ['file-group-2'],
    });
    expect(result).to.include('Hank', 'Hank is required');
    expect(result).to.include('Quade', 'Quade is required');
    expect(result).to.not.include('Colin', 'Colin should be absent');
    expect(result).to.not.include('Chet', 'Chet should be absent');
    const rest = ['Duffy', 'Chris', 'Don'];
    const twoRest = result.filter((item) => rest.includes(item));
    expect(twoRest.length).to.be.equal(
      2,
      "'Duffy', 'Chris', 'Don' — two of them should be required",
    );
    expect(result.length).to.be.equal(4);
    done();
  });
  it('Should assign proper reviewers for Vinny. file-group-2 and file-group-1 changed', (done) => {
    const result = identifyReviewers({
      requestedReviewerLogins: [],
      createdBy: 'Vinny',
      rulesByCreator,
      fileChangesGroups: ['file-group-2', 'file-group-1'],
    });
    expect(result).to.include('Hank', 'Hank is required');
    expect(result).to.include('Quade', 'Quade is required');
    expect(result).to.include('Colin', 'Colin is required');
    expect(result).to.include('Chet', 'Colin is required');
    const restThree = ['Duffy', 'Chris', 'Don'];
    const rest = result.filter((item) => restThree.includes(item));
    expect(rest.length).to.be.equal(
      2,
      "'Duffy', 'Chris', 'Don' — two of them should be required",
    );
    expect(result.length).to.be.equal(6);
    done();
  });
  it('Should assign proper reviewers for Vinny. file-group-2 and file-group-common changed', (done) => {
    const result = identifyReviewers({
      requestedReviewerLogins: [],
      createdBy: 'Vinny',
      rulesByCreator,
      fileChangesGroups: ['file-group-2', 'file-group-common'],
    });
    expect(result).to.include('Hank', 'Hank is required');
    expect(result).to.include('Quade', 'Quade is required');
    expect(result).to.include('Colin', 'Colin is required');
    expect(result).to.include('Chet', 'Colin is required');
    const restThree = ['Duffy', 'Chris', 'Don'];
    const rest = result.filter((item) => restThree.includes(item));
    expect(rest.length).to.be.equal(
      2,
      "'Duffy', 'Chris', 'Don' — two of them should be required",
    );
    expect(result.length).to.be.equal(6);
    done();
  });
  it('Should assign proper reviewers for Alfred. file-group-common changed', (done) => {
    const result = identifyReviewers({
      requestedReviewerLogins: [],
      createdBy: 'Alfred',
      rulesByCreator,
      fileChangesGroups: ['file-group-common'],
    });
    expect(result).to.include('Calvin', 'Calvin is required');
    expect(result).to.include('Quade', 'Quade is required');
    expect(result).to.include('Colin', 'Colin is required');
    expect(result).to.include('Chet', 'Chet is required');
    expect(result).to.include('Hank', 'Hank is required');
    expect(result).to.include('Vinny', 'Vinny is required');
    expect(result.length).to.be.equal(6);
    done();
  });
  it('Should assign proper reviewers for Alfred. file-group-1 changed', (done) => {
    const result = identifyReviewers({
      requestedReviewerLogins: [],
      createdBy: 'Alfred',
      rulesByCreator,
      fileChangesGroups: ['file-group-1'],
    });
    expect(result).to.include('Calvin', 'Calvin is required');
    expect(result).to.include('Quade', 'Quade is required');
    expect(result).to.include('Colin', 'Colin is required');
    expect(result).to.include('Chet', 'Chet is required');
    expect(result).to.not.include('Hank', 'Hank should be absent');
    expect(result).to.not.include('Vinny', 'Hank should be absent');
    expect(result.length).to.be.equal(4);
    done();
  });
  it('Should not assign proper reviewers for unknown user', (done) => {
    const result = identifyReviewers({
      requestedReviewerLogins: [],
      createdBy: 'unknown',
      rulesByCreator,
      fileChangesGroups: ['file-group-common'],
    });
    expect(result).to.be.deep.equal([], 'Array should be empty');
    done();
  });
  it('Should assign proper reviewers for Tobias by using default rules. file-group-1 changed', (done) => {
    const result = identifyReviewers({
      requestedReviewerLogins: [],
      defaultRules: {
        byFileGroups: {
          'file-group-1': [{ reviewers: ['Calvin'], required: 1 }],
        },
      },
      createdBy: 'Tobias',
      rulesByCreator,
      fileChangesGroups: ['file-group-1'],
    });
    expect(result).to.include('Calvin', 'Calvin is required');
    expect(result.length).to.be.equal(1);
    done();
  });
  it('Should assign proper reviewers for Tobias by using default rules. file-group-2 and file-group-common changed', (done) => {
    const result = identifyReviewers({
      requestedReviewerLogins: [],
      defaultRules: {
        byFileGroups: {
          'file-group-common': [{ reviewers: ['Vinny'], required: 1 }],
          'file-group-2': [
            { reviewers: ['Quade'], required: 1 },
            {
              reviewers: ['Duffy', 'Chris', 'Don'],
              required: 1,
              assign: 2,
            },
          ],
        },
      },
      createdBy: 'Tobias',
      rulesByCreator,
      fileChangesGroups: ['file-group-2', 'file-group-common'],
    });
    const rest = ['Duffy', 'Chris', 'Don'];
    const twoRest = result.filter((item) => rest.includes(item));
    expect(twoRest.length).to.be.equal(
      2,
      "'Duffy', 'Chris', 'Don' — two of them should be required",
    );
    expect(result).to.include('Vinny', 'Vinny is required');
    expect(result).to.include('Quade', 'Quade is required');
    expect(result.length).to.be.equal(4);
    done();
  });
});

describe('should test shouldRequestReview:', () => {
  it('should ignore draft PR', () => {
    const result = shouldRequestReview({
      isDraft: true,
      currentLabels: [],
    });
    expect(result).to.be.equal(false, 'Should not request review');
  });
  it('should not ignore PR (non-draft PR)', () => {
    const result = shouldRequestReview({
      isDraft: false,
      currentLabels: [],
    });
    expect(result).to.be.equal(true, 'Should request review');
  });
  it('should skip requesting PR reviewers, cos matched label', () => {
    const result = shouldRequestReview({
      isDraft: false,
      currentLabels: ['label1'],
      options: { ignoredLabels: ['label1'] },
    });
    expect(result).to.be.equal(false, 'Should not request review');
  });
  it('should not skip requesting PR reviewers, cos label does not match', () => {
    const result = shouldRequestReview({
      isDraft: false,
      currentLabels: ['unknownLabel'],
      options: { ignoredLabels: ['label1'] },
    });
    expect(result).to.be.equal(true, 'Should request review');
  });
});
