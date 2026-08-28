import { createContext, useContext } from 'react';

export const ThemeContext = createContext('default');

export function useTheme() {
  return useContext(ThemeContext);
}
