import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Folder, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { Project, DesignFile } from "~backend/design/types";

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [designFiles, setDesignFiles] = useState<Record<number, DesignFile[]>>({});
  const [loading, setLoading] = useState(true);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createFileOpen, setCreateFileOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [newFileName, setNewFileName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await backend.design.listProjects();
      setProjects(response.projects);
      
      // Load design files for each project
      const filesPromises = response.projects.map(async (project) => {
        const filesResponse = await backend.design.listDesignFiles({ project_id: project.id });
        return { projectId: project.id, files: filesResponse.design_files };
      });
      
      const filesResults = await Promise.all(filesPromises);
      const filesMap = filesResults.reduce((acc, { projectId, files }) => {
        acc[projectId] = files;
        return acc;
      }, {} as Record<number, DesignFile[]>);
      
      setDesignFiles(filesMap);
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return;

    try {
      await backend.design.createProject({
        name: newProject.name,
        description: newProject.description || undefined,
      });
      
      setNewProject({ name: "", description: "" });
      setCreateProjectOpen(false);
      loadProjects();
      
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    } catch (error) {
      console.error("Failed to create project:", error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    }
  };

  const handleCreateDesignFile = async () => {
    if (!newFileName.trim() || !selectedProjectId) return;

    try {
      await backend.design.createDesignFile({
        project_id: selectedProjectId,
        name: newFileName,
      });
      
      setNewFileName("");
      setCreateFileOpen(false);
      setSelectedProjectId(null);
      loadProjects();
      
      toast({
        title: "Success",
        description: "Design file created successfully",
      });
    } catch (error) {
      console.error("Failed to create design file:", error);
      toast({
        title: "Error",
        description: "Failed to create design file",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Your Projects</h1>
          <p className="text-gray-600 dark:text-gray-400">Create and manage your design projects</p>
        </div>
        
        <Dialog open={createProjectOpen} onOpenChange={setCreateProjectOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Create a new design project to organize your work.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Enter project description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateProjectOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject}>Create Project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <Folder className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No projects yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Get started by creating your first project</p>
          <Button onClick={() => setCreateProjectOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Folder className="h-5 w-5 text-blue-600" />
                      <span>{project.name}</span>
                    </CardTitle>
                    {project.description && (
                      <CardDescription className="mt-1">{project.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setCreateFileOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      New File
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {designFiles[project.id]?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {designFiles[project.id].map((file) => (
                      <Link key={file.id} to={`/design/${file.id}`}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <FileText className="h-4 w-4 text-gray-600" />
                              <span className="font-medium text-sm truncate">{file.name}</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Modified {new Date(file.updated_at).toLocaleDateString()}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FileText className="h-8 w-8 mx-auto mb-2" />
                    <p>No design files yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createFileOpen} onOpenChange={setCreateFileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Design File</DialogTitle>
            <DialogDescription>
              Create a new design file in this project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fileName">File Name</Label>
              <Input
                id="fileName"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="Enter file name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFileOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDesignFile}>Create File</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
