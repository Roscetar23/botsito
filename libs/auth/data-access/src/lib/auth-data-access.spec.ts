import { authDataAccess } from './auth-data-access.js';

describe('authDataAccess', () => {
  it('should work', () => {
    expect(authDataAccess()).toEqual('auth-data-access');
  });
});
