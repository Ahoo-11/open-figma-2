import { api, APIError } from "encore.dev/api";
import { designDB } from "./db";
import type { Project } from "./types";

export interface UpdateProjectRequest {
  id: number;
  name?: string;
  description?: string;
}

// Updates a design project.
export const updateProject = api<UpdateProjectRequest, Project>(
  { expose: true, method: "PUT", path: "/projects/:id" },
  async (req) => {
    const existingProject = await designDB.queryRow`
      SELECT id FROM projects WHERE id = ${req.id}
    `;

    if (!existingProject) {
      throw APIError.notFound("project not found");
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (req.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(req.name);
    }

    if (req.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(req.description);
    }

    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE projects 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    params.push(req.id);

    const project = await designDB.rawQueryRow<Project>(query, ...params);

    if (!project) {
      throw new Error("Failed to update project");
    }

    return project;
  }
);
