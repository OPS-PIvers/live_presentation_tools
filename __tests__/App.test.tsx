import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import App from '../App';

test('renders the main application container', () => {
  render(<App />);
  const toolbar = screen.getByRole('toolbar');
  expect(toolbar).toBeInTheDocument();
});
