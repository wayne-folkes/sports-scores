// The subset of Vercel's Node request/response helpers the handlers use.
// scripts/dev-api.ts provides the same helpers locally.
import type { IncomingMessage, ServerResponse } from 'node:http';

export interface ApiRequest extends IncomingMessage {
  query: Record<string, string>;
}

export interface ApiResponse extends ServerResponse {
  status(code: number): ApiResponse;
  json(body: unknown): ApiResponse;
}

export type Handler = (req: ApiRequest, res: ApiResponse) => unknown;
