import { useState } from 'react';

export function usePrevious<T>(value: T): T | undefined {
  const [state, setState] = useState<{ value: T; previous: T | undefined }>({ value, previous: undefined });

  if (state.value !== value) {
    setState({ value, previous: state.value });
  }

  return state.previous;
}
