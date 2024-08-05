import { expect } from 'chai';
import { validateConfig } from './';

describe('should validate config ', () => {
  it('should fail cos no required args provided', (done) => {
    try {
      validateConfig({});
      done('Did not fail, but should');
    } catch (err: unknown) {
      expect((err as Error).message).to.deep.equal(
        '[{"message":"\\"rulesByCreator\\" is required","path":["rulesByCreator"],"type":"any.required","context":{"label":"rulesByCreator","key":"rulesByCreator"}}]',
      );
      done();
    }
  });
  it('should pass validation', (done) => {
    try {
      const params = {
        options: {},
        defaultRules: {},
        rulesByCreator: {},
        fileChangesGroups: {},
      };
      const result = validateConfig(params);
      expect(result).to.deep.equal(params);
      done();
    } catch (err: unknown) {
      done((err as Error).message);
    }
  });
  it('should pass validation and convert ignoreReassignForMergedPRs to boolean', (done) => {
    try {
      const params = {
        options: {
          ignoreReassignForMergedPRs: 'false',
        },
        defaultRules: {},
        rulesByCreator: {},
        fileChangesGroups: {},
      };
      const result = validateConfig(params);
      expect(result).to.deep.equal({
        ...params,
        options: {
          ignoreReassignForMergedPRs: false,
        },
      });
      done();
    } catch (err: unknown) {
      done((err as Error).message);
    }
  });
  it('should pass validation with ignoreReassignForMergedPRs', (done) => {
    try {
      const params = {
        options: {
          ignoreReassignForMergeFrom: 'main',
        },
        defaultRules: {},
        rulesByCreator: {},
        fileChangesGroups: {},
      };
      const result = validateConfig(params);
      expect(result).to.deep.equal({
        ...params,
        options: {
          ignoreReassignForMergeFrom: 'main',
        },
      });
      done();
    } catch (err: unknown) {
      done((err as Error).message);
    }
  });
  it('should lowercase & trim reviewers', (done) => {
    try {
      const params = {
        options: {
          ignoreReassignForMergeFrom: 'main',
        },
        defaultRules: {
          byFileGroups: {
            'file-group-1': [
              {
                reviewers: ['CalvinCalvin', 'Quade', ' BobG '],
                required: 1,
                assign: 1,
              },
            ],
          },
        },
        rulesByCreator: {
          Alfred: [{ reviewers: ['CalvinCalvin', ' BobG '], required: 1, assign: 1 }],
        },
        fileChangesGroups: {},
        sageUsers: {
          CalvinCalvin: [
            {
              email: 'calvin@email.com',
            },
          ],
          ' BobG ': [
            {
              email: 'bobg@email.com',
            },
          ],
        },
      };
      const result = validateConfig(params);
      console.log({ result: JSON.stringify(result) });
      expect(result).to.deep.equal({
        options: {
          ignoreReassignForMergeFrom: 'main',
        },
        defaultRules: {
          byFileGroups: {
            'file-group-1': [
              {
                reviewers: ['calvincalvin', 'quade', 'bobg'],
                required: 1,
                assign: 1,
              },
            ],
          },
        },
        rulesByCreator: {
          alfred: [{ reviewers: ['calvincalvin', 'bobg'], required: 1, assign: 1 }],
        },
        fileChangesGroups: {},
        sageUsers: {
          calvincalvin: [
            {
              email: 'calvin@email.com',
            },
          ],
          bobg: [
            {
              email: 'bobg@email.com',
            },
          ],
        },
      });
      done();
    } catch (err: unknown) {
      done((err as Error).message);
    }
  });
});
