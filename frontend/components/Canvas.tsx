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
  onGroupLayers,
  onUngroupLayer,
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

      // Draw layers (only root level layers, children will be drawn recursively)
      const rootLayers = layers.filter(layer => !layer.parentId);
      rootLayers.forEach(layer => {
        if (layer && layer.visible !== false) {
          drawLayerRecursive(ctx, layer, layers, layer.id === selectedLayerId);
        }
      });

      // Draw preview layer while drawing
      if (previewLayer) {
        drawLayer(ctx, previewLayer, false);
      }

      ctx.restore();
    } catch (error) {
      console.error("Error drawing canvas:", error);
    }
  }, [canvasData, selectedLayerId, previewLayer]);

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

  const drawLayerRecursive = (ctx: CanvasRenderingContext2D, layer: Layer, allLayers: Layer[], isSelected: boolean) => {
    try {
      if (!layer || layer.visible === false) return;

      ctx.save();

      // Apply layer transformations
      const centerX = layer.x + layer.width / 2;
      const centerY = layer.y + layer.height / 2;
      
      if (layer.rotation) {
        ctx.translate(centerX, centerY);
        ctx.rotate((layer.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }

      // Draw the layer itself
      if (layer.type !== "group") {
        drawLayer(ctx, layer, isSelected);
      } else {
        // For groups, just draw selection outline if selected
        if (isSelected) {
          drawSelectionOutline(ctx, layer);
        }
      }

      // Draw children if this is a group or container
      if (layer.properties?.children && Array.isArray(layer.properties.children)) {
        layer.properties.children.forEach(childId => {
          const childLayer = allLayers.find(l => l.id === childId);
          if (childLayer) {
            ctx.save();
            // Translate child coordinates relative to parent
            ctx.translate(layer.x, layer.y);
            
            // Create adjusted child layer with relative coordinates
            const adjustedChild = {
              ...childLayer,
              x: childLayer.x - layer.x,
              y: childLayer.y - layer.y
            };
            
            drawLayerRecursive(ctx, adjustedChild, allLayers, childLayer.id === selectedLayerId);
            ctx.restore();
          }
        });
      }

      ctx.restore();
    } catch (error) {
      console.error("Error drawing layer recursively:", error);
    }
  };

  const drawLayer = (ctx: CanvasRenderingContext2D, layer: Layer, isSelected: boolean) => {
    try {
      if (!layer || !layer.properties) return;

      ctx.save();
      ctx.globalAlpha = layer.opacity || 1;

      switch (layer.type) {
        case "rectangle":
        case "container":
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

          // Draw text content for containers and text layers
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

      // Draw selection outline
      if (isSelected) {
        drawSelectionOutline(ctx, layer);
      }

      ctx.restore();
    } catch (error) {
      console.error("Error drawing layer:", error);
    }
  };

  const drawTextInContainer = (ctx: CanvasRenderingContext2D, layer: Layer) => {
    try {
      if (!layer.properties?.text) return;

      const padding = layer.properties.padding || 0;
      const fontSize = layer.properties.fontSize || 16;
      const fontFamily = layer.properties.fontFamily || "Arial";
      const fontWeight = layer.properties.fontWeight || "normal";
      const lineHeight = layer.properties.lineHeight || 1.4;
      const textAlign = layer.properties.textAlign || "left";
      const verticalAlign = layer.properties.verticalAlign || "top";
      
      ctx.fillStyle = layer.properties.fill || "#000000";
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      
      const containerWidth = layer.width - (padding * 2);
      const containerHeight = layer.height - (padding * 2);
      
      if (layer.properties.wordWrap) {
        // Word wrap text within container
        const words = layer.properties.text.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        
        words.forEach(word => {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > containerWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });
        
        if (currentLine) {
          lines.push(currentLine);
        }
        
        // Calculate vertical positioning
        const lineSpacing = fontSize * lineHeight;
        const totalTextHeight = lines.length * lineSpacing;
        let startY = layer.y + padding + fontSize;
        
        switch (verticalAlign) {
          case "middle":
            startY = layer.y + (layer.height - totalTextHeight) / 2 + fontSize;
            break;
          case "bottom":
            startY = layer.y + layer.height - totalTextHeight - padding + fontSize;
            break;
        }
        
        // Draw each line
        lines.forEach((line, index) => {
          const y = startY + (index * lineSpacing);
          
          // Only draw if within container bounds
          if (y >= layer.y + padding && y <= layer.y + layer.height - padding) {
            let x = layer.x + padding;
            
            if (textAlign === "center") {
              x = layer.x + layer.width / 2;
              ctx.textAlign = "center";
            } else if (textAlign === "right") {
              x = layer.x + layer.width - padding;
              ctx.textAlign = "right";
            } else {
              ctx.textAlign = "left";
            }
            
            ctx.fillText(line, x, y);
          }
        });
      } else {
        // Single line text (original behavior)
        ctx.textAlign = (textAlign as CanvasTextAlign) || "left";
        ctx.fillText(layer.properties.text, layer.x + padding, layer.y + fontSize + padding);
      }
    } catch (error) {
      console.error("Error drawing text in container:", error);
    }
  };

  const drawSelectionOutline = (ctx: CanvasRenderingContext2D, layer: Layer) => {
    try {
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
    } catch (error) {
      console.error("Error drawing selection outline:", error);
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
      
      // Check layers in reverse order (top to bottom), including children
      const flattenedLayers = flattenLayers(layers).reverse();
      
      for (const layer of flattenedLayers) {
        if (!layer || layer.visible === false || layer.locked) continue;

        // Get absolute position for child layers
        const absolutePos = getAbsolutePosition(layer, layers);
        
        if (layer.type === "circle") {
          const centerX = absolutePos.x + layer.width / 2;
          const centerY = absolutePos.y + layer.height / 2;
          const radius = Math.min(layer.width, layer.height) / 2;
          const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
          if (distance <= radius) {
            return layer;
          }
        } else {
          if (x >= absolutePos.x && x <= absolutePos.x + layer.width &&
              y >= absolutePos.y && y <= absolutePos.y + layer.height) {
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

  const flattenLayers = (layers: Layer[]): Layer[] => {
    const result: Layer[] = [];
    
    layers.forEach(layer => {
      result.push(layer);
      if (layer.properties?.children) {
        const childLayers = layer.properties.children
          .map(childId => layers.find(l => l.id === childId))
          .filter(Boolean) as Layer[];
        result.push(...flattenLayers(childLayers));
      }
    });
    
    return result;
  };

  const getAbsolutePosition = (layer: Layer, allLayers: Layer[]): { x: number; y: number } => {
    if (!layer.parentId) {
      return { x: layer.x, y: layer.y };
    }
    
    const parent = allLayers.find(l => l.id === layer.parentId);
    if (!parent) {
      return { x: layer.x, y: layer.y };
    }
    
    const parentPos = getAbsolutePosition(parent, allLayers);
    return {
      x: parentPos.x + layer.x,
      y: parentPos.y + layer.y
    };
  };

  const createPreviewLayer = (tool: Tool, startPos: { x: number; y: number }, currentPos: { x: number; y: number }): Layer => {
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);
    const x = Math.min(currentPos.x, startPos.x);
    const y = Math.min(currentPos.y, startPos.y);

    const baseLayer = {
      id: "preview",
      name: "Preview",
      x,
      y,
      width,
      height,
      visible: true,
      locked: false,
      opacity: 0.7,
      rotation: 0,
    };

    switch (tool) {
      case "rectangle":
        return {
          ...baseLayer,
          type: "rectangle" as const,
          properties: {
            fill: "#3B82F6",
            stroke: "#1E40AF",
            strokeWidth: 1,
          },
        };
      case "circle":
        return {
          ...baseLayer,
          type: "circle" as const,
          properties: {
            fill: "#EF4444",
            stroke: "#DC2626",
            strokeWidth: 1,
          },
        };
      case "text":
        return {
          ...baseLayer,
          type: "container" as const,
          x: startPos.x,
          y: startPos.y,
          width: Math.max(100, width),
          height: Math.max(30, height),
          properties: {
            text: "Text",
            fontSize: 16,
            fontFamily: "Arial",
            fontWeight: "normal",
            fill: "#000000",
            textAlign: "left",
            verticalAlign: "top",
            wordWrap: true,
            lineHeight: 1.4,
            padding: 8,
            overflow: "hidden"
          },
        };
      default:
        return baseLayer as Layer;
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
        
        // Create preview layer immediately
        const preview = createPreviewLayer(activeTool, pos, pos);
        setPreviewLayer(preview);
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
          // If it's a group, move the entire group
          if (currentLayer.type === "group") {
            moveGroup(currentLayer, dx, dy, layers);
          } else {
            onLayerUpdate(selectedLayerId, {
              x: currentLayer.x + dx,
              y: currentLayer.y + dy,
            });
          }
        }
        
        setDragStart(pos);
      } else if (isDrawing && (activeTool === "rectangle" || activeTool === "circle" || activeTool === "text")) {
        // Update preview layer while drawing
        const preview = createPreviewLayer(activeTool, drawStart, pos);
        setPreviewLayer(preview);
      }

      draw();
    } catch (error) {
      console.error("Error handling mouse move:", error);
    }
  };

  const moveGroup = (group: Layer, dx: number, dy: number, allLayers: Layer[]) => {
    // Move the group itself
    onLayerUpdate(group.id, {
      x: group.x + dx,
      y: group.y + dy,
    });

    // Move all children
    if (group.properties?.children) {
      group.properties.children.forEach(childId => {
        const child = allLayers.find(l => l.id === childId);
        if (child) {
          if (child.type === "group") {
            moveGroup(child, dx, dy, allLayers);
          } else {
            onLayerUpdate(childId, {
              x: child.x + dx,
              y: child.y + dy,
            });
          }
        }
      });
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
              rotation: 0,
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
              rotation: 0,
              properties: {
                fill: "#EF4444",
                stroke: "#DC2626",
                strokeWidth: 1,
              },
            });
          } else if (activeTool === "text") {
            onLayerAdd({
              type: "container",
              name: "Text Container",
              x: drawStart.x,
              y: drawStart.y,
              width: Math.max(100, width),
              height: Math.max(30, height),
              visible: true,
              locked: false,
              opacity: 1,
              rotation: 0,
              properties: {
                text: "Text",
                fontSize: 16,
                fontFamily: "Arial",
                fontWeight: "normal",
                fill: "#000000",
                textAlign: "left",
                verticalAlign: "top",
                wordWrap: true,
                lineHeight: 1.4,
                padding: 8,
                overflow: "hidden"
              },
            });
          }
        }
        setIsDrawing(false);
        setPreviewLayer(null);
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
