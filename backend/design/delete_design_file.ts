import { api, APIError } from "encore.dev/api";
import { designDB } from "./db";

export interface DeleteDesignFileRequest {
  id: number;
}

// Deletes a design file and all its versions.
export const deleteDesignFile = api<DeleteDesignFileRequest, void>(
  { expose: true, method: "DELETE", path: "/design-files/:id" },
  async (req) => {
    const result = await designDB.exec`
      DELETE FROM design_files WHERE id = ${req.id}
    `;
  }
);
