import React, { useRef, useEffect, useState, useCallback } from "react";
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
}

export function Canvas({
  canvasData,
  selectedLayerId,
  activeTool,
  onLayerSelect,
  onLayerAdd,
  onLayerUpdate,
  onViewportChange,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { viewport } = canvasData;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Apply viewport transform
    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    // Draw grid
    drawGrid(ctx, rect.width, rect.height, viewport);

    // Draw layers
    canvasData.layers.forEach(layer => {
      if (layer.visible) {
        drawLayer(ctx, layer, layer.id === selectedLayerId);
      }
    });

    ctx.restore();
  }, [canvasData, selectedLayerId]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, viewport: any) => {
    const gridSize = 20 * viewport.zoom;
    if (gridSize < 5) return;

    ctx.strokeStyle = "#f0f0f0";
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;

    const startX = Math.floor(-viewport.x / gridSize) * gridSize;
    const startY = Math.floor(-viewport.y / gridSize) * gridSize;

    for (let x = startX; x < width - viewport.x; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, -viewport.y);
      ctx.lineTo(x, height - viewport.y);
      ctx.stroke();
    }

    for (let y = startY; y < height - viewport.y; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(-viewport.x, y);
      ctx.lineTo(width - viewport.x, y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  };

  const drawLayer = (ctx: CanvasRenderingContext2D, layer: Layer, isSelected: boolean) => {
    ctx.save();
    ctx.globalAlpha = layer.opacity;

    switch (layer.type) {
      case "rectangle":
        ctx.fillStyle = layer.properties.fill || "#000000";
        if (layer.properties.cornerRadius) {
          drawRoundedRect(ctx, layer.x, layer.y, layer.width, layer.height, layer.properties.cornerRadius);
        } else {
          ctx.fillRect(layer.x, layer.y, layer.width, layer.height);
        }
        
        if (layer.properties.stroke) {
          ctx.strokeStyle = layer.properties.stroke;
          ctx.lineWidth = layer.properties.strokeWidth || 1;
          ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);
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
        
        if (layer.properties.stroke) {
          ctx.strokeStyle = layer.properties.stroke;
          ctx.lineWidth = layer.properties.strokeWidth || 1;
          ctx.stroke();
        }
        break;

      case "text":
        ctx.fillStyle = layer.properties.fill || "#000000";
        ctx.font = `${layer.properties.fontWeight || "normal"} ${layer.properties.fontSize || 16}px ${layer.properties.fontFamily || "Arial"}`;
        ctx.textAlign = (layer.properties.textAlign as CanvasTextAlign) || "left";
        ctx.fillText(layer.properties.text || "", layer.x, layer.y + (layer.properties.fontSize || 16));
        break;
    }

    // Draw selection outline
    if (isSelected) {
      ctx.strokeStyle = "#007AFF";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(layer.x - 2, layer.y - 2, layer.width + 4, layer.height + 4);
      ctx.setLineDash([]);
    }

    ctx.restore();
  };

  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
    ctx.fill();
  };

  const getMousePosition = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const { viewport } = canvasData;
    
    const x = (e.clientX - rect.left - viewport.x) / viewport.zoom;
    const y = (e.clientY - rect.top - viewport.y) / viewport.zoom;
    
    return { x, y };
  };

  const getLayerAt = (x: number, y: number): Layer | null => {
    // Check layers in reverse order (top to bottom)
    for (let i = canvasData.layers.length - 1; i >= 0; i--) {
      const layer = canvasData.layers[i];
      if (!layer.visible || layer.locked) continue;

      if (x >= layer.x && x <= layer.x + layer.width &&
          y >= layer.y && y <= layer.y + layer.height) {
        return layer;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePosition(e);
    setDragStart(pos);

    if (activeTool === "select") {
      const layer = getLayerAt(pos.x, pos.y);
      if (layer) {
        onLayerSelect(layer.id);
        setIsDragging(true);
      } else {
        onLayerSelect(null);
      }
    } else if (activeTool === "pan") {
      setIsDragging(true);
    } else if (activeTool === "rectangle" || activeTool === "circle" || activeTool === "text") {
      setIsDrawing(true);
      setDrawStart(pos);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePosition(e);

    if (isDragging && activeTool === "select" && selectedLayerId) {
      const dx = pos.x - dragStart.x;
      const dy = pos.y - dragStart.y;
      
      onLayerUpdate(selectedLayerId, {
        x: canvasData.layers.find(l => l.id === selectedLayerId)!.x + dx,
        y: canvasData.layers.find(l => l.id === selectedLayerId)!.y + dy,
      });
      
      setDragStart(pos);
    } else if (isDragging && activeTool === "pan") {
      const dx = (pos.x - dragStart.x) * canvasData.viewport.zoom;
      const dy = (pos.y - dragStart.y) * canvasData.viewport.zoom;
      
      onViewportChange({
        ...canvasData.viewport,
        x: canvasData.viewport.x + dx,
        y: canvasData.viewport.y + dy,
      });
    }

    draw();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const pos = getMousePosition(e);

    if (isDrawing) {
      const width = Math.abs(pos.x - drawStart.x);
      const height = Math.abs(pos.y - drawStart.y);
      
      if (width > 5 && height > 5) {
        const x = Math.min(pos.x, drawStart.x);
        const y = Math.min(pos.y, drawStart.y);

        if (activeTool === "rectangle") {
          onLayerAdd({
            type: "rectangle",
            name: "Rectangle",
            x,
            y,
            width,
            height,
            visible: true,
            locked: false,
            opacity: 1,
            properties: {
              fill: "#3B82F6",
              stroke: "#1E40AF",
              strokeWidth: 1,
            },
          });
        } else if (activeTool === "circle") {
          onLayerAdd({
            type: "circle",
            name: "Circle",
            x,
            y,
            width,
            height,
            visible: true,
            locked: false,
            opacity: 1,
            properties: {
              fill: "#EF4444",
              stroke: "#DC2626",
              strokeWidth: 1,
            },
          });
        } else if (activeTool === "text") {
          onLayerAdd({
            type: "text",
            name: "Text",
            x: drawStart.x,
            y: drawStart.y,
            width: 100,
            height: 24,
            visible: true,
            locked: false,
            opacity: 1,
            properties: {
              text: "Text",
              fontSize: 16,
              fontFamily: "Arial",
              fontWeight: "normal",
              fill: "#000000",
              textAlign: "left",
            },
          });
        }
      }
      setIsDrawing(false);
    }

    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, canvasData.viewport.zoom * delta));
    
    onViewportChange({
      ...canvasData.viewport,
      zoom: newZoom,
    });
  };

  return (
    <div className="w-full h-full overflow-hidden bg-gray-100 dark:bg-gray-800">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{
          cursor: activeTool === "pan" ? "grab" : activeTool === "select" ? "default" : "crosshair"
        }}
      />
    </div>
  );
}
