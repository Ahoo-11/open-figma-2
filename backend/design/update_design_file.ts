import { api, APIError } from "encore.dev/api";
import { designDB } from "./db";
import type { DesignFile, CanvasData } from "./types";

export interface UpdateDesignFileRequest {
  id: number;
  canvas_data: CanvasData;
  save_version?: boolean;
}

export interface UpdateDesignFileResponse {
  design_file: DesignFile;
}

// Updates a design file's canvas data.
export const updateDesignFile = api<UpdateDesignFileRequest, UpdateDesignFileResponse>(
  { expose: true, method: "PUT", path: "/design-files/:id" },
  async (req) => {
    await designDB.begin().then(async (tx) => {
      // Update the design file
      const designFile = await tx.queryRow<DesignFile>`
        UPDATE design_files
        SET canvas_data = ${JSON.stringify(req.canvas_data)}, updated_at = NOW()
        WHERE id = ${req.id}
        RETURNING id, project_id, name, canvas_data, created_at, updated_at
      `;

      if (!designFile) {
        throw APIError.notFound("Design file not found");
      }

      // Save version if requested
      if (req.save_version) {
        const lastVersion = await tx.queryRow<{ version_number: number }>`
          SELECT version_number FROM design_versions
          WHERE design_file_id = ${req.id}
          ORDER BY version_number DESC
          LIMIT 1
        `;

        const nextVersion = (lastVersion?.version_number || 0) + 1;

        await tx.exec`
          INSERT INTO design_versions (design_file_id, version_number, canvas_data)
          VALUES (${req.id}, ${nextVersion}, ${JSON.stringify(req.canvas_data)})
        `;
      }

      await tx.commit();
      return designFile;
    });

    const updatedFile = await designDB.queryRow<DesignFile>`
      SELECT id, project_id, name, canvas_data, created_at, updated_at
      FROM design_files
      WHERE id = ${req.id}
    `;

    return { design_file: updatedFile! };
  }
);
