/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";
// tRPC
import type { appRouter } from "../server/routers";

export type AppRouter = typeof appRouter;
