import { api, APIError } from "encore.dev/api";
import { designDB } from "./db";
import type { DesignFile } from "./types";

export interface ExportPNGRequest {
  design_file_id: number;
  width?: number;
  height?: number;
  scale?: number;
}

export interface ExportPNGResponse {
  message: string;
  svg_data: string;
}

// Exports a design file as PNG data (returns SVG for client-side conversion).
export const exportPNG = api<ExportPNGRequest, ExportPNGResponse>(
  { expose: true, method: "GET", path: "/design-files/:design_file_id/export/png" },
  async (req) => {
    const designFile = await designDB.queryRow<DesignFile>`
      SELECT canvas_data FROM design_files WHERE id = ${req.design_file_id}
    `;

    if (!designFile) {
      throw APIError.notFound("Design file not found");
    }

    // Generate SVG that can be converted to PNG on the client side
    const layers = designFile.canvas_data.layers;
    const svgElements = layers
      .filter(layer => layer.visible)
      .map(layer => {
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
      })
      .join('\n');

    const width = req.width || 800;
    const height = req.height || 600;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${svgElements}
</svg>`;

    return { 
      message: "SVG data ready for PNG conversion",
      svg_data: svg
    };
  }
);
