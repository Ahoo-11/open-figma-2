import { api } from "encore.dev/api";
import { designDB } from "./db";
import type { Project } from "./types";

export interface ListProjectsResponse {
  projects: Project[];
}

// Retrieves all design projects.
export const listProjects = api<void, ListProjectsResponse>(
  { expose: true, method: "GET", path: "/projects" },
  async () => {
    const projects = await designDB.queryAll<Project>`
      SELECT * FROM projects
      ORDER BY updated_at DESC
    `;

    return { projects };
  }
);
