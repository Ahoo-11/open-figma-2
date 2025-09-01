import { api, APIError } from "encore.dev/api";
import { designDB } from "./db";
import type { DesignFile, Layer } from "./types";

export interface ExportSVGRequest {
  design_file_id: number;
}

export interface ExportSVGResponse {
  svg: string;
}

// Exports a design file as SVG.
export const exportSVG = api<ExportSVGRequest, ExportSVGResponse>(
  { expose: true, method: "GET", path: "/design-files/:design_file_id/export/svg" },
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

    const svg = generateSVG(layers);
    return { svg };
  }
);

function generateSVG(layers: Layer[]): string {
  if (!Array.isArray(layers)) {
    layers = [];
  }

  const svgElements = layers
    .filter(layer => layer && layer.visible !== false)
    .map(layer => layerToSVG(layer))
    .filter(element => element) // Remove empty elements
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
${svgElements}
</svg>`;
}

function layerToSVG(layer: Layer): string {
  if (!layer || !layer.properties) {
    return '';
  }

  const commonAttrs = `opacity="${layer.opacity || 1}"`;
  
  switch (layer.type) {
    case "rectangle":
      const rx = layer.properties.cornerRadius || 0;
      return `  <rect x="${layer.x || 0}" y="${layer.y || 0}" width="${layer.width || 0}" height="${layer.height || 0}" rx="${rx}" fill="${layer.properties.fill || '#000'}" stroke="${layer.properties.stroke || 'none'}" stroke-width="${layer.properties.strokeWidth || 0}" ${commonAttrs} />`;
    
    case "circle":
      const cx = (layer.x || 0) + (layer.width || 0) / 2;
      const cy = (layer.y || 0) + (layer.height || 0) / 2;
      const r = Math.min(layer.width || 0, layer.height || 0) / 2;
      return `  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${layer.properties.fill || '#000'}" stroke="${layer.properties.stroke || 'none'}" stroke-width="${layer.properties.strokeWidth || 0}" ${commonAttrs} />`;
    
    case "text":
      const text = layer.properties.text || '';
      const escapedText = text.replace(/[<>&"']/g, (char) => {
        switch (char) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '"': return '&quot;';
          case "'": return '&#39;';
          default: return char;
        }
      });
      return `  <text x="${layer.x || 0}" y="${(layer.y || 0) + (layer.properties.fontSize || 16)}" font-family="${layer.properties.fontFamily || 'Arial'}" font-size="${layer.properties.fontSize || 16}" font-weight="${layer.properties.fontWeight || 'normal'}" fill="${layer.properties.fill || '#000'}" ${commonAttrs}>${escapedText}</text>`;
    
    default:
      return '';
  }
}
