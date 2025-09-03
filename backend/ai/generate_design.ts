import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import type { AIGenerateDesignRequest, AIGenerateDesignResponse } from "./types";

const openRouterKey = secret("OpenRouterKey");

// Generates a design using AI based on user prompt and preferences.
export const generateDesign = api<AIGenerateDesignRequest, AIGenerateDesignResponse>(
  { expose: true, method: "POST", path: "/generate-design" },
  async (req) => {
    const systemPrompt = `You are a professional UI/UX designer. Generate a design layout based on the user's request. 

IMPORTANT: All generated designs should be grouped as a single unit initially, with a main group container that holds all elements. This allows users to move the entire design as one piece and later ungroup if needed.

For text elements:
- Text should ALWAYS fit within its container bounds
- Use proper text wrapping and sizing
- Include padding for better readability
- Set appropriate container dimensions for the text content

Return a JSON object with this exact structure:
{
  "canvas_data": {
    "layers": [
      {
        "id": "main_group",
        "type": "group",
        "name": "Generated Design",
        "x": 50,
        "y": 50,
        "width": 700,
        "height": 500,
        "visible": true,
        "locked": false,
        "opacity": 1,
        "properties": {
          "children": ["child_id_1", "child_id_2", ...]
        }
      },
      {
        "id": "child_id_1",
        "type": "container|rectangle|circle|text",
        "name": "Element Name",
        "x": relative_to_group,
        "y": relative_to_group,
        "width": number,
        "height": number,
        "visible": true,
        "locked": false,
        "opacity": 1,
        "parentId": "main_group",
        "properties": {
          "fill": "#hexcolor",
          "stroke": "#hexcolor",
          "strokeWidth": number,
          "cornerRadius": number,
          "text": "text content",
          "fontSize": number,
          "fontFamily": "font name",
          "fontWeight": "normal|bold",
          "textAlign": "left|center|right",
          "verticalAlign": "top|middle|bottom",
          "wordWrap": true,
          "lineHeight": 1.4,
          "padding": 16,
          "overflow": "hidden"
        }
      }
    ],
    "viewport": {
      "x": 0,
      "y": 0,
      "zoom": 1
    }
  },
  "design_description": "Brief description of the generated design"
}

Guidelines:
- CREATE A MAIN GROUP that contains ALL design elements
- Position child elements relative to the group's coordinate system
- For text elements, use "container" type for proper text containment
- Ensure text fits within container bounds with proper padding
- Use realistic content that fits well within the designed containers
- For landing pages: group header, hero section, features, footer as child elements
- For mobile apps: group status bar, header, main content, navigation as children
- Set appropriate container sizes for text content
- Apply the requested style consistently across all grouped elements`;

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
- Group all elements under a main group container
- Use proper text containers with padding and word wrapping
- Ensure text stays within bounds`;

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

      // Parse the AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not parse AI response");
      }

      const parsedResponse = JSON.parse(jsonMatch[0]);
      
      // Validate and ensure proper structure
      if (!parsedResponse.canvas_data || !parsedResponse.canvas_data.layers) {
        throw new Error("Invalid AI response structure");
      }

      // Ensure all layers have required properties and proper grouping
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
          // Ensure text containers have proper wrapping
          ...(layer.type === "text" || layer.type === "container" ? {
            wordWrap: true,
            lineHeight: 1.4,
            padding: layer.properties?.padding || 16,
            overflow: "hidden",
            verticalAlign: layer.properties?.verticalAlign || "top"
          } : {})
        }
      }));

      // If no main group exists, create one
      const hasMainGroup = layers.some((layer: any) => layer.type === "group");
      if (!hasMainGroup) {
        const childLayers = layers.map((layer: any) => ({ ...layer, parentId: "main_group" }));
        const mainGroup = {
          id: "main_group",
          type: "group",
          name: "Generated Design",
          x: 50,
          y: 50,
          width: 700,
          height: 500,
          visible: true,
          locked: false,
          opacity: 1,
          rotation: 0,
          properties: {
            children: childLayers.map((layer: any) => layer.id)
          }
        };
        layers.unshift(mainGroup);
        layers.splice(1, layers.length - 1, ...childLayers);
      }

      return {
        canvas_data: {
          layers,
          viewport: parsedResponse.canvas_data.viewport || { x: 0, y: 0, zoom: 1 }
        },
        design_description: parsedResponse.design_description || "AI-generated design with proper grouping and text containers"
      };

    } catch (error) {
      console.error("AI generation error:", error);
      
      // Fallback design with proper grouping and text containers
      const mainGroupId = "fallback_main_group";
      const headerId = "fallback_header";
      const titleId = "fallback_title";
      const descriptionId = "fallback_description";

      return {
        canvas_data: {
          layers: [
            {
              id: mainGroupId,
              type: "group",
              name: "Generated Design",
              x: 50,
              y: 50,
              width: 700,
              height: 400,
              visible: true,
              locked: false,
              opacity: 1,
              rotation: 0,
              properties: {
                children: [headerId, titleId, descriptionId]
              }
            },
            {
              id: headerId,
              type: "rectangle",
              name: "Header Background",
              x: 0,
              y: 0,
              width: 700,
              height: 80,
              visible: true,
              locked: false,
              opacity: 1,
              rotation: 0,
              parentId: mainGroupId,
              properties: {
                fill: req.color_scheme === 'blue' ? "#3B82F6" : "#6366F1",
                cornerRadius: 8
              }
            },
            {
              id: titleId,
              type: "container",
              name: "Main Title",
              x: 20,
              y: 20,
              width: 660,
              height: 40,
              visible: true,
              locked: false,
              opacity: 1,
              rotation: 0,
              parentId: mainGroupId,
              properties: {
                text: req.prompt || "AI-Generated Design",
                fontSize: 24,
                fontFamily: "Inter",
                fontWeight: "bold",
                fill: "#FFFFFF",
                textAlign: "left",
                verticalAlign: "middle",
                wordWrap: true,
                lineHeight: 1.2,
                padding: 0,
                overflow: "hidden"
              }
            },
            {
              id: descriptionId,
              type: "container",
              name: "Description",
              x: 20,
              y: 100,
              width: 660,
              height: 80,
              visible: true,
              locked: false,
              opacity: 1,
              rotation: 0,
              parentId: mainGroupId,
              properties: {
                text: "This is a fallback design created when AI services are unavailable. All elements are properly grouped and text containers have proper wrapping.",
                fontSize: 16,
                fontFamily: "Inter",
                fontWeight: "normal",
                fill: "#374151",
                textAlign: "left",
                verticalAlign: "top",
                wordWrap: true,
                lineHeight: 1.4,
                padding: 16,
                overflow: "hidden"
              }
            }
          ],
          viewport: { x: 0, y: 0, zoom: 1 }
        },
        design_description: "Fallback grouped design with proper text containers"
      };
    }
  }
);
