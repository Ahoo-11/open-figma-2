import { api } from "encore.dev/api";
import { designDB } from "./db";
import type { DesignVersion } from "./types";

export interface GetDesignVersionsRequest {
  design_file_id: number;
}

export interface GetDesignVersionsResponse {
  versions: DesignVersion[];
}

// Retrieves all versions for a design file.
export const getDesignVersions = api<GetDesignVersionsRequest, GetDesignVersionsResponse>(
  { expose: true, method: "GET", path: "/design-files/:design_file_id/versions" },
  async (req) => {
    const versions = await designDB.queryAll<DesignVersion>`
      SELECT * FROM design_versions
      WHERE design_file_id = ${req.design_file_id}
      ORDER BY version_number DESC
    `;

    return { versions };
  }
);
