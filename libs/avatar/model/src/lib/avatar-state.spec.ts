import { AVATAR_EXPRESSIONS } from './avatar-state.js';

describe('AVATAR_EXPRESSIONS', () => {
  it('covers all seven states', () => {
    expect(Object.keys(AVATAR_EXPRESSIONS).sort()).toEqual(
      ['happy', 'idle', 'listening', 'notify', 'sad', 'speaking', 'thinking'].sort(),
    );
  });

  it('marks notify as bouncy and glowing', () => {
    expect(AVATAR_EXPRESSIONS.notify).toMatchObject({ bounce: true, glow: true, mouth: 'talking' });
  });

  it('sad has no happy mouth and tilts the head', () => {
    expect(AVATAR_EXPRESSIONS.sad.mouth).toBe('neutral');
    expect(AVATAR_EXPRESSIONS.sad.brows).toBe('down');
    expect(AVATAR_EXPRESSIONS.sad.headTilt).toBeGreaterThan(0);
  });
});
