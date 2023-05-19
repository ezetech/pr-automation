import { expect } from 'chai';
import { convertSageEmailsToUsernames } from './utils';

describe('Should test convertSageEmailsToUsernames: ', () => {
  it('should return array with "dog" element only', (done) => {
    const result = convertSageEmailsToUsernames({
      configSageUsers: {
        duck: [
          {
            email: 'duck@gmail.com',
          },
        ],
        dog: [
          {
            email: 'dog@gmail.com',
          },
        ],
        cow: [
          {
            email: 'cow@gmail.com',
          },
        ],
      },
      emailsList: ['dragon@gmail.com', 'dog@gmail.com'],
    });
    expect(result).deep.equal(['dog'], 'msg1');
    done();
  });
  it('should return empty array', (done) => {
    const result = convertSageEmailsToUsernames({
      configSageUsers: {
        duck: [
          {
            email: 'duck@gmail.com',
          },
        ],
        dog: [
          {
            email: 'dog@gmail.com',
          },
        ],
        cow: [
          {
            email: 'cow@gmail.com',
          },
        ],
      },
      emailsList: ['dragon@gmail.com', 'human@gmail.com'],
    });
    expect(result).deep.equal([], 'msg1');
    done();
  });
});
