import { render } from '@testing-library/react';

import TasksUi from './tasks-ui';

describe('TasksUi', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<TasksUi />);
    expect(baseElement).toBeTruthy();
  });
});
