import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import type { AIGenerateDesignRequest, AIGenerateDesignResponse } from "./types";

const openRouterKey = secret("OpenRouterKey");

// Generates a design using AI based on user prompt and preferences.
export const generateDesign = api<AIGenerateDesignRequest, AIGenerateDesignResponse>(
  { expose: true, method: "POST", path: "/generate-design" },
  async (req) => {
    const systemPrompt = `You are a professional UI/UX designer. Generate a design layout based on the user's request.

VERY IMPORTANT: The entire design MUST be wrapped in a single top-level group layer. All other elements are children of this group. This is a strict requirement.

For text elements, use the "container" type. Text containers MUST have appropriate width and height so that the text fits inside with padding. Use word wrapping.

Return a JSON object with this exact structure:
{
  "canvas_data": {
    "layers": [
      {
        "id": "main_group_id",
        "type": "group",
        "name": "Generated Design",
        "x": 50, "y": 50, "width": 700, "height": 500,
        "visible": true, "locked": false, "opacity": 1, "rotation": 0,
        "properties": { "children": ["child_id_1", "child_id_2"] }
      },
      {
        "id": "child_id_1",
        "type": "container",
        "name": "Title Text",
        "parentId": "main_group_id",
        "x": 20, "y": 20, "width": 660, "height": 50,
        "visible": true, "locked": false, "opacity": 1, "rotation": 0,
        "properties": {
          "text": "My Awesome Landing Page",
          "fontSize": 32, "fontFamily": "Inter", "fontWeight": "bold", "fill": "#333333",
          "textAlign": "left", "verticalAlign": "middle", "wordWrap": true, "lineHeight": 1.4, "padding": 10, "overflow": "hidden"
        }
      },
      {
        "id": "child_id_2",
        "type": "rectangle",
        "name": "Header Background",
        "parentId": "main_group_id",
        "x": 0, "y": 0, "width": 700, "height": 90,
        "visible": true, "locked": false, "opacity": 1, "rotation": 0,
        "properties": { "fill": "#F3F4F6", "cornerRadius": 0 }
      }
    ],
    "viewport": { "x": 0, "y": 0, "zoom": 1 }
  },
  "design_description": "Brief description of the generated design"
}

Guidelines:
- The VERY FIRST layer in the array MUST be the main group.
- All other layers MUST have a "parentId" property pointing to the main group's ID.
- Child layer coordinates (x, y) are RELATIVE to the parent group.
- Use "container" for all text elements. Ensure the container's width and height are large enough for the text.
- Use realistic content, not just placeholders.
- For landing pages: header, hero, features, footer should be children of the main group.
- Apply the requested style consistently.`;

    const userPrompt = `Create a ${req.design_type || 'general'} design with ${req.style || 'modern'} style and ${req.color_scheme || 'blue'} color scheme.

User request: ${req.prompt}

Style requirements:
- ${req.style === 'minimal' ? 'Clean, lots of whitespace, simple typography' : ''}
- ${req.style === 'modern' ? 'Contemporary, sleek, professional' : ''}
- ${req.style === 'playful' ? 'Fun, vibrant, creative elements' : ''}
- ${req.style === 'corporate' ? 'Professional, trustworthy, clean' : ''}
- ${req.style === 'creative' ? 'Artistic, unique, experimental' : ''}

Color scheme: ${req.color_scheme} tones

REMEMBER: 
- The entire design must be a single group.
- All text must be in a 'container' with proper dimensions and word wrapping.`;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey()}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://designstudio.local",
          "X-Title": "DesignStudio AI"
        },
        body: JSON.stringify({
          model: "anthropic/claude-3-haiku",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not parse AI response");
      }

      const parsedResponse = JSON.parse(jsonMatch[0]);
      
      if (!parsedResponse.canvas_data || !parsedResponse.canvas_data.layers) {
        throw new Error("Invalid AI response structure");
      }

      const layers = parsedResponse.canvas_data.layers.map((layer: any, index: number) => ({
        id: layer.id || `ai_layer_${Date.now()}_${index}`,
        type: layer.type || "rectangle",
        name: layer.name || `AI Layer ${index + 1}`,
        x: layer.x || 0,
        y: layer.y || 0,
        width: layer.width || 100,
        height: layer.height || 100,
        visible: layer.visible !== false,
        locked: layer.locked || false,
        opacity: layer.opacity || 1,
        rotation: layer.rotation || 0,
        parentId: layer.parentId || undefined,
        properties: {
          ...layer.properties,
          ...(layer.type === "container" ? {
            wordWrap: true,
            lineHeight: 1.4,
            padding: layer.properties?.padding || 10,
            overflow: "hidden",
            verticalAlign: layer.properties?.verticalAlign || "top"
          } : {})
        }
      }));

      return {
        canvas_data: {
          layers,
          viewport: parsedResponse.canvas_data.viewport || { x: 0, y: 0, zoom: 1 }
        },
        design_description: parsedResponse.design_description || "AI-generated design"
      };

    } catch (error) {
      console.error("AI generation error:", error);
      
      const mainGroupId = "fallback_main_group";
      return {
        canvas_data: {
          layers: [
            {
              id: mainGroupId,
              type: "group",
              name: "Fallback Design Group",
              x: 50, y: 50, width: 700, height: 200,
              visible: true, locked: false, opacity: 1, rotation: 0,
              properties: { children: ["fallback_header_rect", "fallback_title_text"] }
            },
            {
              id: "fallback_header_rect",
              type: "rectangle",
              name: "Header Background",
              parentId: mainGroupId,
              x: 0, y: 0, width: 700, height: 80,
              visible: true, locked: false, opacity: 1, rotation: 0,
              properties: { fill: "#3B82F6", cornerRadius: 8 }
            },
            {
              id: "fallback_title_text",
              type: "container",
              name: "Main Title",
              parentId: mainGroupId,
              x: 20, y: 15, width: 660, height: 50,
              visible: true, locked: false, opacity: 1, rotation: 0,
              properties: {
                text: req.prompt || "AI-Generated Design (Fallback)",
                fontSize: 24, fontFamily: "Inter", fontWeight: "bold", fill: "#FFFFFF",
                textAlign: "left", verticalAlign: "middle", wordWrap: true, lineHeight: 1.2, padding: 0, overflow: "hidden"
              }
            }
          ],
          viewport: { x: 0, y: 0, zoom: 1 }
        },
        design_description: "Fallback design generated due to AI service unavailability"
      };
    }
  }
);
