import { api } from "encore.dev/api";
import { designDB } from "./db";
import type { Project } from "./types";

export interface SearchProjectsRequest {
  query: string;
  limit?: number;
}

export interface SearchProjectsResponse {
  projects: Project[];
}

// Searches projects by name and description.
export const searchProjects = api<SearchProjectsRequest, SearchProjectsResponse>(
  { expose: true, method: "GET", path: "/projects/search" },
  async (req) => {
    const limit = req.limit || 50;
    const searchQuery = `%${req.query.toLowerCase()}%`;

    const projects = await designDB.queryAll<Project>`
      SELECT * FROM projects
      WHERE LOWER(name) LIKE ${searchQuery} OR LOWER(description) LIKE ${searchQuery}
      ORDER BY updated_at DESC
      LIMIT ${limit}
    `;

    return { projects };
  }
);
