import { SQLDatabase } from "encore.dev/storage/sqldb";

export const designDB = new SQLDatabase("design", {
  migrations: "./migrations",
});
