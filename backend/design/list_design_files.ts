import { api } from "encore.dev/api";
import { designDB } from "./db";
import type { DesignFile } from "./types";

export interface ListDesignFilesRequest {
  project_id: number;
}

export interface ListDesignFilesResponse {
  design_files: DesignFile[];
}

// Retrieves all design files for a project.
export const listDesignFiles = api<ListDesignFilesRequest, ListDesignFilesResponse>(
  { expose: true, method: "GET", path: "/projects/:project_id/design-files" },
  async (req) => {
    const designFiles = await designDB.queryAll<DesignFile>`
      SELECT id, project_id, name, canvas_data, created_at, updated_at
      FROM design_files
      WHERE project_id = ${req.project_id}
      ORDER BY updated_at DESC
    `;

    return { design_files: designFiles };
  }
);
