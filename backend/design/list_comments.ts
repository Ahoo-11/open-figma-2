import { api } from "encore.dev/api";
import { designDB } from "./db";
import type { Comment } from "./types";

export interface ListCommentsRequest {
  design_file_id: number;
}

export interface ListCommentsResponse {
  comments: Comment[];
}

// Retrieves all comments for a design file.
export const listComments = api<ListCommentsRequest, ListCommentsResponse>(
  { expose: true, method: "GET", path: "/design-files/:design_file_id/comments" },
  async (req) => {
    const comments = await designDB.queryAll<Comment>`
      SELECT * FROM comments
      WHERE design_file_id = ${req.design_file_id}
      ORDER BY created_at ASC
    `;

    return { comments };
  }
);
