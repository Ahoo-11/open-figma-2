import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import DesignCanvas from "../components/DesignCanvas";
import Toolbar from "../components/Toolbar";
import LayerPanel from "../components/LayerPanel";
import PropertiesPanel from "../components/PropertiesPanel";
import { DesignProvider } from "../contexts/DesignContext";

export default function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();

  const { data: project, isLoading, error } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      try {
        return await backend.design.getProject({ id: parseInt(projectId, 10) });
      } catch (error) {
        console.error("Failed to fetch project:", error);
        toast({
          title: "Error",
          description: "Failed to load project",
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading project...</div>
        </div>
      </div>
    );
  }

  if (error || (!project && projectId)) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-destructive">Failed to load project</div>
        </div>
      </div>
    );
  }

  return (
    <DesignProvider project={project}>
      <div className="h-screen flex flex-col bg-background">
        <Toolbar />
        <div className="flex-1 flex overflow-hidden">
          <LayerPanel />
          <div className="flex-1 relative">
            <DesignCanvas />
          </div>
          <PropertiesPanel />
        </div>
      </div>
    </DesignProvider>
  );
}
