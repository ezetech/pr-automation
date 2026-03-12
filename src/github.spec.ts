import { expect } from 'chai';
import * as sinon from 'sinon';
import * as actionsCore from '@actions/core';
import * as actionsGithub from '@actions/github';
import * as logger from './logger';

describe('filterCollaborators', () => {
  let getInputStub: sinon.SinonStub;
  let getOctokitStub: sinon.SinonStub;
  let checkCollaboratorStub: sinon.SinonStub;
  let warningStub: sinon.SinonStub;

  beforeEach(() => {
    getInputStub = sinon.stub(actionsCore, 'getInput').returns('fake-token');
    warningStub = sinon.stub(logger, 'warning');

    checkCollaboratorStub = sinon.stub();

    const octokitMock = {
      rest: {
        repos: {
          checkCollaborator: checkCollaboratorStub,
        },
      },
    };

    getOctokitStub = sinon.stub(actionsGithub, 'getOctokit').returns(octokitMock as any);

    sinon.stub(actionsGithub.context, 'repo').value({ owner: 'test-owner', repo: 'test-repo' });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return all reviewers when all are collaborators', async () => {
    checkCollaboratorStub.resolves({ status: 204 });

    const { filterCollaborators } = await import('./github');
    const result = await filterCollaborators(['alice', 'bob', 'charlie']);

    expect(result).to.deep.equal(['alice', 'bob', 'charlie']);
  });

  it('should filter out non-collaborators', async () => {
    checkCollaboratorStub.withArgs(sinon.match({ username: 'alice' })).resolves({ status: 204 });
    checkCollaboratorStub.withArgs(sinon.match({ username: 'bob' })).rejects(new Error('Not a collaborator'));
    checkCollaboratorStub.withArgs(sinon.match({ username: 'charlie' })).resolves({ status: 204 });

    const { filterCollaborators } = await import('./github');
    const result = await filterCollaborators(['alice', 'bob', 'charlie']);

    expect(result).to.deep.equal(['alice', 'charlie']);
  });

  it('should return empty array when no reviewers are collaborators', async () => {
    checkCollaboratorStub.rejects(new Error('Not a collaborator'));

    const { filterCollaborators } = await import('./github');
    const result = await filterCollaborators(['alice', 'bob']);

    expect(result).to.deep.equal([]);
  });

  it('should return empty array when given empty reviewers list', async () => {
    const { filterCollaborators } = await import('./github');
    const result = await filterCollaborators([]);

    expect(result).to.deep.equal([]);
    expect(checkCollaboratorStub.callCount).to.equal(0);
  });

  it('should log a warning for each non-collaborator', async () => {
    checkCollaboratorStub.withArgs(sinon.match({ username: 'alice' })).resolves({ status: 204 });
    checkCollaboratorStub.withArgs(sinon.match({ username: 'bob' })).rejects(new Error('Not a collaborator'));

    const { filterCollaborators } = await import('./github');
    await filterCollaborators(['alice', 'bob']);

    expect(warningStub.calledOnce).to.be.true;
    expect(warningStub.firstCall.args[0]).to.include('bob');
  });

  it('should call checkCollaborator with correct owner, repo and username', async () => {
    checkCollaboratorStub.resolves({ status: 204 });

    const { filterCollaborators } = await import('./github');
    await filterCollaborators(['alice']);

    expect(checkCollaboratorStub.calledOnceWith({
      owner: 'test-owner',
      repo: 'test-repo',
      username: 'alice',
    })).to.be.true;
  });
});
