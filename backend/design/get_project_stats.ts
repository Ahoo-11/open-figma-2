import { api } from "encore.dev/api";
import { designDB } from "./db";

export interface GetProjectStatsResponse {
  total_projects: number;
  total_design_files: number;
  total_comments: number;
  recent_activity: Array<{
    type: string;
    project_name: string;
    design_file_name?: string;
    created_at: Date;
  }>;
}

// Retrieves platform statistics and recent activity.
export const getProjectStats = api<void, GetProjectStatsResponse>(
  { expose: true, method: "GET", path: "/stats" },
  async () => {
    const [projectCount, fileCount, commentCount] = await Promise.all([
      designDB.queryRow<{ count: number }>`SELECT COUNT(*) as count FROM projects`,
      designDB.queryRow<{ count: number }>`SELECT COUNT(*) as count FROM design_files`,
      designDB.queryRow<{ count: number }>`SELECT COUNT(*) as count FROM comments`
    ]);

    const recentActivity = await designDB.queryAll<{
      type: string;
      project_name: string;
      design_file_name?: string;
      created_at: Date;
    }>`
      (SELECT 'project' as type, name as project_name, NULL as design_file_name, created_at
       FROM projects
       ORDER BY created_at DESC
       LIMIT 5)
      UNION ALL
      (SELECT 'design_file' as type, p.name as project_name, df.name as design_file_name, df.created_at
       FROM design_files df
       JOIN projects p ON df.project_id = p.id
       ORDER BY df.created_at DESC
       LIMIT 5)
      ORDER BY created_at DESC
      LIMIT 10
    `;

    return {
      total_projects: projectCount?.count || 0,
      total_design_files: fileCount?.count || 0,
      total_comments: commentCount?.count || 0,
      recent_activity: recentActivity
    };
  }
);
