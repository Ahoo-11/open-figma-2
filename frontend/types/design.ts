export type ToolType = "select" | "rectangle" | "circle" | "text";

export interface DesignElement {
  id: string;
  type: "rectangle" | "circle" | "text";
  x: number;
  y: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  visible?: boolean;
  
  // Text-specific properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
}

export interface CanvasSize {
  width: number;
  height: number;
}
