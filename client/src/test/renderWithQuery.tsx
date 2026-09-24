import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '../api/queries';

// Components that fetch data need a QueryClient; each test gets a fresh one
// so cached responses never leak between tests.
export function renderWithQuery(ui: ReactElement) {
  const client = createQueryClient();
  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
}
