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
});
