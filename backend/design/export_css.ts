import { api, APIError } from "encore.dev/api";
import { designDB } from "./db";
import type { DesignFile, Layer } from "./types";

export interface ExportCSSRequest {
  design_file_id: number;
}

export interface ExportCSSResponse {
  css: string;
}

// Exports design as CSS code.
export const exportCSS = api<ExportCSSRequest, ExportCSSResponse>(
  { expose: true, method: "GET", path: "/design-files/:design_file_id/export/css" },
  async (req) => {
    const designFile = await designDB.queryRow<DesignFile>`
      SELECT canvas_data FROM design_files WHERE id = ${req.design_file_id}
    `;

    if (!designFile) {
      throw APIError.notFound("Design file not found");
    }

    // Ensure canvas_data and layers exist
    const canvasData = designFile.canvas_data || { layers: [] };
    const layers = Array.isArray(canvasData.layers) ? canvasData.layers : [];

    const css = generateCSS(layers);
    return { css };
  }
);

function generateCSS(layers: Layer[]): string {
  if (!Array.isArray(layers)) {
    layers = [];
  }

  const cssRules = layers
    .filter(layer => layer && layer.visible !== false)
    .map(layer => layerToCSS(layer))
    .filter(rule => rule) // Remove empty rules
    .join('\n\n');

  return `/* Generated CSS from DesignStudio */
.designstudio-container {
  position: relative;
  width: 800px;
  height: 600px;
}

${cssRules}`;
}

function layerToCSS(layer: Layer): string {
  if (!layer || !layer.properties) {
    return '';
  }

  const className = `designstudio-${layer.type}-${layer.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  
  let css = `.${className} {
  position: absolute;
  left: ${layer.x || 0}px;
  top: ${layer.y || 0}px;
  width: ${layer.width || 0}px;
  height: ${layer.height || 0}px;
  opacity: ${layer.opacity || 1};`;

  switch (layer.type) {
    case "rectangle":
      css += `
  background-color: ${layer.properties.fill || 'transparent'};
  border: ${layer.properties.strokeWidth || 0}px solid ${layer.properties.stroke || 'transparent'};
  border-radius: ${layer.properties.cornerRadius || 0}px;`;
      break;

    case "circle":
      css += `
  background-color: ${layer.properties.fill || 'transparent'};
  border: ${layer.properties.strokeWidth || 0}px solid ${layer.properties.stroke || 'transparent'};
  border-radius: 50%;`;
      break;

    case "text":
      css += `
  color: ${layer.properties.fill || '#000000'};
  font-size: ${layer.properties.fontSize || 16}px;
  font-family: ${layer.properties.fontFamily || 'Arial'};
  font-weight: ${layer.properties.fontWeight || 'normal'};
  text-align: ${layer.properties.textAlign || 'left'};
  line-height: 1.2;`;
      break;
  }

  css += '\n}';
  return css;
}
