import { useState } from 'react';

export function usePrevious(value) {
  const [state, setState] = useState({ value, previous: undefined });

  if (state.value !== value) {
    setState({ value, previous: state.value });
  }

  return state.previous;
}
