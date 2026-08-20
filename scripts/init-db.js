import { initSchema } from "../lib/db.js";

await initSchema();

console.log("Database initialized successfully.");

process.exit(0);
