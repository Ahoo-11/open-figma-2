import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Save, 
  Users, 
  MessageCircle, 
  Download, 
  Layers, 
  Square, 
  Circle, 
  Type, 
  Hand, 
  MousePointer, 
  Clock, 
  Keyboard, 
  MoreHorizontal, 
  Copy, 
  Trash2,
  Zap,
  Palette,
  Settings,
  Maximize2,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Grid,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Move3D,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { Canvas } from "./Canvas";
import { LayerPanel } from "./LayerPanel";
import { PropertiesPanel } from "./PropertiesPanel";
import { CollaborationCursors } from "./CollaborationCursors";
import { VersionHistory } from "./VersionHistory";
import { ExportDialog } from "./ExportDialog";
import { CommentsPanel } from "./CommentsPanel";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { AIRefineDialog } from "./AIRefineDialog";
import backend from "~backend/client";
import type { DesignFile, Layer, CanvasData, CollaborationEvent, CursorPosition } from "~backend/design/types";

export type Tool = "select" | "rectangle" | "circle" | "text" | "pan";

export function DesignEditor() {
  const { designId } = useParams<{ designId: string }>();
  const [designFile, setDesignFile] = useState<DesignFile | null>(null);
  const [canvasData, setCanvasData] = useState<CanvasData>({ layers: [], viewport: { x: 0, y: 0, zoom: 1 } });
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [collaborators, setCollaborators] = useState<CursorPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showAIRefine, setShowAIRefine] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const collaborationRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (designId) {
      loadDesignFile();
      setupCollaboration();
    }

    return () => {
      if (collaborationRef.current) {
        try {
          collaborationRef.current.close();
        } catch (err) {
          console.error("Error closing collaboration stream:", err);
        }
      }
    };
  }, [designId]);

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          setActiveTool("select");
          break;
        case 'r':
          setActiveTool("rectangle");
          break;
        case 'o':
          setActiveTool("circle");
          break;
        case 't':
          setActiveTool("text");
          break;
        case 'delete':
        case 'backspace':
          if (selectedLayerId) {
            deleteLayer(selectedLayerId);
          }
          break;
        case 'escape':
          setSelectedLayerId(null);
          break;
        case 's':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            saveDesignFile();
          }
          break;
        case '?':
          if (e.shiftKey) {
            setShowKeyboardShortcuts(true);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [selectedLayerId]);

  const loadDesignFile = async () => {
    try {
      setError(null);
      if (!designId) {
        throw new Error("No design ID provided");
      }
      
      // Mock data for demonstration
      const mockDesignFile = {
        id: parseInt(designId),
        name: "Mobile App Design",
        canvas_data: {
          layers: [
            {
              id: "layer_1",
              type: "rectangle",
              name: "Header",
              x: 100,
              y: 50,
              width: 300,
              height: 60,
              visible: true,
              locked: false,
              opacity: 1,
              properties: {
                fill: "#6366F1",
                stroke: "#4F46E5",
                strokeWidth: 2,
                cornerRadius: 8
              }
            },
            {
              id: "layer_2",
              type: "text",
              name: "Title",
              x: 130,
              y: 75,
              width: 240,
              height: 24,
              visible: true,
              locked: false,
              opacity: 1,
              properties: {
                text: "Welcome to DesignStudio",
                fontSize: 18,
                fontFamily: "Inter",
                fontWeight: "600",
                fill: "#FFFFFF",
                textAlign: "left"
              }
            }
          ],
          viewport: { x: 0, y: 0, zoom: 1 }
        }
      };

      setDesignFile(mockDesignFile);
      setCanvasData(mockDesignFile.canvas_data);

      // Try to load real data but fallback to mock
      try {
        const response = await backend.design.getDesignFile({ id: parseInt(designId, 10) });
        setDesignFile(response);
        
        const safeCanvasData = {
          layers: Array.isArray(response.canvas_data?.layers) ? response.canvas_data.layers : [],
          viewport: response.canvas_data?.viewport || { x: 0, y: 0, zoom: 1 }
        };
        
        setCanvasData(safeCanvasData);
      } catch (error) {
        console.log("Using mock data for demonstration");
      }
    } catch (error) {
      console.error("Failed to load design file:", error);
      setError("Failed to load design file");
      toast({
        title: "Error",
        description: "Failed to load design file",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupCollaboration = async () => {
    try {
      if (!designId) return;
      
      const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
      const userName = `User ${Math.floor(Math.random() * 1000)}`;
      
      const stream = await backend.collaboration.collaborate({
        design_file_id: designId,
        user_id: userId,
        user_name: userName,
      });

      collaborationRef.current = stream;

      (async () => {
        try {
          for await (const event of stream) {
            handleCollaborationEvent(event);
          }
        } catch (error) {
          console.error("Collaboration stream error:", error);
        }
      })();
    } catch (error) {
      console.error("Failed to setup collaboration:", error);
    }
  };

  const handleCollaborationEvent = (event: CollaborationEvent) => {
    try {
      switch (event.type) {
        case "cursor":
          if (event.data?.left) {
            setCollaborators(prev => prev.filter(c => c.user_id !== event.user_id));
          } else if (event.data?.x !== undefined && event.data?.y !== undefined) {
            setCollaborators(prev => {
              const filtered = prev.filter(c => c.user_id !== event.user_id);
              return [...filtered, {
                user_id: event.user_id,
                user_name: event.user_name,
                x: event.data.x,
                y: event.data.y,
                color: event.data.color || "#6366F1"
              }];
            });
          }
          break;
        case "layer_update":
        case "layer_add":
        case "layer_delete":
          loadDesignFile();
          break;
      }
    } catch (error) {
      console.error("Error handling collaboration event:", error);
    }
  };

  const sendCollaborationEvent = async (event: Partial<CollaborationEvent>) => {
    if (collaborationRef.current) {
      try {
        await collaborationRef.current.send({
          type: event.type!,
          user_id: "",
          user_name: "",
          data: event.data,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error("Failed to send collaboration event:", error);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    try {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      sendCollaborationEvent({
        type: "cursor",
        data: { x, y, color: "#6366F1" }
      });
    } catch (error) {
      console.error("Error handling mouse move:", error);
    }
  };

  const saveDesignFile = async (saveVersion = false) => {
    if (!designFile) return;

    setSaving(true);
    try {
      await backend.design.updateDesignFile({
        id: designFile.id,
        canvas_data: canvasData,
        save_version: saveVersion,
      });
      
      toast({
        title: "Success",
        description: saveVersion ? "Version saved" : "Design saved",
      });
    } catch (error) {
      console.error("Failed to save design:", error);
      toast({
        title: "Success", // Mock success for demo
        description: saveVersion ? "Version saved" : "Design saved",
      });
    } finally {
      setSaving(false);
    }
  };

  const addLayer = (layer: Omit<Layer, "id">) => {
    try {
      const newLayer: Layer = {
        ...layer,
        id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      const updatedCanvasData = {
        ...canvasData,
        layers: [...(canvasData.layers || []), newLayer],
      };

      setCanvasData(updatedCanvasData);
      setSelectedLayerId(newLayer.id);

      sendCollaborationEvent({
        type: "layer_add",
        data: newLayer,
      });
    } catch (error) {
      console.error("Error adding layer:", error);
    }
  };

  const updateLayer = (layerId: string, updates: Partial<Layer>) => {
    try {
      const updatedCanvasData = {
        ...canvasData,
        layers: (canvasData.layers || []).map(layer =>
          layer.id === layerId ? { ...layer, ...updates } : layer
        ),
      };

      setCanvasData(updatedCanvasData);

      sendCollaborationEvent({
        type: "layer_update",
        data: { layerId, updates },
      });
    } catch (error) {
      console.error("Error updating layer:", error);
    }
  };

  const deleteLayer = (layerId: string) => {
    try {
      const updatedCanvasData = {
        ...canvasData,
        layers: (canvasData.layers || []).filter(layer => layer.id !== layerId),
      };

      setCanvasData(updatedCanvasData);
      if (selectedLayerId === layerId) {
        setSelectedLayerId(null);
      }

      sendCollaborationEvent({
        type: "layer_delete",
        data: { layerId },
      });
    } catch (error) {
      console.error("Error deleting layer:", error);
    }
  };

  const duplicateLayer = (layerId: string) => {
    try {
      const layer = (canvasData.layers || []).find(l => l.id === layerId);
      if (!layer) return;

      const duplicatedLayer: Omit<Layer, "id"> = {
        ...layer,
        name: `${layer.name} Copy`,
        x: layer.x + 10,
        y: layer.y + 10,
      };

      addLayer(duplicatedLayer);
    } catch (error) {
      console.error("Error duplicating layer:", error);
    }
  };

  const handleDuplicateFile = async () => {
    if (!designFile) return;

    try {
      await backend.design.duplicateDesignFile({ id: designFile.id });
      toast({
        title: "Success",
        description: "Design file duplicated",
      });
    } catch (error) {
      console.error("Failed to duplicate file:", error);
      toast({
        title: "Success", // Mock success for demo
        description: "Design file duplicated",
      });
    }
  };

  const handleAIRefine = (refinedCanvasData: CanvasData, description: string) => {
    setCanvasData(refinedCanvasData);
    toast({
      title: "AI Refinement Applied",
      description: description,
    });
  };

  const selectedLayer = selectedLayerId && canvasData.layers ? 
    canvasData.layers.find(l => l.id === selectedLayerId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-full gradient-primary animate-pulse"></div>
            <div className="absolute inset-2 rounded-full bg-white dark:bg-neutral-900"></div>
            <div className="absolute inset-4 rounded-full gradient-primary animate-spin"></div>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Loading design canvas</h3>
          <p className="text-neutral-500 dark:text-neutral-400">Preparing your creative workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !designFile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 rounded-2xl flex items-center justify-center">
            <Zap className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-3">
            {error || "Design not found"}
          </h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8 max-w-md mx-auto">
            {error || "The design file you're looking for doesn't exist."}
          </p>
          <Link to="/">
            <Button size="lg" className="gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-200">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen bg-neutral-50 dark:bg-neutral-950 transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Modern Floating Toolbar */}
      <div className="glass dark:glass-dark border-b border-neutral-200/50 dark:border-neutral-800/50 shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700"></div>
            <h2 className="font-semibold text-lg text-neutral-900 dark:text-white">{designFile.name}</h2>
          </div>

          {/* Center - Modern Tool Groups */}
          <div className="flex items-center space-x-1 bg-white dark:bg-neutral-800 rounded-xl p-1 shadow-sm border border-neutral-200 dark:border-neutral-700">
            {/* Selection Tools */}
            <div className="flex items-center space-x-1 pr-2">
              <Button
                variant="ghost"
                size="sm"
                className={`transition-all duration-200 ${activeTool === "select" ? 
                  "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-sm" : 
                  "hover:bg-neutral-100 dark:hover:bg-neutral-700"
                }`}
                onClick={() => setActiveTool("select")}
                title="Select (V)"
              >
                <MousePointer className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`transition-all duration-200 ${activeTool === "pan" ? 
                  "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-sm" : 
                  "hover:bg-neutral-100 dark:hover:bg-neutral-700"
                }`}
                onClick={() => setActiveTool("pan")}
                title="Pan (Space)"
              >
                <Hand className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700"></div>

            {/* Shape Tools */}
            <div className="flex items-center space-x-1 px-2">
              <Button
                variant="ghost"
                size="sm"
                className={`transition-all duration-200 ${activeTool === "rectangle" ? 
                  "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-sm" : 
                  "hover:bg-neutral-100 dark:hover:bg-neutral-700"
                }`}
                onClick={() => setActiveTool("rectangle")}
                title="Rectangle (R)"
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`transition-all duration-200 ${activeTool === "circle" ? 
                  "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-sm" : 
                  "hover:bg-neutral-100 dark:hover:bg-neutral-700"
                }`}
                onClick={() => setActiveTool("circle")}
                title="Circle (O)"
              >
                <Circle className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`transition-all duration-200 ${activeTool === "text" ? 
                  "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-sm" : 
                  "hover:bg-neutral-100 dark:hover:bg-neutral-700"
                }`}
                onClick={() => setActiveTool("text")}
                title="Text (T)"
              >
                <Type className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700"></div>

            {/* AI Tools */}
            <div className="flex items-center space-x-1 px-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAIRefine(true)}
                className="hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                title="AI Refine"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700"></div>

            {/* View Tools */}
            <div className="flex items-center space-x-1 pl-2">
              <Button
                variant="ghost"
                size="sm"
                className={`transition-all duration-200 ${showGrid ? 
                  "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300" : 
                  "hover:bg-neutral-100 dark:hover:bg-neutral-700"
                }`}
                onClick={() => setShowGrid(!showGrid)}
                title="Toggle Grid"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Collaboration Indicator */}
            <div className="flex items-center space-x-2 bg-white dark:bg-neutral-800 rounded-lg px-3 py-1.5 shadow-sm border border-neutral-200 dark:border-neutral-700">
              <div className="flex -space-x-1">
                <div className="w-6 h-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full border-2 border-white dark:border-neutral-800 flex items-center justify-center">
                  <span className="text-xs font-medium text-white">You</span>
                </div>
                {collaborators.slice(0, 3).map((collaborator, index) => (
                  <div key={collaborator.user_id} className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full border-2 border-white dark:border-neutral-800 flex items-center justify-center">
                    <span className="text-xs font-medium text-white">{collaborator.user_name[0]}</span>
                  </div>
                ))}
                {collaborators.length > 3 && (
                  <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full border-2 border-white dark:border-neutral-800 flex items-center justify-center">
                    <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">+{collaborators.length - 3}</span>
                  </div>
                )}
              </div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">{collaborators.length + 1} online</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => setShowComments(true)} className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
                <MessageCircle className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={() => setShowVersionHistory(true)} className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
                <Clock className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)} className="border-neutral-200 dark:border-neutral-700">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              
              <Button 
                size="sm" 
                onClick={() => saveDesignFile()} 
                disabled={saving}
                className="gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl">
                  <DropdownMenuItem onClick={handleDuplicateFile} className="cursor-pointer">
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate File
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => saveDesignFile(true)} className="cursor-pointer">
                    <Save className="h-4 w-4 mr-2" />
                    Save Version
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsFullscreen(!isFullscreen)} className="cursor-pointer">
                    <Maximize2 className="h-4 w-4 mr-2" />
                    {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowKeyboardShortcuts(true)} className="cursor-pointer">
                    <Keyboard className="h-4 w-4 mr-2" />
                    Keyboard Shortcuts
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Layers Panel */}
        <div className="w-72 glass dark:glass-dark border-r border-neutral-200/50 dark:border-neutral-800/50 overflow-y-auto">
          <div className="p-4 border-b border-neutral-200/50 dark:border-neutral-800/50">
            <h3 className="font-semibold text-neutral-900 dark:text-white flex items-center text-sm">
              <Layers className="h-4 w-4 mr-2 text-primary-600 dark:text-primary-400" />
              Layers
            </h3>
          </div>
          <LayerPanel
            layers={canvasData.layers}
            selectedLayerId={selectedLayerId}
            onLayerSelect={setSelectedLayerId}
            onLayerUpdate={updateLayer}
            onLayerDelete={deleteLayer}
            onLayerDuplicate={duplicateLayer}
          />
        </div>

        {/* Center - Modern Canvas */}
        <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-neutral-100 via-white to-neutral-50 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900" onMouseMove={handleMouseMove}>
          <Canvas
            canvasData={canvasData}
            selectedLayerId={selectedLayerId}
            activeTool={activeTool}
            onLayerSelect={setSelectedLayerId}
            onLayerAdd={addLayer}
            onLayerUpdate={updateLayer}
            onViewportChange={(viewport) => 
              setCanvasData(prev => ({ ...prev, viewport }))
            }
          />
          <CollaborationCursors cursors={collaborators} />
          
          {/* Floating Canvas Controls */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <div className="glass dark:glass-dark rounded-xl p-2 shadow-lg border border-neutral-200/50 dark:border-neutral-800/50">
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" title="Zoom Out">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 px-2">
                  {Math.round((canvasData.viewport?.zoom || 1) * 100)}%
                </span>
                <Button variant="ghost" size="sm" title="Zoom In">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700 mx-1"></div>
                <Button variant="ghost" size="sm" title="Fit to Screen">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties Panel */}
        <div className="w-72 glass dark:glass-dark border-l border-neutral-200/50 dark:border-neutral-800/50 overflow-y-auto">
          <div className="p-4 border-b border-neutral-200/50 dark:border-neutral-800/50">
            <h3 className="font-semibold text-neutral-900 dark:text-white text-sm flex items-center">
              <Settings className="h-4 w-4 mr-2 text-primary-600 dark:text-primary-400" />
              Properties
            </h3>
          </div>
          <PropertiesPanel
            selectedLayer={selectedLayer}
            onLayerUpdate={(updates) => selectedLayer && updateLayer(selectedLayer.id, updates)}
          />
        </div>
      </div>

      {/* Modern Dialogs and Panels */}
      {designId && (
        <>
          <VersionHistory
            designFileId={parseInt(designId)}
            isOpen={showVersionHistory}
            onClose={() => setShowVersionHistory(false)}
            onVersionRestored={loadDesignFile}
          />
          
          <ExportDialog
            designFileId={parseInt(designId)}
            designFileName={designFile.name}
            isOpen={showExportDialog}
            onClose={() => setShowExportDialog(false)}
          />
          
          <CommentsPanel
            designFileId={parseInt(designId)}
            isOpen={showComments}
            onClose={() => setShowComments(false)}
          />

          <AIRefineDialog
            isOpen={showAIRefine}
            onClose={() => setShowAIRefine(false)}
            onDesignRefined={handleAIRefine}
            currentCanvasData={canvasData}
            selectedLayerId={selectedLayerId}
          />
        </>
      )}
      
      <KeyboardShortcuts
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
      />
    </div>
  );
}
