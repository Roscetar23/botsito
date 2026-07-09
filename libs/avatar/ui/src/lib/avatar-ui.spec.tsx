import { render } from '@testing-library/react';

import AvatarUi from './avatar-ui';

describe('AvatarUi', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<AvatarUi />);
    expect(baseElement).toBeTruthy();
  });
});
