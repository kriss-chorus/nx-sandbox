// Central schema barrel: export all entities from a single place
// This keeps each entity in its own file (SRP) while preserving a single
// entrypoint for Drizzle's schema config.
export * from './entities';
