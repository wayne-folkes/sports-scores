import { vi } from 'vitest';

// The fields of Response that the app's fetch calls read.
interface FakeResponse {
  ok: boolean;
  status?: number;
  json?: () => Promise<unknown>;
}

// Replaces global fetch for a test; returns the mock so calls can be counted.
export function mockFetch(impl: (url: string) => Promise<FakeResponse>) {
  const fn = vi.fn(impl);
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

export function fetchCallsTo(path: string): number {
  return vi.mocked(fetch).mock.calls.filter(([url]) => String(url).includes(path)).length;
}
