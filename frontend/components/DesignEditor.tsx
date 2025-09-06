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
  Settings,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Grid,
  Sparkles,
  Group as GroupIcon,
  Ungroup as UngroupIcon
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
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
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
        case 'v': setActiveTool("select"); break;
        case 'r': setActiveTool("rectangle"); break;
        case 'o': setActiveTool("circle"); break;
        case 't': setActiveTool("text"); break;
        case 'delete':
        case 'backspace':
          if (selectedLayerIds[0]) deleteLayer(selectedLayerIds[0]);
          break;
        case 'escape': setSelectedLayerIds([]); break;
        case 's':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            saveDesignFile();
          }
          break;
        case 'g': {
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            const firstSelected = selectedLayerIds[0];
            const layer = firstSelected ? canvasData.layers.find(l => l.id === firstSelected) : undefined;
            if (e.shiftKey) {
              if (firstSelected && layer?.type === 'group') {
                ungroupLayer(firstSelected);
              } else {
                toast({ title: "Ungroup", description: "Select a single group to ungroup." });
              }
            } else {
              if (firstSelected && layer?.type === 'group' && selectedLayerIds.length === 1) {
                ungroupLayer(firstSelected);
              } else if (selectedLayerIds.length >= 2) {
                groupSelectedLayers(selectedLayerIds);
              } else {
                toast({ title: "Group", description: "Select multiple layers to group." });
              }
            }
          }
          break;
        }
        case '?':
          if (e.shiftKey) setShowKeyboardShortcuts(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [selectedLayerIds, canvasData.layers]);

  const loadDesignFile = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!designId) throw new Error("No design ID provided");
      
      const response = await backend.design.getDesignFile({ id: parseInt(designId, 10) });
      setDesignFile(response);
      
      let parsedCanvasData = response.canvas_data as any;
      if (typeof parsedCanvasData === 'string') {
        try {
          parsedCanvasData = JSON.parse(parsedCanvasData);
        } catch (e) {
          console.error("Failed to parse canvas_data JSON string:", e);
          parsedCanvasData = null;
        }
      }

      const safeCanvasData: CanvasData = (parsedCanvasData && typeof parsedCanvasData === 'object' && 'layers' in parsedCanvasData)
        ? { layers: Array.isArray(parsedCanvasData.layers) ? parsedCanvasData.layers : [], viewport: parsedCanvasData.viewport || { x: 0, y: 0, zoom: 1 } }
        : { layers: [], viewport: { x: 0, y: 0, zoom: 1 } };
      
      setCanvasData(safeCanvasData);
      
    } catch (error) {
      console.error("Failed to load design file:", error);
      setError("Failed to load design file. It may not exist or there was a network error.");
      toast({ title: "Error", description: "Failed to load design file.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const setupCollaboration = async () => {
    try {
      if (!designId) return;
      
      const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
      const userName = `User ${Math.floor(Math.random() * 1000)}`;
      
      const stream = await backend.collaboration.collaborate({ design_file_id: designId, user_id: userId, user_name: userName });
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
        if (event.data?.left) {
          setCollaborators(prev => prev.filter(c => c.user_id !== event.user_id));
        } else if (event.data?.x !== undefined && event.data?.y !== undefined) {
          setCollaborators(prev => {
            const filtered = prev.filter(c => c.user_id !== event.user_id);
            return [...filtered, { user_id: event.user_id, user_name: event.user_name, x: event.data.x, y: event.data.y, color: event.data.color || "#6366F1" }];
          });
        }
        break;
      case "layer_update":
      case "layer_add":
      case "layer_delete":
      case "group":
      case "ungroup":
        loadDesignFile();
        break;
    }
  };

  const sendCollaborationEvent = async (event: Partial<CollaborationEvent>) => {
    if (collaborationRef.current) {
      try {
        await collaborationRef.current.send({ type: event.type!, user_id: "", user_name: "", data: event.data, timestamp: Date.now() });
      } catch (error) {
        console.error("Failed to send collaboration event:", error);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    sendCollaborationEvent({ type: "cursor", data: { x, y, color: "#6366F1" } });
  };

  const saveDesignFile = async (saveVersion = false) => {
    if (!designFile) return;
    setSaving(true);
    try {
      await backend.design.updateDesignFile({ id: designFile.id, canvas_data: canvasData, save_version: saveVersion });
      toast({ title: "Success", description: saveVersion ? "Version saved" : "Design saved" });
    } catch (error) {
      console.error("Failed to save design:", error);
      toast({ title: "Error", description: "Failed to save design", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addLayer = (layer: Omit<Layer, "id">) => {
    const newLayer: Layer = { ...layer, id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` } as Layer;
    setCanvasData(prev => ({ ...prev, layers: [...(prev.layers || []), newLayer] }));
    setSelectedLayerIds([newLayer.id]);
    sendCollaborationEvent({ type: "layer_add", data: newLayer });
  };

  const updateLayer = (layerId: string, updates: Partial<Layer>) => {
    setCanvasData(prev => ({ ...prev, layers: (prev.layers || []).map(l => l.id === layerId ? { ...l, ...updates } : l) }));
    sendCollaborationEvent({ type: "layer_update", data: { layerId, updates } });
  };

  const deleteLayer = (layerId: string) => {
    const layers = canvasData.layers || [];
    const layerToDelete = layers.find(l => l.id === layerId);
    if (!layerToDelete) return;

    let layersToDelete = [layerId];
    if (layerToDelete.type === "group" && layerToDelete.properties?.children) {
      layersToDelete = [...layersToDelete, ...layerToDelete.properties.children];
    }

    const updatedLayers = layers.filter(l => !layersToDelete.includes(l.id)).map(l => {
      if (l.properties?.children?.includes(layerId)) {
        return { ...l, properties: { ...l.properties, children: l.properties.children.filter(id => id !== layerId) } };
      }
      return l;
    });

    setCanvasData(prev => ({ ...prev, layers: updatedLayers }));
    if (selectedLayerIds.includes(layerId)) setSelectedLayerIds([]);
    sendCollaborationEvent({ type: "layer_delete", data: { layerId } });
  };

  const computeBBox = (layers: Layer[]) => {
    const minX = Math.min(...layers.map(l => l.x));
    const minY = Math.min(...layers.map(l => l.y));
    const maxX = Math.max(...layers.map(l => l.x + l.width));
    const maxY = Math.max(...layers.map(l => l.y + l.height));
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  };

  const groupSelectedLayers = (ids: string[]) => {
    if ((ids?.length || 0) < 2) return;
    const layers = canvasData.layers || [];
    const selectedLayers = layers.filter(l => ids.includes(l.id) && !l.parentId);
    if (selectedLayers.length < 2) return;

    const bbox = computeBBox(selectedLayers);
    const newGroupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newGroup: Layer = {
      id: newGroupId,
      type: 'group',
      name: 'Group',
      x: bbox.x,
      y: bbox.y,
      width: bbox.width,
      height: bbox.height,
      visible: true,
      locked: false,
      opacity: 1,
      rotation: 0,
      properties: { children: selectedLayers.map(l => l.id) },
    } as Layer;

    const updatedLayers: Layer[] = layers.map(l => {
      if (ids.includes(l.id)) {
        return { ...l, parentId: newGroupId, x: l.x - bbox.x, y: l.y - bbox.y };
        }
      return l;
    });

    updatedLayers.unshift(newGroup);

    setCanvasData(prev => ({ ...prev, layers: updatedLayers }));
    setSelectedLayerIds([newGroupId]);
    toast({ title: "Grouped", description: `${selectedLayers.length} layers grouped.` });
    sendCollaborationEvent({ type: "group", data: { groupId: newGroupId, children: newGroup.properties.children } });
  };

  const ungroupLayer = (groupId: string) => {
    const layers = canvasData.layers || [];
    const group = layers.find(l => l.id === groupId);
    if (!group || group.type !== 'group' || !group.properties?.children) return;

    const childIds = group.properties.children;
    const updatedLayers = layers
      .filter(l => l.id !== groupId)
      .map(l => {
        if (childIds.includes(l.id)) {
          return { ...l, x: l.x + group.x, y: l.y + group.y, parentId: undefined };
        }
        return l;
      });

    setCanvasData(prev => ({ ...prev, layers: updatedLayers }));
    setSelectedLayerIds([]);
    toast({ title: "Ungrouped", description: "Layers have been ungrouped." });
    sendCollaborationEvent({ type: "ungroup", data: { groupId } });
  };

  const handleDuplicateFile = async () => {
    if (!designFile) return;
    try {
      await backend.design.duplicateDesignFile({ id: designFile.id });
      toast({ title: "Success", description: "Design file duplicated" });
    } catch (error) {
      console.error("Failed to duplicate file:", error);
      toast({ title: "Error", description: "Failed to duplicate file", variant: "destructive" });
    }
  };

  const handleAIRefine = (refinedCanvasData: CanvasData, description: string) => {
    setCanvasData(refinedCanvasData);
    toast({ title: "AI Refinement Applied", description: description });
  };

  const selectedLayer = selectedLayerIds[0] && canvasData.layers ? canvasData.layers.find(l => l.id === selectedLayerIds[0]) : null;

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (error || !designFile) return <div className="flex items-center justify-center h-screen">{error || "Design not found"}</div>;

  const showUngroup = selectedLayer && selectedLayer.type === 'group' && selectedLayerIds.length === 1;
  const canGroup = selectedLayerIds.length >= 2;

  return (
    <div className={`flex flex-col h-screen bg-neutral-50 dark:bg-neutral-950 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <div className="glass dark:glass-dark border-b border-neutral-200/50 dark:border-neutral-800/50 shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-4">
            <Link to="/"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button></Link>
            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700"></div>
            <h2 className="font-semibold text-lg">{designFile.name}</h2>
          </div>

          <div className="flex items-center space-x-1 bg-white dark:bg-neutral-800 rounded-xl p-1 shadow-sm border">
            <Button variant={activeTool === "select" ? "secondary" : "ghost"} size="sm" onClick={() => setActiveTool("select")} title="Select (V)"><MousePointer className="h-4 w-4" /></Button>
            <Button variant={activeTool === "pan" ? "secondary" : "ghost"} size="sm" onClick={() => setActiveTool("pan")} title="Pan (Space)"><Hand className="h-4 w-4" /></Button>
            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700 mx-1"></div>
            <Button variant={activeTool === "rectangle" ? "secondary" : "ghost"} size="sm" onClick={() => setActiveTool("rectangle")} title="Rectangle (R)"><Square className="h-4 w-4" /></Button>
            <Button variant={activeTool === "circle" ? "secondary" : "ghost"} size="sm" onClick={() => setActiveTool("circle")} title="Circle (O)"><Circle className="h-4 w-4" /></Button>
            <Button variant={activeTool === "text" ? "secondary" : "ghost"} size="sm" onClick={() => setActiveTool("text")} title="Text (T)"><Type className="h-4 w-4" /></Button>
            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700 mx-1"></div>
            {showUngroup ? (
              <Button variant="ghost" size="sm" onClick={() => ungroupLayer(selectedLayer!.id)} title="Ungroup (Cmd+Shift+G)"><UngroupIcon className="h-4 w-4" /></Button>
            ) : (
              <Button variant={canGroup ? "ghost" : "ghost"} size="sm" onClick={() => canGroup ? groupSelectedLayers(selectedLayerIds) : toast({ title: "Group", description: "Select multiple layers to group." })} title={canGroup ? "Group (Cmd+G)" : "Select multiple layers to group"} disabled={!canGroup}><GroupIcon className="h-4 w-4" /></Button>
            )}
            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700 mx-1"></div>
            <Button variant="ghost" size="sm" onClick={() => setShowAIRefine(true)} title="AI Refine"><Sparkles className="h-4 w-4" /></Button>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center -space-x-2">
              {collaborators.map(c => <div key={c.user_id} className="w-8 h-8 rounded-full border-2 border-white" style={{ backgroundColor: c.color }}></div>)}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowComments(true)}><MessageCircle className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => setShowVersionHistory(true)}><Clock className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}><Download className="h-4 w-4 mr-2" />Export</Button>
            <Button size="sm" onClick={() => saveDesignFile()} disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? "Saving..." : "Save"}</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDuplicateFile}><Copy className="h-4 w-4 mr-2" />Duplicate File</DropdownMenuItem>
                <DropdownMenuItem onClick={() => saveDesignFile(true)}><Save className="h-4 w-4 mr-2" />Save Version</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsFullscreen(!isFullscreen)}><Maximize2 className="h-4 w-4 mr-2" />{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowKeyboardShortcuts(true)}><Keyboard className="h-4 w-4 mr-2" />Keyboard Shortcuts</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-72 glass dark:glass-dark border-r overflow-y-auto">
          <div className="p-4 border-b"><h3 className="font-semibold flex items-center"><Layers className="h-4 w-4 mr-2" />Layers</h3></div>
          <LayerPanel layers={canvasData.layers} selectedLayerId={selectedLayerIds[0] || null} onLayerSelect={(id) => setSelectedLayerIds([id])} onLayerUpdate={updateLayer} onLayerDelete={deleteLayer} onLayerDuplicate={(id) => {
            // keep behavior for first selection
            const layer = canvasData.layers.find(l => l.id === id);
            if (!layer) return;
            addLayer({ ...layer, name: `${layer.name} Copy`, x: layer.x + 10, y: layer.y + 10 });
          }} onUngroupLayer={ungroupLayer} />
        </div>

        <div className="flex-1 relative bg-neutral-100 dark:bg-neutral-900" onMouseMove={handleMouseMove}>
          <Canvas canvasData={canvasData} selectedLayerIds={selectedLayerIds} activeTool={activeTool} onLayerSelect={setSelectedLayerIds} onLayerAdd={addLayer} onLayerUpdate={updateLayer} onViewportChange={(viewport) => setCanvasData(prev => ({ ...prev, viewport }))} />
          <CollaborationCursors cursors={collaborators} />
        </div>

        <div className="w-72 glass dark:glass-dark border-l overflow-y-auto">
          <div className="p-4 border-b"><h3 className="font-semibold flex items-center"><Settings className="h-4 w-4 mr-2" />Properties</h3></div>
          <PropertiesPanel selectedLayer={selectedLayer || null} onLayerUpdate={(updates) => selectedLayer && updateLayer(selectedLayer.id, updates)} />
        </div>
      </div>

      {designId && (
        <>
          <VersionHistory designFileId={parseInt(designId)} isOpen={showVersionHistory} onClose={() => setShowVersionHistory(false)} onVersionRestored={loadDesignFile} />
          <ExportDialog designFileId={parseInt(designId)} designFileName={designFile.name} isOpen={showExportDialog} onClose={() => setShowExportDialog(false)} />
          <CommentsPanel designFileId={parseInt(designId)} isOpen={showComments} onClose={() => setShowComments(false)} />
          <AIRefineDialog isOpen={showAIRefine} onClose={() => setShowAIRefine(false)} onDesignRefined={handleAIRefine} currentCanvasData={canvasData} selectedLayerId={selectedLayerIds[0] || null} />
        </>
      )}
      <KeyboardShortcuts isOpen={showKeyboardShortcuts} onClose={() => setShowKeyboardShortcuts(false)} />
    </div>
  );
}
