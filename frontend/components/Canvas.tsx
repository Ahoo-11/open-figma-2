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

  useImperativeHandle(ref, () => canvasRef.current!);

  const draw = useCallback(() => {
    try {
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
      layers.forEach(layer => {
        if (layer && layer.visible !== false) {
          drawLayer(ctx, layer, layer.id === selectedLayerId);
        }
      });

      ctx.restore();
    } catch (error) {
      console.error("Error drawing canvas:", error);
    }
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
    try {
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
    } catch (error) {
      console.error("Error drawing grid:", error);
    }
  };

  const drawLayer = (ctx: CanvasRenderingContext2D, layer: Layer, isSelected: boolean) => {
    try {
      if (!layer || !layer.properties) return;

      ctx.save();
      ctx.globalAlpha = layer.opacity || 1;

      switch (layer.type) {
        case "rectangle":
          ctx.fillStyle = layer.properties.fill || "#000000";
          if (layer.properties.cornerRadius) {
            drawRoundedRect(ctx, layer.x, layer.y, layer.width, layer.height, layer.properties.cornerRadius);
          } else {
            ctx.fillRect(layer.x, layer.y, layer.width, layer.height);
          }
          
          if (layer.properties.stroke && layer.properties.strokeWidth) {
            ctx.strokeStyle = layer.properties.stroke;
            ctx.lineWidth = layer.properties.strokeWidth;
            if (layer.properties.cornerRadius) {
              drawRoundedRect(ctx, layer.x, layer.y, layer.width, layer.height, layer.properties.cornerRadius);
              ctx.stroke();
            } else {
              ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);
            }
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
          ctx.fillStyle = layer.properties.fill || "#000000";
          ctx.font = `${layer.properties.fontWeight || "normal"} ${layer.properties.fontSize || 16}px ${layer.properties.fontFamily || "Arial"}`;
          ctx.textAlign = (layer.properties.textAlign as CanvasTextAlign) || "left";
          ctx.fillText(layer.properties.text || "", layer.x, layer.y + (layer.properties.fontSize || 16));
          break;
      }

      // Draw selection outline
      if (isSelected) {
        const viewport = canvasData?.viewport || { x: 0, y: 0, zoom: 1 };
        ctx.strokeStyle = "#007AFF";
        ctx.lineWidth = 2 / viewport.zoom;
        ctx.setLineDash([5 / viewport.zoom, 5 / viewport.zoom]);
        ctx.strokeRect(layer.x - 2 / viewport.zoom, layer.y - 2 / viewport.zoom, layer.width + 4 / viewport.zoom, layer.height + 4 / viewport.zoom);
        ctx.setLineDash([]);
      }

      ctx.restore();
    } catch (error) {
      console.error("Error drawing layer:", error);
    }
  };

  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    try {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + width, y, x + width, y + height, radius);
      ctx.arcTo(x + width, y + height, x, y + height, radius);
      ctx.arcTo(x, y + height, x, y, radius);
      ctx.arcTo(x, y, x + width, y, radius);
      ctx.closePath();
      ctx.fill();
    } catch (error) {
      console.error("Error drawing rounded rect:", error);
    }
  };

  const getMousePosition = (e: React.MouseEvent) => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const viewport = canvasData?.viewport || { x: 0, y: 0, zoom: 1 };
      
      const x = (e.clientX - rect.left - viewport.x) / viewport.zoom;
      const y = (e.clientY - rect.top - viewport.y) / viewport.zoom;
      
      return { x, y };
    } catch (error) {
      console.error("Error getting mouse position:", error);
      return { x: 0, y: 0 };
    }
  };

  const getLayerAt = (x: number, y: number): Layer | null => {
    try {
      const layers = canvasData?.layers || [];
      
      // Check layers in reverse order (top to bottom)
      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i];
        if (!layer || layer.visible === false || layer.locked) continue;

        if (layer.type === "circle") {
          const centerX = layer.x + layer.width / 2;
          const centerY = layer.y + layer.height / 2;
          const radius = Math.min(layer.width, layer.height) / 2;
          const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
          if (distance <= radius) {
            return layer;
          }
        } else {
          if (x >= layer.x && x <= layer.x + layer.width &&
              y >= layer.y && y <= layer.y + layer.height) {
            return layer;
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Error getting layer at position:", error);
      return null;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    try {
      const pos = getMousePosition(e);
      const rawPos = { x: e.clientX, y: e.clientY };
      setDragStart(pos);
      setLastPanPoint(rawPos);

      if (e.button === 1 || (e.button === 0 && e.spaceKey)) { // Middle mouse or space+click
        setIsPanning(true);
        return;
      }

      if (activeTool === "select") {
        const layer = getLayerAt(pos.x, pos.y);
        if (layer) {
          onLayerSelect(layer.id);
          setIsDragging(true);
        } else {
          onLayerSelect(null);
        }
      } else if (activeTool === "pan") {
        setIsPanning(true);
      } else if (activeTool === "rectangle" || activeTool === "circle" || activeTool === "text") {
        setIsDrawing(true);
        setDrawStart(pos);
      }
    } catch (error) {
      console.error("Error handling mouse down:", error);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    try {
      const pos = getMousePosition(e);
      const rawPos = { x: e.clientX, y: e.clientY };

      if (isPanning) {
        const dx = rawPos.x - lastPanPoint.x;
        const dy = rawPos.y - lastPanPoint.y;
        
        const viewport = canvasData?.viewport || { x: 0, y: 0, zoom: 1 };
        onViewportChange({
          ...viewport,
          x: viewport.x + dx,
          y: viewport.y + dy,
        });
        
        setLastPanPoint(rawPos);
      } else if (isDragging && activeTool === "select" && selectedLayerId) {
        const dx = pos.x - dragStart.x;
        const dy = pos.y - dragStart.y;
        
        const layers = canvasData?.layers || [];
        const currentLayer = layers.find(l => l.id === selectedLayerId);
        if (currentLayer) {
          onLayerUpdate(selectedLayerId, {
            x: currentLayer.x + dx,
            y: currentLayer.y + dy,
          });
        }
        
        setDragStart(pos);
      }

      draw();
    } catch (error) {
      console.error("Error handling mouse move:", error);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    try {
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
      setIsPanning(false);
    } catch (error) {
      console.error("Error handling mouse up:", error);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    try {
      e.preventDefault();
      
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const viewport = canvasData?.viewport || { x: 0, y: 0, zoom: 1 };
      const newZoom = Math.max(0.1, Math.min(5, viewport.zoom * delta));
      
      // Zoom towards mouse position
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const zoomFactor = newZoom / viewport.zoom;
        const newX = mouseX - (mouseX - viewport.x) * zoomFactor;
        const newY = mouseY - (mouseY - viewport.y) * zoomFactor;
        
        onViewportChange({
          x: newX,
          y: newY,
          zoom: newZoom,
        });
      }
    } catch (error) {
      console.error("Error handling wheel:", error);
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
