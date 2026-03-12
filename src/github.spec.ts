import { expect } from 'chai';
import * as sinon from 'sinon';
import * as actionsCore from '@actions/core';
import * as actionsGithub from '@actions/github';
import * as logger from './logger';

describe('assignReviewers', () => {
  let getInputStub: sinon.SinonStub;
  let requestReviewersStub: sinon.SinonStub;
  let warningStub: sinon.SinonStub;

  const pr = {
    number: 42,
    author: 'zorin-mv',
    isDraft: false,
    isOpen: true,
    labelNames: [],
    branchName: 'feature/test',
    baseBranchName: 'main',
  };

  beforeEach(() => {
    getInputStub = sinon.stub(actionsCore, 'getInput').returns('fake-token');
    warningStub = sinon.stub(logger, 'warning');
    requestReviewersStub = sinon.stub();

    const octokitMock = {
      rest: {
        pulls: {
          requestReviewers: requestReviewersStub,
        },
      },
    };

    sinon.stub(actionsGithub, 'getOctokit').returns(octokitMock as any);
    sinon.stub(actionsGithub.context, 'repo').value({ owner: 'test-owner', repo: 'test-repo' });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should request all reviewers in a single call when all are collaborators', async () => {
    requestReviewersStub.resolves({});

    const { assignReviewers } = await import('./github');
    await assignReviewers(pr, ['alice', 'bob']);

    expect(requestReviewersStub.calledOnce).to.be.true;
    expect(requestReviewersStub.firstCall.args[0]).to.deep.include({
      pull_number: 42,
      reviewers: ['alice', 'bob'],
    });
  });

  it('should retry one-by-one when batch request fails with non-collaborator error', async () => {
    const nonCollaboratorError = new Error(
      'Reviews may only be requested from collaborators. One or more of the users or teams you specified is not a collaborator of the ezetech/test-repo repository.',
    );
    requestReviewersStub.onFirstCall().rejects(nonCollaboratorError);
    requestReviewersStub.onSecondCall().resolves({});  // alice ok
    requestReviewersStub.onThirdCall().rejects(nonCollaboratorError); // bob not a collaborator

    const { assignReviewers } = await import('./github');
    await assignReviewers(pr, ['alice', 'bob']);

    expect(requestReviewersStub.callCount).to.equal(3);
  });

  it('should log a warning for each reviewer that fails individually', async () => {
    const nonCollaboratorError = new Error(
      'Reviews may only be requested from collaborators.',
    );
    requestReviewersStub.onFirstCall().rejects(nonCollaboratorError);
    requestReviewersStub.onSecondCall().resolves({});
    requestReviewersStub.onThirdCall().rejects(nonCollaboratorError);

    const { assignReviewers } = await import('./github');
    await assignReviewers(pr, ['alice', 'bob']);

    expect(warningStub.calledOnce).to.be.true;
    expect(warningStub.firstCall.args[0]).to.include('bob');
  });

  it('should rethrow errors unrelated to collaborator check', async () => {
    const networkError = new Error('Network failure');
    requestReviewersStub.rejects(networkError);

    const { assignReviewers } = await import('./github');
    let thrown: Error | undefined;
    try {
      await assignReviewers(pr, ['alice']);
    } catch (err) {
      thrown = err as Error;
    }
    expect(thrown?.message).to.equal('Network failure');
  });

  it('should succeed without retry when reviewer list is empty', async () => {
    requestReviewersStub.resolves({});

    const { assignReviewers } = await import('./github');
    await assignReviewers(pr, []);

    expect(requestReviewersStub.calledOnce).to.be.true;
    expect(warningStub.called).to.be.false;
  });
});
