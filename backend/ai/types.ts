export interface AIGenerateDesignRequest {
  prompt: string;
  style?: "modern" | "minimal" | "playful" | "corporate" | "creative";
  color_scheme?: "blue" | "green" | "purple" | "orange" | "monochrome" | "colorful";
  design_type?: "landing_page" | "mobile_app" | "poster" | "dashboard" | "presentation";
}

export interface AIGenerateDesignResponse {
  canvas_data: {
    layers: Array<{
      id: string;
      type: "rectangle" | "circle" | "text";
      name: string;
      x: number;
      y: number;
      width: number;
      height: number;
      visible: boolean;
      locked: boolean;
      opacity: number;
      properties: {
        fill?: string;
        stroke?: string;
        strokeWidth?: number;
        cornerRadius?: number;
        text?: string;
        fontSize?: number;
        fontFamily?: string;
        fontWeight?: string;
        textAlign?: string;
      };
    }>;
    viewport: {
      x: number;
      y: number;
      zoom: number;
    };
  };
  design_description: string;
}

export interface AIRefineDesignRequest {
  current_canvas_data: any;
  refinement_prompt: string;
  selected_layer_id?: string;
}

export interface AIRefineDesignResponse {
  canvas_data: any;
  changes_description: string;
}
