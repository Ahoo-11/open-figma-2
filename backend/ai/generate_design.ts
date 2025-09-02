import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import type { AIGenerateDesignRequest, AIGenerateDesignResponse } from "./types";

const openRouterKey = secret("OpenRouterKey");

// Generates a design using AI based on user prompt and preferences.
export const generateDesign = api<AIGenerateDesignRequest, AIGenerateDesignResponse>(
  { expose: true, method: "POST", path: "/generate-design" },
  async (req) => {
    const systemPrompt = `You are a professional UI/UX designer. Generate a design layout based on the user's request. 

Return a JSON object with this exact structure:
{
  "canvas_data": {
    "layers": [
      {
        "id": "unique_id",
        "type": "rectangle|circle|text",
        "name": "Layer Name",
        "x": number,
        "y": number,
        "width": number,
        "height": number,
        "visible": true,
        "locked": false,
        "opacity": 1,
        "properties": {
          "fill": "#hexcolor",
          "stroke": "#hexcolor",
          "strokeWidth": number,
          "cornerRadius": number,
          "text": "text content",
          "fontSize": number,
          "fontFamily": "font name",
          "fontWeight": "normal|bold",
          "textAlign": "left|center|right"
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
- Create a complete, functional design with multiple layers
- Use appropriate colors for the specified style and color scheme
- Position elements logically (headers at top, content below, etc.)
- Make text readable with good contrast
- Use standard canvas size of 800x600 px
- Include realistic content, not just placeholders
- For landing pages: header, hero section, features, footer
- For mobile apps: status bar, header, main content, navigation
- For posters: title, main visual, supporting text
- Apply the requested style consistently`;

    const userPrompt = `Create a ${req.design_type || 'general'} design with ${req.style || 'modern'} style and ${req.color_scheme || 'blue'} color scheme.

User request: ${req.prompt}

Style requirements:
- ${req.style === 'minimal' ? 'Clean, lots of whitespace, simple typography' : ''}
- ${req.style === 'modern' ? 'Contemporary, sleek, professional' : ''}
- ${req.style === 'playful' ? 'Fun, vibrant, creative elements' : ''}
- ${req.style === 'corporate' ? 'Professional, trustworthy, clean' : ''}
- ${req.style === 'creative' ? 'Artistic, unique, experimental' : ''}

Color scheme: ${req.color_scheme} tones`;

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

      // Ensure all layers have required properties
      parsedResponse.canvas_data.layers = parsedResponse.canvas_data.layers.map((layer: any, index: number) => ({
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
        properties: layer.properties || {}
      }));

      return {
        canvas_data: parsedResponse.canvas_data,
        design_description: parsedResponse.design_description || "AI-generated design"
      };

    } catch (error) {
      console.error("AI generation error:", error);
      
      // Fallback design if AI fails
      return {
        canvas_data: {
          layers: [
            {
              id: "fallback_header",
              type: "rectangle",
              name: "Header Background",
              x: 50,
              y: 50,
              width: 700,
              height: 80,
              visible: true,
              locked: false,
              opacity: 1,
              properties: {
                fill: req.color_scheme === 'blue' ? "#3B82F6" : "#6366F1",
                cornerRadius: 8
              }
            },
            {
              id: "fallback_title",
              type: "text",
              name: "Main Title",
              x: 80,
              y: 85,
              width: 640,
              height: 30,
              visible: true,
              locked: false,
              opacity: 1,
              properties: {
                text: req.prompt || "AI-Generated Design",
                fontSize: 24,
                fontFamily: "Inter",
                fontWeight: "bold",
                fill: "#FFFFFF",
                textAlign: "left"
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
