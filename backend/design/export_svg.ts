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

    const svg = generateSVG(designFile.canvas_data.layers);
    return { svg };
  }
);

function generateSVG(layers: Layer[]): string {
  const svgElements = layers
    .filter(layer => layer.visible)
    .map(layer => layerToSVG(layer))
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
${svgElements}
</svg>`;
}

function layerToSVG(layer: Layer): string {
  const commonAttrs = `opacity="${layer.opacity}"`;
  
  switch (layer.type) {
    case "rectangle":
      const rx = layer.properties.cornerRadius || 0;
      return `  <rect x="${layer.x}" y="${layer.y}" width="${layer.width}" height="${layer.height}" rx="${rx}" fill="${layer.properties.fill || '#000'}" stroke="${layer.properties.stroke || 'none'}" stroke-width="${layer.properties.strokeWidth || 0}" ${commonAttrs} />`;
    
    case "circle":
      const cx = layer.x + layer.width / 2;
      const cy = layer.y + layer.height / 2;
      const r = Math.min(layer.width, layer.height) / 2;
      return `  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${layer.properties.fill || '#000'}" stroke="${layer.properties.stroke || 'none'}" stroke-width="${layer.properties.strokeWidth || 0}" ${commonAttrs} />`;
    
    case "text":
      return `  <text x="${layer.x}" y="${layer.y + (layer.properties.fontSize || 16)}" font-family="${layer.properties.fontFamily || 'Arial'}" font-size="${layer.properties.fontSize || 16}" font-weight="${layer.properties.fontWeight || 'normal'}" fill="${layer.properties.fill || '#000'}" ${commonAttrs}>${layer.properties.text || ''}</text>`;
    
    default:
      return '';
  }
}
