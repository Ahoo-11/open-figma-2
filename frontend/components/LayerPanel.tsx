import React from "react";
import { Eye, EyeOff, Lock, Unlock, Trash2, Square, Circle, Type, Folder, Copy, Group, Ungroup } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Layer } from "~backend/design/types";

interface LayerPanelProps {
  layers?: Layer[];
  selectedLayerId: string | null;
  onLayerSelect: (layerId: string) => void;
  onLayerUpdate: (layerId: string, updates: Partial<Layer>) => void;
  onLayerDelete: (layerId: string) => void;
  onLayerDuplicate?: (layerId: string) => void;
  onGroupLayers?: (layerIds: string[]) => void;
  onUngroupLayer?: (groupId: string) => void;
}

export function LayerPanel({
  layers = [],
  selectedLayerId,
  onLayerSelect,
  onLayerUpdate,
  onLayerDelete,
  onLayerDuplicate,
  onGroupLayers,
  onUngroupLayer,
}: LayerPanelProps) {
  const getLayerIcon = (type: Layer["type"]) => {
    switch (type) {
      case "rectangle":
        return <Square className="h-4 w-4" />;
      case "circle":
        return <Circle className="h-4 w-4" />;
      case "text":
      case "container":
        return <Type className="h-4 w-4" />;
      case "group":
        return <Folder className="h-4 w-4" />;
      default:
        return <Square className="h-4 w-4" />;
    }
  };

  const renderLayer = (layer: Layer, level = 0) => {
    const isGroup = layer.type === "group";
    const hasChildren = layer.properties?.children && layer.properties.children.length > 0;
    
    return (
      <div key={layer.id} className="relative">
        <div
          className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
            selectedLayerId === layer.id
              ? "bg-blue-100 dark:bg-blue-900"
              : ""
          }`}
          style={{ marginLeft: level * 16 }}
          onClick={() => onLayerSelect(layer.id)}
        >
          <div className="flex-shrink-0 text-gray-600 dark:text-gray-400">
            {getLayerIcon(layer.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {layer.name || 'Unnamed Layer'}
              </p>
              {isGroup && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                  Group
                </span>
              )}
              {layer.type === "container" && (
                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded">
                  Text
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onLayerUpdate(layer.id, { visible: !layer.visible });
              }}
            >
              {layer.visible !== false ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3 text-gray-400" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onLayerUpdate(layer.id, { locked: !layer.locked });
              }}
            >
              {layer.locked ? (
                <Lock className="h-3 w-3 text-gray-400" />
              ) : (
                <Unlock className="h-3 w-3" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <span className="text-xs">⋯</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onLayerDuplicate && (
                  <DropdownMenuItem onClick={() => onLayerDuplicate(layer.id)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                )}
                {isGroup && onUngroupLayer && (
                  <DropdownMenuItem onClick={() => onUngroupLayer(layer.id)}>
                    <Ungroup className="h-4 w-4 mr-2" />
                    Ungroup
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => onLayerDelete(layer.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Render children if this is a group */}
        {hasChildren && (
          <div className="ml-4">
            {layer.properties!.children!.map(childId => {
              const childLayer = layers.find(l => l.id === childId);
              return childLayer ? renderLayer(childLayer, level + 1) : null;
            })}
          </div>
        )}
      </div>
    );
  };

  if (!Array.isArray(layers)) {
    return (
      <div className="p-2">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Square className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">Loading layers...</p>
        </div>
      </div>
    );
  }

  // Only render root level layers (those without parentId)
  const rootLayers = layers.filter(layer => !layer.parentId);

  return (
    <div className="p-2">
      {rootLayers.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Square className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">No layers yet</p>
          <p className="text-xs">Create shapes to see them here</p>
        </div>
      ) : (
        <div className="space-y-1">
          {rootLayers.map((layer) => renderLayer(layer))}
        </div>
      )}
    </div>
  );
}
