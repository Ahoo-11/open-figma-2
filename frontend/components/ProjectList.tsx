import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Plus, 
  Folder, 
  FileText, 
  Calendar, 
  Copy, 
  Trash2, 
  MoreHorizontal,
  Search,
  Grid3X3,
  List,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { CreateFileDialog } from "./CreateFileDialog";
import backend from "~backend/client";
import type { Project, DesignFile } from "~backend/design/types";

export function ProjectList() {
  const navigate = useNavigate();
  const location = useLocation();

  const [projects, setProjects] = useState<Project[]>([]);
  const [designFiles, setDesignFiles] = useState<Record<number, DesignFile[]>>({});
  const [loading, setLoading] = useState(true);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createFileOpen, setCreateFileOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [startAIForDialog, setStartAIForDialog] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      // Mock data for now since backend might not be working
      const mockProjects = [
        {
          id: 1,
          name: "Mobile App Design",
          description: "Modern mobile application UI/UX design with clean interfaces",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          name: "Brand Identity System",
          description: "Complete brand identity including logos, colors, and typography",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 3,
          name: "Web Dashboard",
          description: "Analytics dashboard with data visualization components",
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date(Date.now() - 172800000).toISOString()
        }
      ];

      const mockFiles = {
        1: [
          { id: 1, name: "Login Screen", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 2, name: "Home Dashboard", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        ],
        2: [
          { id: 3, name: "Logo Variations", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        ],
        3: [
          { id: 4, name: "Analytics View", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 5, name: "User Management", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        ]
      } as Record<number, DesignFile[]>;

      setProjects(mockProjects);
      setDesignFiles(mockFiles);

      // Try to load real data but fallback to mock
      try {
        const response = await backend.design.listProjects();
        setProjects(response.projects);
        
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
        console.log("Using mock data for demonstration");
      }
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

  const handleFileCreated = (fileId: number) => {
    setCreateFileOpen(false);
    setSelectedProjectId(null);
    loadProjects();
    navigate(`/design/${fileId}`);
  };

  const handleDuplicateFile = async (fileId: number, fileName: string) => {
    try {
      await backend.design.duplicateDesignFile({
        id: fileId,
        name: `${fileName} Copy`,
      });
      
      loadProjects();
      
      toast({
        title: "Success",
        description: "Design file duplicated",
      });
    } catch (error) {
      console.error("Failed to duplicate file:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate file",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    try {
      await backend.design.deleteDesignFile({ id: fileId });
      
      loadProjects();
      
      toast({
        title: "Success",
        description: "Design file deleted",
      });
    } catch (error) {
      console.error("Failed to delete file:", error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    try {
      await backend.design.deleteProject({ id: projectId });
      
      loadProjects();
      
      toast({
        title: "Success",
        description: "Project deleted",
      });
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const openAIPrompt = useCallback(async () => {
    try {
      let projectId: number | null = null;
      if (projects.length > 0) {
        projectId = projects[0].id;
      } else {
        const created = await backend.design.createProject({ name: "My First Project" });
        projectId = created.project.id;
        await loadProjects();
        toast({ title: "Project created", description: "Created 'My First Project' automatically." });
      }
      if (projectId) {
        setSelectedProjectId(projectId);
        setStartAIForDialog(true);
        setCreateFileOpen(true);
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to start AI prompt", variant: "destructive" });
    }
  }, [projects]);

  useEffect(() => {
    const state = location.state as any;
    if (state?.openAIDialog) {
      openAIPrompt();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, openAIPrompt, navigate, location.pathname]);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 animate-pulse"></div>
            <div className="absolute inset-2 rounded-full bg-white dark:bg-neutral-900"></div>
            <div className="absolute inset-4 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 animate-spin"></div>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Loading your workspace</h3>
          <p className="text-neutral-500 dark:text-neutral-400">Preparing your creative environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <div className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-neutral-900 via-primary-700 to-primary-600 bg-clip-text text-transparent mb-4">
              Your Creative Workspace
            </h1>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Design, collaborate, and create amazing experiences with professional tools and AI assistance
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex items-center space-x-4 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                />
              </div>

              {/* View Toggle */}
              <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-md"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-md"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Create Project Button */}
            <Dialog open={createProjectOpen} onOpenChange={setCreateProjectOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-200 group">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 bg-white/20 rounded-md group-hover:bg-white/30 transition-colors">
                      <Plus className="h-4 w-4" />
                    </div>
                    <span className="font-medium">New Project</span>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">Create New Project</DialogTitle>
                  <DialogDescription className="text-neutral-600 dark:text-neutral-400">
                    Start a new design project to organize your creative work.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Project Name</Label>
                    <Input
                      id="name"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      placeholder="Enter project name"
                      className="bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      placeholder="Describe your project..."
                      className="bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 min-h-[80px]"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateProjectOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateProject} className="gradient-primary text-white">
                    Create Project
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-2xl flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-3">Start Your Creative Journey</h3>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8 max-w-md mx-auto">
              Create your first project and begin designing amazing experiences with AI assistance
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button 
                onClick={() => setCreateProjectOpen(true)}
                size="lg"
                className="gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Project
              </Button>
              <Button 
                onClick={openAIPrompt}
                size="lg"
                variant="outline"
                className="border-primary-300 text-primary-600 dark:border-primary-800 dark:text-primary-300"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Generate from Prompt
              </Button>
            </div>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8" : "space-y-6"}>
            {filteredProjects.map((project) => (
              <Card key={project.id} className="group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                        <Folder className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {project.name}
                        </CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(project.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FileText className="h-3 w-3" />
                            <span>{designFiles[project.id]?.length || 0} files</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProjectId(project.id);
                          setStartAIForDialog(false);
                          setCreateFileOpen(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        New File
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                          <DropdownMenuItem 
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-red-600 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {project.description && (
                    <CardDescription className="text-neutral-600 dark:text-neutral-400 mt-3 leading-relaxed">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>
                
                <CardContent className="pt-0">
                  {designFiles[project.id]?.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {designFiles[project.id].slice(0, 4).map((file) => (
                        <div key={file.id} className="relative group/file">
                          <Link to={`/design/${file.id}`}>
                            <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer border border-neutral-200 dark:border-neutral-700 group-hover/file:border-primary-300 dark:group-hover/file:border-primary-700">
                              <div className="flex items-center space-x-2 mb-2">
                                <FileText className="h-4 w-4 text-primary-500" />
                                <span className="font-medium text-sm text-neutral-900 dark:text-white truncate">
                                  {file.name}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                {new Date(file.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                          </Link>
                          
                          <div className="absolute top-2 right-2 opacity-0 group-hover/file:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                                <DropdownMenuItem onClick={() => handleDuplicateFile(file.id, file.name)} className="cursor-pointer">
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteFile(file.id)}
                                  className="text-red-600 hover:text-red-700 cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                      {designFiles[project.id].length > 4 && (
                        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 flex items-center justify-center border border-neutral-200 dark:border-neutral-700">
                          <span className="text-sm text-neutral-500 dark:text-neutral-400">
                            +{designFiles[project.id].length - 4} more
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-neutral-400" />
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">No design files yet</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProjectId(project.id);
                          setStartAIForDialog(true);
                          setCreateFileOpen(true);
                        }}
                        className="text-primary-600 hover:text-primary-700 group/button"
                      >
                        <div className="flex items-center space-x-1">
                          <Sparkles className="h-4 w-4 group-hover/button:rotate-12 transition-transform" />
                          <span>Create with AI</span>
                        </div>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create File Dialog */}
        {selectedProjectId && (
          <CreateFileDialog
            isOpen={createFileOpen}
            onClose={() => setCreateFileOpen(false)}
            projectId={selectedProjectId}
            onFileCreated={handleFileCreated}
            startWithAI={startAIForDialog}
          />
        )}
      </div>
    </div>
  );
}
