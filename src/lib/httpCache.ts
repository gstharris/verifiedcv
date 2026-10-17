import { NextResponse } from "next/server";

export const PRIVATE_NO_STORE = "private, no-store";

export function markPrivateNoStore<T extends Response>(response: T) {
  response.headers.set("Cache-Control", PRIVATE_NO_STORE);
  return response;
}
