import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import type { CanvasData, Layer } from "~backend/design/types";
import type { Tool } from "./DesignEditor";

interface CanvasProps {
  canvasData: CanvasData;
  selectedLayerId: string | null;
  activeTool: Tool;
  onLayerSelect: (layerId: string | null) => void;
  onLayerAdd: (layer: Omit<Layer, "id">) => void;
  onLayerUpdate: (layerId: string, updates: Partial<Layer>) => void;
  onViewportChange: (viewport: { x: number; y: number; zoom: number }) => void;
  onGroupLayers?: (layerIds: string[]) => void;
  onUngroupLayer?: (groupId: string) => void;
}

export const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>(({
  canvasData,
  selectedLayerId,
  activeTool,
  onLayerSelect,
  onLayerAdd,
  onLayerUpdate,
  onViewportChange,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [previewLayer, setPreviewLayer] = useState<Layer | null>(null);

  useImperativeHandle(ref, () => canvasRef.current!);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const viewport = canvasData?.viewport || { x: 0, y: 0, zoom: 1 };
    const layers = canvasData?.layers || [];
    
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.fillStyle = "#F9FAFB"; // A light grey background
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    drawGrid(ctx, rect.width / viewport.zoom, rect.height / viewport.zoom, viewport);

    const rootLayers = layers.filter(layer => !layer.parentId);
    rootLayers.forEach(layer => {
      drawLayerRecursive(ctx, layer, layers, selectedLayerId);
    });

    if (previewLayer) {
      drawLayer(ctx, previewLayer, false);
    }

    ctx.restore();
  }, [canvasData, selectedLayerId, previewLayer]);

  useEffect(() => {
    draw();
  }, [draw]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, viewport: any) => {
    const gridSize = 20;
    ctx.strokeStyle = "#E5E7EB";
    ctx.lineWidth = 1 / viewport.zoom;
    
    const offsetX = viewport.x % gridSize;
    const offsetY = viewport.y % gridSize;

    for (let x = -offsetX; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, -offsetY);
      ctx.lineTo(x, height - offsetY);
      ctx.stroke();
    }

    for (let y = -offsetY; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(-offsetX, y);
      ctx.lineTo(width - offsetX, y);
      ctx.stroke();
    }
  };

  const drawLayerRecursive = (ctx: CanvasRenderingContext2D, layer: Layer, allLayers: Layer[], currentSelectedId: string | null) => {
    if (!layer || layer.visible === false) return;

    ctx.save();
    
    ctx.translate(layer.x, layer.y);
    if (layer.rotation) {
      const centerX = layer.width / 2;
      const centerY = layer.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    const isSelected = layer.id === currentSelectedId;
    const layerAtOrigin = { ...layer, x: 0, y: 0 };

    if (layer.type !== 'group') {
      drawLayer(ctx, layerAtOrigin, isSelected);
    } else if (isSelected) {
      drawSelectionOutline(ctx, layerAtOrigin);
    }

    if (layer.type === 'group' && layer.properties?.children) {
      layer.properties.children.forEach(childId => {
        const childLayer = allLayers.find(l => l.id === childId);
        if (childLayer) {
          drawLayerRecursive(ctx, childLayer, allLayers, currentSelectedId);
        }
      });
    }

    ctx.restore();
  };

  const drawLayer = (ctx: CanvasRenderingContext2D, layer: Layer, isSelected: boolean) => {
    if (!layer.properties) return;

    ctx.save();
    ctx.globalAlpha = layer.opacity || 1;

    switch (layer.type) {
      case "rectangle":
      case "container":
        ctx.fillStyle = layer.properties.fill || "transparent";
        if (layer.properties.cornerRadius) {
          drawRoundedRect(ctx, layer.x, layer.y, layer.width, layer.height, layer.properties.cornerRadius);
        } else {
          ctx.fillRect(layer.x, layer.y, layer.width, layer.height);
        }
        
        if (layer.properties.stroke && layer.properties.strokeWidth) {
          ctx.strokeStyle = layer.properties.stroke;
          ctx.lineWidth = layer.properties.strokeWidth;
          if (layer.properties.cornerRadius) {
            drawRoundedRect(ctx, layer.x, layer.y, layer.width, layer.height, layer.properties.cornerRadius, true);
          } else {
            ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);
          }
        }

        if ((layer.type === "container" || layer.type === "text") && layer.properties.text) {
          drawTextInContainer(ctx, layer);
        }
        break;

      case "circle":
        const centerX = layer.x + layer.width / 2;
        const centerY = layer.y + layer.height / 2;
        const radius = Math.min(layer.width, layer.height) / 2;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = layer.properties.fill || "#000000";
        ctx.fill();
        
        if (layer.properties.stroke && layer.properties.strokeWidth) {
          ctx.strokeStyle = layer.properties.stroke;
          ctx.lineWidth = layer.properties.strokeWidth;
          ctx.stroke();
        }
        break;

      case "text":
        drawTextInContainer(ctx, layer);
        break;
    }

    if (isSelected) {
      drawSelectionOutline(ctx, layer);
    }

    ctx.restore();
  };

  const drawTextInContainer = (ctx: CanvasRenderingContext2D, layer: Layer) => {
    if (!layer.properties?.text) return;

    const {
      padding = 0,
      fontSize = 16,
      fontFamily = "Arial",
      fontWeight = "normal",
      lineHeight = 1.4,
      textAlign = "left",
      verticalAlign = "top",
      fill = "#000000",
      wordWrap = true,
    } = layer.properties;

    ctx.fillStyle = fill;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    
    const textX = layer.x + padding;
    const textY = layer.y + padding;
    const containerWidth = layer.width - (padding * 2);
    const containerHeight = layer.height - (padding * 2);

    if (wordWrap) {
      const words = layer.properties.text.split(' ');
      let line = '';
      const lines = [];

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > containerWidth && n > 0) {
          lines.push(line);
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      const lineSpacing = fontSize * lineHeight;
      const totalTextHeight = lines.length * lineSpacing - (lineHeight - 1) * fontSize;
      
      let startY;
      switch (verticalAlign) {
        case "middle":
          startY = textY + (containerHeight - totalTextHeight) / 2;
          break;
        case "bottom":
          startY = textY + containerHeight - totalTextHeight;
          break;
        default: // top
          startY = textY;
      }

      for (let i = 0; i < lines.length; i++) {
        const lineY = startY + i * lineSpacing + fontSize / 2;
        let lineX = textX;
        
        ctx.textAlign = textAlign as CanvasTextAlign;
        if (textAlign === "center") {
          lineX = textX + containerWidth / 2;
        } else if (textAlign === "right") {
          lineX = textX + containerWidth;
        }
        
        ctx.textBaseline = "middle";
        ctx.fillText(lines[i], lineX, lineY);
      }
    } else {
      ctx.textAlign = textAlign as CanvasTextAlign;
      ctx.textBaseline = "top";
      ctx.fillText(layer.properties.text, textX, textY);
    }
  };

  const drawSelectionOutline = (ctx: CanvasRenderingContext2D, layer: Layer) => {
    const viewport = canvasData?.viewport || { x: 0, y: 0, zoom: 1 };
    ctx.strokeStyle = "#007AFF";
    ctx.lineWidth = 2 / viewport.zoom;
    ctx.setLineDash([5 / viewport.zoom, 5 / viewport.zoom]);
    ctx.strokeRect(
      layer.x - 2 / viewport.zoom, 
      layer.y - 2 / viewport.zoom, 
      layer.width + 4 / viewport.zoom, 
      layer.height + 4 / viewport.zoom
    );
    ctx.setLineDash([]);
  };

  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, stroke = false) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
    if (stroke) {
      ctx.stroke();
    } else {
      ctx.fill();
    }
  };

  const getMousePosition = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const viewport = canvasData?.viewport || { x: 0, y: 0, zoom: 1 };
    
    const x = (e.clientX - rect.left) / viewport.zoom - viewport.x / viewport.zoom;
    const y = (e.clientY - rect.top) / viewport.zoom - viewport.y / viewport.zoom;
    
    return { x, y };
  };

  const getLayerAt = (x: number, y: number): Layer | null => {
    const layers = canvasData?.layers || [];
    
    const checkLayer = (layer: Layer, parentX: number, parentY: number): Layer | null => {
      const absoluteX = parentX + layer.x;
      const absoluteY = parentY + layer.y;

      if (layer.visible === false || layer.locked) return null;

      if (x >= absoluteX && x <= absoluteX + layer.width &&
          y >= absoluteY && y <= absoluteY + layer.height) {
        
        if (layer.type === 'group' && layer.properties?.children) {
          for (let i = layer.properties.children.length - 1; i >= 0; i--) {
            const childId = layer.properties.children[i];
            const child = layers.find(l => l.id === childId);
            if (child) {
              const found = checkLayer(child, absoluteX, absoluteY);
              if (found) return found;
            }
          }
        }
        return layer;
      }
      return null;
    };

    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (!layer.parentId) {
        const found = checkLayer(layer, 0, 0);
        if (found) return found;
      }
    }
    return null;
  };

  const createPreviewLayer = (tool: Tool, startPos: { x: number; y: number }, currentPos: { x: number; y: number }): Layer => {
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);
    const x = Math.min(currentPos.x, startPos.x);
    const y = Math.min(currentPos.y, startPos.y);

    const baseLayer: Omit<Layer, 'properties' | 'type'> = {
      id: "preview",
      name: "Preview",
      x, y, width, height,
      visible: true, locked: false, opacity: 0.7, rotation: 0,
    };

    switch (tool) {
      case "rectangle":
        return { ...baseLayer, type: "rectangle", properties: { fill: "#3B82F6", stroke: "#1E40AF", strokeWidth: 1 } };
      case "circle":
        return { ...baseLayer, type: "circle", properties: { fill: "#EF4444", stroke: "#DC2626", strokeWidth: 1 } };
      case "text":
        return { ...baseLayer, type: "container", name: "Text Container", properties: { text: "Type something...", fontSize: 16, fontFamily: "Arial", fill: "#000000", padding: 8, wordWrap: true, lineHeight: 1.4, verticalAlign: "top" } };
      default:
        return { ...baseLayer, type: "rectangle", properties: {} };
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePosition(e);
    setDragStart(pos);
    setLastPanPoint({ x: e.clientX, y: e.clientY });

    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      return;
    }

    if (activeTool === "select") {
      const layer = getLayerAt(pos.x, pos.y);
      onLayerSelect(layer ? layer.id : null);
      if (layer) setIsDragging(true);
    } else if (activeTool === "pan") {
      setIsPanning(true);
    } else {
      setIsDrawing(true);
      setDrawStart(pos);
      setPreviewLayer(createPreviewLayer(activeTool, pos, pos));
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePosition(e);

    if (isPanning) {
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;
      const viewport = canvasData?.viewport || { x: 0, y: 0, zoom: 1 };
      onViewportChange({ ...viewport, x: viewport.x + dx, y: viewport.y + dy });
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    } else if (isDragging && selectedLayerId) {
      const dx = pos.x - dragStart.x;
      const dy = pos.y - dragStart.y;
      const currentLayer = canvasData.layers.find(l => l.id === selectedLayerId);
      if (currentLayer) {
        onLayerUpdate(selectedLayerId, { x: currentLayer.x + dx, y: currentLayer.y + dy });
      }
      setDragStart(pos);
    } else if (isDrawing) {
      setPreviewLayer(createPreviewLayer(activeTool, drawStart, pos));
    }
    draw();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDrawing) {
      const pos = getMousePosition(e);
      const width = Math.abs(pos.x - drawStart.x);
      const height = Math.abs(pos.y - drawStart.y);
      if (width > 5 || height > 5) {
        onLayerAdd(createPreviewLayer(activeTool, drawStart, pos));
      }
    }
    setIsDrawing(false);
    setPreviewLayer(null);
    setIsDragging(false);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const viewport = canvasData?.viewport || { x: 0, y: 0, zoom: 1 };
    const newZoom = Math.max(0.1, Math.min(10, viewport.zoom * delta));
    
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const zoomFactor = newZoom / viewport.zoom;
      const newX = mouseX - (mouseX - viewport.x) * zoomFactor;
      const newY = mouseY - (mouseY - viewport.y) * zoomFactor;
      
      onViewportChange({ x: newX, y: newY, zoom: newZoom });
    }
  };

  const getCursorStyle = () => {
    if (isPanning) return "grabbing";
    if (activeTool === "pan") return "grab";
    if (activeTool === "select") return "default";
    return "crosshair";
  };

  return (
    <div className="w-full h-full overflow-hidden bg-gray-100 dark:bg-gray-800">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: getCursorStyle() }}
      />
    </div>
  );
});

Canvas.displayName = "Canvas";
