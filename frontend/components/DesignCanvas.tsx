import React, { useRef, useEffect } from "react";
import { Stage, Layer, Rect, Circle, Text } from "react-konva";
import { useDesignContext } from "../contexts/DesignContext";
import { DesignElement } from "../types/design";

export default function DesignCanvas() {
  const stageRef = useRef<any>(null);
  const { 
    elements, 
    selectedElementId, 
    setSelectedElementId, 
    activeTool, 
    addElement,
    updateElement,
    canvasSize 
  } = useDesignContext();

  const [isDrawing, setIsDrawing] = React.useState(false);
  const [startPos, setStartPos] = React.useState({ x: 0, y: 0 });

  const handleStageMouseDown = (e: any) => {
    if (e.target === e.target.getStage()) {
      setSelectedElementId(null);
    }

    if (activeTool === "select") return;

    const pos = e.target.getStage().getPointerPosition();
    setIsDrawing(true);
    setStartPos(pos);

    if (activeTool === "rectangle" || activeTool === "circle") {
      const newElement: DesignElement = {
        id: `${activeTool}-${Date.now()}`,
        type: activeTool,
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        fill: "#3b82f6",
        stroke: "#1e40af",
        strokeWidth: 2,
      };
      addElement(newElement);
      setSelectedElementId(newElement.id);
    }
  };

  const handleStageMouseMove = (e: any) => {
    if (!isDrawing || activeTool === "select") return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    if (activeTool === "rectangle" || activeTool === "circle") {
      const width = pos.x - startPos.x;
      const height = pos.y - startPos.y;

      if (selectedElementId) {
        updateElement(selectedElementId, {
          width: Math.abs(width),
          height: Math.abs(height),
          x: width < 0 ? pos.x : startPos.x,
          y: height < 0 ? pos.y : startPos.y,
        });
      }
    }
  };

  const handleStageMouseUp = () => {
    setIsDrawing(false);
  };

  const handleElementClick = (elementId: string) => {
    setSelectedElementId(elementId);
  };

  const renderElement = (element: DesignElement) => {
    const commonProps = {
      key: element.id,
      x: element.x,
      y: element.y,
      fill: element.fill,
      stroke: element.stroke,
      strokeWidth: element.strokeWidth,
      draggable: activeTool === "select",
      onClick: () => handleElementClick(element.id),
      onDragEnd: (e: any) => {
        updateElement(element.id, {
          x: e.target.x(),
          y: e.target.y(),
        });
      },
    };

    switch (element.type) {
      case "rectangle":
        return (
          <Rect
            {...commonProps}
            width={element.width}
            height={element.height}
          />
        );
      case "circle":
        return (
          <Circle
            {...commonProps}
            radius={Math.max(element.width, element.height) / 2}
          />
        );
      case "text":
        return (
          <Text
            {...commonProps}
            text={element.text || "Text"}
            fontSize={element.fontSize || 16}
            fontFamily={element.fontFamily || "Arial"}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full bg-gray-50 overflow-hidden">
      <Stage
        ref={stageRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseDown={handleStageMouseDown}
        onMousemove={handleStageMouseMove}
        onMouseup={handleStageMouseUp}
        className="border border-gray-200"
      >
        <Layer>
          {elements.map(renderElement)}
          
          {/* Selection indicator */}
          {selectedElementId && (
            <Rect
              x={elements.find(e => e.id === selectedElementId)?.x || 0}
              y={elements.find(e => e.id === selectedElementId)?.y || 0}
              width={elements.find(e => e.id === selectedElementId)?.width || 0}
              height={elements.find(e => e.id === selectedElementId)?.height || 0}
              stroke="#3b82f6"
              strokeWidth={2}
              dash={[5, 5]}
              fill="transparent"
              listening={false}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}
