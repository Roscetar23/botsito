import { clearTokens, loadTokens, saveTokens } from './auth-storage.js';

describe('auth-storage', () => {
  beforeEach(() => window.localStorage.clear());

  it('returns null when there are no tokens', () => {
    expect(loadTokens()).toBeNull();
  });

  it('round-trips saved tokens', () => {
    saveTokens({ accessToken: 'a', refreshToken: 'r' });
    expect(loadTokens()).toEqual({ accessToken: 'a', refreshToken: 'r' });
  });

  it('clears tokens', () => {
    saveTokens({ accessToken: 'a', refreshToken: 'r' });
    clearTokens();
    expect(loadTokens()).toBeNull();
  });

  it('returns null if only one token is present', () => {
    window.localStorage.setItem('asistente.accessToken', 'a');
    expect(loadTokens()).toBeNull();
  });
});
