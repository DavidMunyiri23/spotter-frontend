import { render, screen } from '@testing-library/react';
import App from './App';

test('renders FMCSA HOS Tracker title', () => {
  render(<App />);
  const titleElement = screen.getByText(/FMCSA Hours of Service Tracker/i);
  expect(titleElement).toBeInTheDocument();
});