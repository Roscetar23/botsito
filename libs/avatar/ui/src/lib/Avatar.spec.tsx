import { render } from '@testing-library/react';
import { Avatar } from './Avatar.js';

describe('Avatar', () => {
  it('renders with an aria-label matching the given state', () => {
    const { getByRole } = render(<Avatar state="speaking" />);
    expect(getByRole('img', { name: 'Avatar: hablando' })).toBeTruthy();
  });

  it('defaults to a 320px square and /avatar assets base', () => {
    const { getByRole, container } = render(<Avatar state="idle" />);
    expect(getByRole('img', { name: 'Avatar: en reposo' })).toBeTruthy();
    const img = container.querySelector('img[src="/avatar/body.png"]');
    expect(img).toBeTruthy();
  });

  it('honors a custom assetsBase and size', () => {
    const { container } = render(<Avatar state="notify" size={200} assetsBase="/custom" />);
    expect(container.querySelector('img[src="/custom/body.png"]')).toBeTruthy();
  });
});
