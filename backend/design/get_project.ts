import { api, APIError } from "encore.dev/api";
import { designDB } from "./db";
import type { Project } from "./types";

export interface GetProjectParams {
  id: number;
}

// Retrieves a design project by ID.
export const getProject = api<GetProjectParams, Project>(
  { expose: true, method: "GET", path: "/projects/:id" },
  async (params) => {
    const project = await designDB.queryRow<Project>`
      SELECT *
      FROM projects 
      WHERE id = ${params.id}
    `;

    if (!project) {
      throw APIError.notFound("project not found");
    }

    return project;
  }
);
