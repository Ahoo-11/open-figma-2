import { api } from "encore.dev/api";
import { designDB } from "./db";
import type { Project } from "./types";

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface CreateProjectResponse {
  project: Project;
}

// Creates a new design project.
export const createProject = api<CreateProjectRequest, CreateProjectResponse>(
  { expose: true, method: "POST", path: "/projects" },
  async (req) => {
    const project = await designDB.queryRow<Project>`
      INSERT INTO projects (name, description)
      VALUES (${req.name}, ${req.description || null})
      RETURNING *
    `;

    if (!project) {
      throw new Error("Failed to create project");
    }

    return { project };
  }
);
