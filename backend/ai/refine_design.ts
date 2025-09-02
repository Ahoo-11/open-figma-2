import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import type { AIRefineDesignRequest, AIRefineDesignResponse } from "./types";

const openRouterKey = secret("OpenRouterKey");

// Refines an existing design using AI based on user feedback.
export const refineDesign = api<AIRefineDesignRequest, AIRefineDesignResponse>(
  { expose: true, method: "POST", path: "/refine-design" },
  async (req) => {
    const systemPrompt = `You are a professional UI/UX designer helping to refine an existing design. You will receive the current design state and a user's refinement request.

Analyze the current design and apply the requested changes while maintaining design consistency and best practices.

Return a JSON object with this exact structure:
{
  "canvas_data": { /* the updated canvas data with refined layers */ },
  "changes_description": "Brief description of what was changed"
}

Rules:
- Keep the same layer structure unless the user specifically requests additions/deletions
- Maintain design consistency
- Only modify what the user specifically requests
- If refining a specific layer (selected_layer_id provided), focus changes on that layer
- Preserve layer IDs and hierarchy
- Make logical color, size, and positioning changes based on the request`;

    const currentDesignJson = JSON.stringify(req.current_canvas_data, null, 2);
    
    let userPrompt = `Current design:\n${currentDesignJson}\n\nUser refinement request: ${req.refinement_prompt}`;
    
    if (req.selected_layer_id) {
      userPrompt += `\n\nFocus refinements on layer ID: ${req.selected_layer_id}`;
    }

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
          temperature: 0.5,
          max_tokens: 3000
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
      
      return {
        canvas_data: parsedResponse.canvas_data || req.current_canvas_data,
        changes_description: parsedResponse.changes_description || "Design refined based on your request"
      };

    } catch (error) {
      console.error("AI refinement error:", error);
      
      // Return original design if AI fails
      return {
        canvas_data: req.current_canvas_data,
        changes_description: "Unable to refine design at this time. Please try again."
      };
    }
  }
);
