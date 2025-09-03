import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
    onLayerUpdate({ properties: { ...(selectedLayer.properties || {}), [key]: value } });
  };

  const updateBasicProperty = (key: keyof Layer, value: any) => {
    onLayerUpdate({ [key]: value });
  };

  const safeValue = (value: any, fallback: any) => value !== undefined && value !== null ? value : fallback;

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-3">
        <h4 className="font-medium">Basic</h4>
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={safeValue(selectedLayer.name, "")} onChange={(e) => updateBasicProperty("name", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label htmlFor="x">X</Label><Input id="x" type="number" value={safeValue(selectedLayer.x, 0)} onChange={(e) => updateBasicProperty("x", parseFloat(e.target.value) || 0)} /></div>
          <div><Label htmlFor="y">Y</Label><Input id="y" type="number" value={safeValue(selectedLayer.y, 0)} onChange={(e) => updateBasicProperty("y", parseFloat(e.target.value) || 0)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label htmlFor="width">Width</Label><Input id="width" type="number" value={safeValue(selectedLayer.width, 0)} onChange={(e) => updateBasicProperty("width", parseFloat(e.target.value) || 0)} /></div>
          <div><Label htmlFor="height">Height</Label><Input id="height" type="number" value={safeValue(selectedLayer.height, 0)} onChange={(e) => updateBasicProperty("height", parseFloat(e.target.value) || 0)} /></div>
        </div>
        <div>
          <Label htmlFor="opacity">Opacity</Label>
          <Slider value={[safeValue(selectedLayer.opacity, 1) * 100]} onValueChange={([v]) => updateBasicProperty("opacity", v / 100)} />
        </div>
        <div>
          <Label htmlFor="rotation">Rotation</Label>
          <Slider value={[safeValue(selectedLayer.rotation, 0)]} onValueChange={([v]) => updateBasicProperty("rotation", v)} min={-180} max={180} />
        </div>
      </div>

      {selectedLayer.type === "group" && (
        <div className="space-y-3"><h4 className="font-medium">Group</h4><p className="text-sm text-gray-500">Contains {selectedLayer.properties?.children?.length || 0} layers.</p></div>
      )}

      {(selectedLayer.type === "rectangle" || selectedLayer.type === "circle" || selectedLayer.type === "container") && (
        <div className="space-y-3">
          <h4 className="font-medium">Appearance</h4>
          <div><Label htmlFor="fill">Fill</Label><Input id="fill" type="color" value={safeValue(selectedLayer.properties?.fill, "#000000")} onChange={(e) => updateProperty("fill", e.target.value)} /></div>
          <div><Label htmlFor="stroke">Stroke</Label><Input id="stroke" type="color" value={safeValue(selectedLayer.properties?.stroke, "#000000")} onChange={(e) => updateProperty("stroke", e.target.value)} /></div>
          <div><Label htmlFor="strokeWidth">Stroke Width</Label><Input id="strokeWidth" type="number" min="0" value={safeValue(selectedLayer.properties?.strokeWidth, 1)} onChange={(e) => updateProperty("strokeWidth", parseFloat(e.target.value) || 0)} /></div>
          {(selectedLayer.type === "rectangle" || selectedLayer.type === "container") && (
            <div><Label htmlFor="cornerRadius">Corner Radius</Label><Input id="cornerRadius" type="number" min="0" value={safeValue(selectedLayer.properties?.cornerRadius, 0)} onChange={(e) => updateProperty("cornerRadius", parseFloat(e.target.value) || 0)} /></div>
          )}
        </div>
      )}

      {(selectedLayer.type === "text" || selectedLayer.type === "container") && (
        <div className="space-y-3">
          <h4 className="font-medium">Text</h4>
          <div><Label htmlFor="text">Content</Label><Textarea id="text" value={safeValue(selectedLayer.properties?.text, "")} onChange={(e) => updateProperty("text", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label htmlFor="fontSize">Size</Label><Input id="fontSize" type="number" min="1" value={safeValue(selectedLayer.properties?.fontSize, 16)} onChange={(e) => updateProperty("fontSize", parseFloat(e.target.value) || 16)} /></div>
            <div><Label htmlFor="lineHeight">Line Height</Label><Input id="lineHeight" type="number" min="1" step="0.1" value={safeValue(selectedLayer.properties?.lineHeight, 1.4)} onChange={(e) => updateProperty("lineHeight", parseFloat(e.target.value) || 1.4)} /></div>
          </div>
          <div>
            <Label htmlFor="fontFamily">Font</Label>
            <Select value={safeValue(selectedLayer.properties?.fontFamily, "Arial")} onValueChange={(v) => updateProperty("fontFamily", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Arial">Arial</SelectItem><SelectItem value="Inter">Inter</SelectItem><SelectItem value="Roboto">Roboto</SelectItem></SelectContent></Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label htmlFor="fontWeight">Weight</Label><Select value={safeValue(selectedLayer.properties?.fontWeight, "normal")} onValueChange={(v) => updateProperty("fontWeight", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="bold">Bold</SelectItem></SelectContent></Select></div>
            <div><Label htmlFor="textAlign">Align</Label><Select value={safeValue(selectedLayer.properties?.textAlign, "left")} onValueChange={(v) => updateProperty("textAlign", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="center">Center</SelectItem><SelectItem value="right">Right</SelectItem></SelectContent></Select></div>
          </div>
          <div><Label htmlFor="verticalAlign">Vertical Align</Label><Select value={safeValue(selectedLayer.properties?.verticalAlign, "top")} onValueChange={(v) => updateProperty("verticalAlign", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="top">Top</SelectItem><SelectItem value="middle">Middle</SelectItem><SelectItem value="bottom">Bottom</SelectItem></SelectContent></Select></div>
          <div><Label htmlFor="padding">Padding</Label><Input id="padding" type="number" min="0" value={safeValue(selectedLayer.properties?.padding, 8)} onChange={(e) => updateProperty("padding", parseFloat(e.target.value) || 0)} /></div>
          <div className="flex items-center space-x-2"><Checkbox id="wordWrap" checked={safeValue(selectedLayer.properties?.wordWrap, true)} onCheckedChange={(c) => updateProperty("wordWrap", c)} /><Label htmlFor="wordWrap">Word Wrap</Label></div>
        </div>
      )}
    </div>
  );
}
