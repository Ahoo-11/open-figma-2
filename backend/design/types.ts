export interface Project {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DesignFile {
  id: number;
  project_id: number;
  name: string;
  canvas_data: CanvasData;
  created_at: Date;
  updated_at: Date;
}

export interface DesignVersion {
  id: number;
  design_file_id: number;
  version_number: number;
  canvas_data: CanvasData;
  created_at: Date;
}

export interface Comment {
  id: number;
  design_file_id: number;
  x_position: number;
  y_position: number;
  content: string;
  author_name: string;
  created_at: Date;
}

export interface CanvasData {
  layers: Layer[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

export interface Layer {
  id: string;
  type: LayerType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  locked: boolean;
  opacity: number;
  properties: LayerProperties;
}

export type LayerType = "rectangle" | "circle" | "text" | "vector" | "group";

export interface LayerProperties {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: string;
  children?: string[];
}

export interface CollaborationEvent {
  type: "cursor" | "layer_update" | "layer_add" | "layer_delete" | "selection_change";
  user_id: string;
  user_name: string;
  data: any;
  timestamp: number;
}

export interface CursorPosition {
  user_id: string;
  user_name: string;
  x: number;
  y: number;
  color: string;
}
