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

    // Ensure canvas_data and layers exist
    const canvasData = designFile.canvas_data || { layers: [] };
    const layers = Array.isArray(canvasData.layers) ? canvasData.layers : [];

    // Generate SVG that can be converted to PNG on the client side
    const svgElements = layers
      .filter(layer => layer && layer.visible !== false)
      .map(layer => {
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
      })
      .filter(element => element) // Remove empty elements
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
