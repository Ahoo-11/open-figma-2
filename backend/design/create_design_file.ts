import { api } from "encore.dev/api";
import { designDB } from "./db";
import type { DesignFile, CanvasData } from "./types";

export interface CreateDesignFileRequest {
  project_id: number;
  name: string;
}

export interface CreateDesignFileResponse {
  design_file: DesignFile;
}

// Creates a new design file within a project.
export const createDesignFile = api<CreateDesignFileRequest, CreateDesignFileResponse>(
  { expose: true, method: "POST", path: "/design-files" },
  async (req) => {
    const defaultCanvasData: CanvasData = {
      layers: [],
      viewport: { x: 0, y: 0, zoom: 1 }
    };

    const designFile = await designDB.queryRow<DesignFile>`
      INSERT INTO design_files (project_id, name, canvas_data)
      VALUES (${req.project_id}, ${req.name}, ${JSON.stringify(defaultCanvasData)})
      RETURNING id, project_id, name, canvas_data, created_at, updated_at
    `;

    if (!designFile) {
      throw new Error("Failed to create design file");
    }

    return { design_file: designFile };
  }
);
