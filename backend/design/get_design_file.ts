import { api, APIError } from "encore.dev/api";
import { designDB } from "./db";
import type { DesignFile } from "./types";

export interface GetDesignFileRequest {
  id: number;
}

// Retrieves a specific design file by ID.
export const getDesignFile = api<GetDesignFileRequest, DesignFile>(
  { expose: true, method: "GET", path: "/design-files/:id" },
  async (req) => {
    const designFile = await designDB.queryRow<DesignFile>`
      SELECT id, project_id, name, canvas_data, created_at, updated_at
      FROM design_files
      WHERE id = ${req.id}
    `;

    if (!designFile) {
      throw APIError.notFound("Design file not found");
    }

    return designFile;
  }
);
