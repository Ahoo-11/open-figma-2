import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, Users, MessageCircle, Download, Layers, Square, Circle, Type, Hand, MousePointer, Clock, Keyboard, MoreHorizontal, Copy, Trash2 } from "lucide-react";
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
  const collaborationRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (designId) {
      loadDesignFile();
      setupCollaboration();
    }

    return () => {
      if (collaborationRef.current) {
        collaborationRef.current.close();
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
      const response = await backend.design.getDesignFile({ id: parseInt(designId!) });
      setDesignFile(response);
      setCanvasData(response.canvas_data);
    } catch (error) {
      console.error("Failed to load design file:", error);
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
      const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
      const userName = `User ${Math.floor(Math.random() * 1000)}`;
      
      const stream = await backend.collaboration.collaborate({
        design_file_id: designId!,
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
    switch (event.type) {
      case "cursor":
        if (event.data.left) {
          setCollaborators(prev => prev.filter(c => c.user_id !== event.user_id));
        } else {
          setCollaborators(prev => {
            const filtered = prev.filter(c => c.user_id !== event.user_id);
            return [...filtered, event.data];
          });
        }
        break;
      case "layer_update":
      case "layer_add":
      case "layer_delete":
        loadDesignFile();
        break;
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
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    sendCollaborationEvent({
      type: "cursor",
      data: { x, y, color: "#007AFF" }
    });
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
        title: "Error",
        description: "Failed to save design",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addLayer = (layer: Omit<Layer, "id">) => {
    const newLayer: Layer = {
      ...layer,
      id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    const updatedCanvasData = {
      ...canvasData,
      layers: [...canvasData.layers, newLayer],
    };

    setCanvasData(updatedCanvasData);
    setSelectedLayerId(newLayer.id);

    sendCollaborationEvent({
      type: "layer_add",
      data: newLayer,
    });
  };

  const updateLayer = (layerId: string, updates: Partial<Layer>) => {
    const updatedCanvasData = {
      ...canvasData,
      layers: canvasData.layers.map(layer =>
        layer.id === layerId ? { ...layer, ...updates } : layer
      ),
    };

    setCanvasData(updatedCanvasData);

    sendCollaborationEvent({
      type: "layer_update",
      data: { layerId, updates },
    });
  };

  const deleteLayer = (layerId: string) => {
    const updatedCanvasData = {
      ...canvasData,
      layers: canvasData.layers.filter(layer => layer.id !== layerId),
    };

    setCanvasData(updatedCanvasData);
    if (selectedLayerId === layerId) {
      setSelectedLayerId(null);
    }

    sendCollaborationEvent({
      type: "layer_delete",
      data: { layerId },
    });
  };

  const duplicateLayer = (layerId: string) => {
    const layer = canvasData.layers.find(l => l.id === layerId);
    if (!layer) return;

    const duplicatedLayer: Layer = {
      ...layer,
      id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${layer.name} Copy`,
      x: layer.x + 10,
      y: layer.y + 10,
    };

    addLayer(duplicatedLayer);
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
        title: "Error",
        description: "Failed to duplicate file",
        variant: "destructive",
      });
    }
  };

  const selectedLayer = selectedLayerId ? canvasData.layers.find(l => l.id === selectedLayerId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading design...</p>
        </div>
      </div>
    );
  }

  if (!designFile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Design not found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The design file you're looking for doesn't exist.</p>
          <Link to="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h2 className="font-semibold text-gray-900 dark:text-white">{designFile.name}</h2>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className={activeTool === "select" ? "bg-gray-100 dark:bg-gray-700" : ""}
            onClick={() => setActiveTool("select")}
            title="Select (V)"
          >
            <MousePointer className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={activeTool === "rectangle" ? "bg-gray-100 dark:bg-gray-700" : ""}
            onClick={() => setActiveTool("rectangle")}
            title="Rectangle (R)"
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={activeTool === "circle" ? "bg-gray-100 dark:bg-gray-700" : ""}
            onClick={() => setActiveTool("circle")}
            title="Circle (O)"
          >
            <Circle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={activeTool === "text" ? "bg-gray-100 dark:bg-gray-700" : ""}
            onClick={() => setActiveTool("text")}
            title="Text (T)"
          >
            <Type className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={activeTool === "pan" ? "bg-gray-100 dark:bg-gray-700" : ""}
            onClick={() => setActiveTool("pan")}
            title="Pan (Space)"
          >
            <Hand className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
            <Users className="h-4 w-4" />
            <span>{collaborators.length + 1}</span>
          </div>
          
          <Button variant="ghost" size="sm" onClick={() => setShowComments(true)}>
            <MessageCircle className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm" onClick={() => setShowVersionHistory(true)}>
            <Clock className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          
          <Button size="sm" onClick={() => saveDesignFile()} disabled={saving}>
            <Save className="h-4 w-4 mr-1" />
            {saving ? "Saving..." : "Save"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDuplicateFile}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => saveDesignFile(true)}>
                <Save className="h-4 w-4 mr-2" />
                Save Version
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowKeyboardShortcuts(true)}>
                <Keyboard className="h-4 w-4 mr-2" />
                Keyboard Shortcuts
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Layers */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
              <Layers className="h-4 w-4 mr-2" />
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

        {/* Center - Canvas */}
        <div className="flex-1 relative overflow-hidden" onMouseMove={handleMouseMove}>
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
        </div>

        {/* Right sidebar - Properties */}
        <div className="w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Properties</h3>
          </div>
          <PropertiesPanel
            selectedLayer={selectedLayer}
            onLayerUpdate={(updates) => selectedLayer && updateLayer(selectedLayer.id, updates)}
          />
        </div>
      </div>

      {/* Dialogs and Panels */}
      <VersionHistory
        designFileId={parseInt(designId!)}
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        onVersionRestored={loadDesignFile}
      />
      
      <ExportDialog
        designFileId={parseInt(designId!)}
        designFileName={designFile.name}
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      />
      
      <CommentsPanel
        designFileId={parseInt(designId!)}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
      
      <KeyboardShortcuts
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
      />
    </div>
  );
}
