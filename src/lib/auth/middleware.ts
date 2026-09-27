import { createMiddleware } from "@tanstack/react-start";

/**
 * Auth middleware for server functions. Adds the verified `context.userId`,
 * or throws `UnauthorizedError` when signed out.
 */
export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  // Only import `*.server` modules here so nothing server-only reaches the browser.
  const { assertSameSiteRequest } = await import("./isolation.server");
  const { requireUserId } = await import("./verify.server");
  assertSameSiteRequest();
  const userId = await requireUserId();
  return next({ context: { userId } });
});
