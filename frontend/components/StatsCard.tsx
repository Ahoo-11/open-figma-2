import React, { useState, useEffect } from "react";
import { BarChart3, Users, FileText, MessageCircle, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";

interface StatsData {
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

export function StatsCard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await backend.design.getProjectStats();
      setStats(response);
    } catch (error) {
      console.error("Failed to load stats:", error);
      toast({
        title: "Error",
        description: "Failed to load statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Platform Overview</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <FileText className="h-4 w-4 text-blue-600 mr-1" />
            </div>
            <div className="text-2xl font-bold">{stats.total_projects}</div>
            <div className="text-sm text-gray-500">Projects</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <FileText className="h-4 w-4 text-green-600 mr-1" />
            </div>
            <div className="text-2xl font-bold">{stats.total_design_files}</div>
            <div className="text-sm text-gray-500">Design Files</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <MessageCircle className="h-4 w-4 text-purple-600 mr-1" />
            </div>
            <div className="text-2xl font-bold">{stats.total_comments}</div>
            <div className="text-sm text-gray-500">Comments</div>
          </div>
        </div>

        {stats.recent_activity.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Recent Activity
            </h4>
            <div className="space-y-2">
              {stats.recent_activity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    {activity.type === "project" ? "Created project" : "Created design file"}{" "}
                    <span className="font-medium">{activity.project_name}</span>
                    {activity.design_file_name && (
                      <>
                        {" "}/ <span className="font-medium">{activity.design_file_name}</span>
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
