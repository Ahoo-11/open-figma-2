import { api } from "encore.dev/api";
import { designDB } from "./db";
import type { Comment } from "./types";

export interface AddCommentRequest {
  design_file_id: number;
  x_position: number;
  y_position: number;
  content: string;
  author_name: string;
}

export interface AddCommentResponse {
  comment: Comment;
}

// Adds a comment to a design file.
export const addComment = api<AddCommentRequest, AddCommentResponse>(
  { expose: true, method: "POST", path: "/comments" },
  async (req) => {
    const comment = await designDB.queryRow<Comment>`
      INSERT INTO comments (design_file_id, x_position, y_position, content, author_name)
      VALUES (${req.design_file_id}, ${req.x_position}, ${req.y_position}, ${req.content}, ${req.author_name})
      RETURNING *
    `;

    if (!comment) {
      throw new Error("Failed to create comment");
    }

    return { comment };
  }
);
