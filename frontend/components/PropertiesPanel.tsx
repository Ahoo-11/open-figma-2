import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Layer } from "~backend/design/types";

interface PropertiesPanelProps {
  selectedLayer: Layer | null;
  onLayerUpdate: (updates: Partial<Layer>) => void;
}

export function PropertiesPanel({ selectedLayer, onLayerUpdate }: PropertiesPanelProps) {
  if (!selectedLayer) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <p>Select a layer to edit properties</p>
      </div>
    );
  }

  const updateProperty = (key: string, value: any) => {
    try {
      onLayerUpdate({
        properties: {
          ...(selectedLayer.properties || {}),
          [key]: value,
        },
      });
    } catch (error) {
      console.error("Error updating property:", error);
    }
  };

  const updateBasicProperty = (key: keyof Layer, value: any) => {
    try {
      onLayerUpdate({ [key]: value });
    } catch (error) {
      console.error("Error updating basic property:", error);
    }
  };

  const safeValue = (value: any, fallback: any) => {
    return value !== undefined && value !== null ? value : fallback;
  };

  return (
    <div className="p-4 space-y-6">
      {/* Basic Properties */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 dark:text-white">Basic</h4>
        
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={safeValue(selectedLayer.name, "")}
            onChange={(e) => updateBasicProperty("name", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="x">X</Label>
            <Input
              id="x"
              type="number"
              value={safeValue(selectedLayer.x, 0)}
              onChange={(e) => updateBasicProperty("x", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="y">Y</Label>
            <Input
              id="y"
              type="number"
              value={safeValue(selectedLayer.y, 0)}
              onChange={(e) => updateBasicProperty("y", parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="width">Width</Label>
            <Input
              id="width"
              type="number"
              value={safeValue(selectedLayer.width, 0)}
              onChange={(e) => updateBasicProperty("width", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="height">Height</Label>
            <Input
              id="height"
              type="number"
              value={safeValue(selectedLayer.height, 0)}
              onChange={(e) => updateBasicProperty("height", parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="opacity">Opacity</Label>
          <div className="mt-2">
            <Slider
              value={[safeValue(selectedLayer.opacity, 1) * 100]}
              onValueChange={([value]) => updateBasicProperty("opacity", value / 100)}
              max={100}
              step={1}
            />
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {Math.round(safeValue(selectedLayer.opacity, 1) * 100)}%
          </div>
        </div>
      </div>

      {/* Type-specific Properties */}
      {(selectedLayer.type === "rectangle" || selectedLayer.type === "circle") && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-white">Fill & Stroke</h4>
          
          <div>
            <Label htmlFor="fill">Fill Color</Label>
            <Input
              id="fill"
              type="color"
              value={safeValue(selectedLayer.properties?.fill, "#000000")}
              onChange={(e) => updateProperty("fill", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="stroke">Stroke Color</Label>
            <Input
              id="stroke"
              type="color"
              value={safeValue(selectedLayer.properties?.stroke, "#000000")}
              onChange={(e) => updateProperty("stroke", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="strokeWidth">Stroke Width</Label>
            <Input
              id="strokeWidth"
              type="number"
              min="0"
              value={safeValue(selectedLayer.properties?.strokeWidth, 1)}
              onChange={(e) => updateProperty("strokeWidth", parseFloat(e.target.value) || 0)}
            />
          </div>

          {selectedLayer.type === "rectangle" && (
            <div>
              <Label htmlFor="cornerRadius">Corner Radius</Label>
              <Input
                id="cornerRadius"
                type="number"
                min="0"
                value={safeValue(selectedLayer.properties?.cornerRadius, 0)}
                onChange={(e) => updateProperty("cornerRadius", parseFloat(e.target.value) || 0)}
              />
            </div>
          )}
        </div>
      )}

      {selectedLayer.type === "text" && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-white">Typography</h4>
          
          <div>
            <Label htmlFor="text">Text</Label>
            <Input
              id="text"
              value={safeValue(selectedLayer.properties?.text, "")}
              onChange={(e) => updateProperty("text", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="fontSize">Font Size</Label>
            <Input
              id="fontSize"
              type="number"
              min="8"
              value={safeValue(selectedLayer.properties?.fontSize, 16)}
              onChange={(e) => updateProperty("fontSize", parseFloat(e.target.value) || 16)}
            />
          </div>

          <div>
            <Label htmlFor="fontFamily">Font Family</Label>
            <Select
              value={safeValue(selectedLayer.properties?.fontFamily, "Arial")}
              onValueChange={(value) => updateProperty("fontFamily", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Helvetica">Helvetica</SelectItem>
                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                <SelectItem value="Georgia">Georgia</SelectItem>
                <SelectItem value="Verdana">Verdana</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="fontWeight">Font Weight</Label>
            <Select
              value={safeValue(selectedLayer.properties?.fontWeight, "normal")}
              onValueChange={(value) => updateProperty("fontWeight", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
                <SelectItem value="lighter">Lighter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="textAlign">Text Align</Label>
            <Select
              value={safeValue(selectedLayer.properties?.textAlign, "left")}
              onValueChange={(value) => updateProperty("textAlign", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="textFill">Text Color</Label>
            <Input
              id="textFill"
              type="color"
              value={safeValue(selectedLayer.properties?.fill, "#000000")}
              onChange={(e) => updateProperty("fill", e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
