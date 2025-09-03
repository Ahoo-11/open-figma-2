import { api } from "encore.dev/api";
import { designDB } from "./db";
import type { DesignFile, CanvasData, Layer } from "./types";

export interface CreateDesignFileRequest {
  project_id: number;
  name: string;
  canvas_data?: CanvasData;
}

export interface CreateDesignFileResponse {
  design_file: DesignFile;
}

function computeBBox(layers: Layer[]): { x: number; y: number; width: number; height: number } {
  const xs = layers.map(l => l.x);
  const ys = layers.map(l => l.y);
  const rights = layers.map(l => l.x + l.width);
  const bottoms = layers.map(l => l.y + l.height);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...rights);
  const maxY = Math.max(...bottoms);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function normalizeInitialGrouping(canvas: CanvasData): CanvasData {
  const layers = Array.isArray(canvas.layers) ? [...canvas.layers] as Layer[] : [];
  if (layers.length === 0) return canvas;

  const rootLayers = layers.filter(l => !l.parentId);
  if (rootLayers.length === 0) return canvas;

  if (rootLayers.length === 1 && rootLayers[0]?.type === 'group') {
    return canvas;
  }

  const bbox = computeBBox(rootLayers);
  const newGroupId = `group_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
  const newGroup: Layer = {
    id: newGroupId,
    type: 'group',
    name: 'AI Generated (Grouped)',
    x: bbox.x,
    y: bbox.y,
    width: bbox.width,
    height: bbox.height,
    visible: true,
    locked: false,
    opacity: 1,
    rotation: 0,
    properties: { children: rootLayers.map(l => l.id) },
  };

  const updatedLayers: Layer[] = layers.map(l => {
    if (!l.parentId) {
      return { ...l, parentId: newGroupId, x: l.x - bbox.x, y: l.y - bbox.y };
    }
    return l;
  });

  // Insert new group as a root layer at index 0
  updatedLayers.unshift(newGroup);

  return { ...canvas, layers: updatedLayers };
}

// Creates a new design file within a project.
export const createDesignFile = api<CreateDesignFileRequest, CreateDesignFileResponse>(
  { expose: true, method: "POST", path: "/design-files" },
  async (req) => {
    const baseCanvas: CanvasData = req.canvas_data || {
      layers: [],
      viewport: { x: 0, y: 0, zoom: 1 }
    };

    const canvasData = req.canvas_data ? normalizeInitialGrouping(baseCanvas) : baseCanvas;

    const designFile = await designDB.queryRow<DesignFile>`
      INSERT INTO design_files (project_id, name, canvas_data)
      VALUES (${req.project_id}, ${req.name}, ${JSON.stringify(canvasData)})
      RETURNING id, project_id, name, canvas_data, created_at, updated_at
    `;

    if (!designFile) {
      throw new Error("Failed to create design file");
    }

    return { design_file: designFile };
  }
);
