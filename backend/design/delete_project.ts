import { api, APIError } from "encore.dev/api";
import { designDB } from "./db";

export interface DeleteProjectParams {
  id: number;
}

// Deletes a design project.
export const deleteProject = api<DeleteProjectParams, void>(
  { expose: true, method: "DELETE", path: "/projects/:id" },
  async (params) => {
    const result = await designDB.exec`
      DELETE FROM projects WHERE id = ${params.id}
    `;

    // Note: We can't easily check affected rows in Encore.ts
    // The deletion will succeed even if no rows were affected
  }
);
