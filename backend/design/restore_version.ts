import { api, APIError } from "encore.dev/api";
import { designDB } from "./db";
import type { DesignFile, DesignVersion } from "./types";

export interface RestoreVersionRequest {
  design_file_id: number;
  version_number: number;
}

export interface RestoreVersionResponse {
  design_file: DesignFile;
}

// Restores a design file to a specific version.
export const restoreVersion = api<RestoreVersionRequest, RestoreVersionResponse>(
  { expose: true, method: "POST", path: "/design-files/:design_file_id/restore/:version_number" },
  async (req) => {
    const version = await designDB.queryRow<DesignVersion>`
      SELECT * FROM design_versions
      WHERE design_file_id = ${req.design_file_id} AND version_number = ${req.version_number}
    `;

    if (!version) {
      throw APIError.notFound("Version not found");
    }

    const designFile = await designDB.queryRow<DesignFile>`
      UPDATE design_files
      SET canvas_data = ${JSON.stringify(version.canvas_data)}, updated_at = NOW()
      WHERE id = ${req.design_file_id}
      RETURNING id, project_id, name, canvas_data, created_at, updated_at
    `;

    if (!designFile) {
      throw APIError.notFound("Design file not found");
    }

    return { design_file: designFile };
  }
);
