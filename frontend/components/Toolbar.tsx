import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MousePointer,
  Square,
  Circle,
  Type,
  Save,
  Undo,
  Redo,
  Home,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDesignContext } from "../contexts/DesignContext";
import { useToast } from "@/components/ui/use-toast";

export default function Toolbar() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeTool, setActiveTool, saveProject, project } = useDesignContext();

  const tools = [
    { id: "select", icon: MousePointer, label: "Select" },
    { id: "rectangle", icon: Square, label: "Rectangle" },
    { id: "circle", icon: Circle, label: "Circle" },
    { id: "text", icon: Type, label: "Text" },
  ] as const;

  const handleSave = async () => {
    try {
      await saveProject();
      toast({
        title: "Success",
        description: "Project saved successfully",
      });
    } catch (error) {
      console.error("Failed to save project:", error);
      toast({
        title: "Error",
        description: "Failed to save project",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="border-b bg-background px-4 py-2 flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/")}
        className="gap-2"
      >
        <Home className="w-4 h-4" />
        Home
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-1">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTool(tool.id)}
            className="gap-2"
          >
            <tool.icon className="w-4 h-4" />
            {tool.label}
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" disabled>
          <Undo className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" disabled>
          <Redo className="w-4 h-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <Button variant="ghost" size="sm" onClick={handleSave} className="gap-2">
        <Save className="w-4 h-4" />
        Save
      </Button>

      <div className="flex-1" />

      {project && (
        <div className="text-sm text-muted-foreground">
          {project.name}
        </div>
      )}
    </div>
  );
}
