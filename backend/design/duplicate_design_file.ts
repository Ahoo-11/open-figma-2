import { api, APIError } from "encore.dev/api";
import { designDB } from "./db";
import type { DesignFile } from "./types";

export interface DuplicateDesignFileRequest {
  id: number;
  name?: string;
}

export interface DuplicateDesignFileResponse {
  design_file: DesignFile;
}

// Duplicates a design file.
export const duplicateDesignFile = api<DuplicateDesignFileRequest, DuplicateDesignFileResponse>(
  { expose: true, method: "POST", path: "/design-files/:id/duplicate" },
  async (req) => {
    const originalFile = await designDB.queryRow<DesignFile>`
      SELECT * FROM design_files WHERE id = ${req.id}
    `;

    if (!originalFile) {
      throw APIError.notFound("Design file not found");
    }

    const newName = req.name || `${originalFile.name} Copy`;

    const duplicatedFile = await designDB.queryRow<DesignFile>`
      INSERT INTO design_files (project_id, name, canvas_data)
      VALUES (${originalFile.project_id}, ${newName}, ${JSON.stringify(originalFile.canvas_data)})
      RETURNING id, project_id, name, canvas_data, created_at, updated_at
    `;

    if (!duplicatedFile) {
      throw new Error("Failed to duplicate design file");
    }

    return { design_file: duplicatedFile };
  }
);
