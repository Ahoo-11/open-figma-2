import React, { useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { CanvasData } from "~backend/design/types";

interface AIRefineDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDesignRefined: (canvasData: CanvasData, description: string) => void;
  currentCanvasData: CanvasData;
  selectedLayerId?: string | null;
}

const REFINEMENT_SUGGESTIONS = [
  "Make the colors more vibrant and modern",
  "Increase spacing between elements",
  "Make the text larger and more readable",
  "Change to a darker color scheme",
  "Make the layout more minimal",
  "Add more visual hierarchy",
  "Improve the color contrast",
  "Make it look more professional"
];

export function AIRefineDialog({ 
  isOpen, 
  onClose, 
  onDesignRefined, 
  currentCanvasData, 
  selectedLayerId 
}: AIRefineDialogProps) {
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [refining, setRefining] = useState(false);
  const { toast } = useToast();

  const handleRefine = async () => {
    if (!refinementPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please describe how you'd like to refine the design",
        variant: "destructive",
      });
      return;
    }

    setRefining(true);
    try {
      const response = await backend.ai.refineDesign({
        current_canvas_data: currentCanvasData,
        refinement_prompt: refinementPrompt.trim(),
        selected_layer_id: selectedLayerId || undefined,
      });

      onDesignRefined(response.canvas_data, response.changes_description);
      
      toast({
        title: "Success",
        description: "Design refined successfully!",
      });
      
      handleClose();
    } catch (error) {
      console.error("Failed to refine design:", error);
      toast({
        title: "Error",
        description: "Failed to refine design. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefining(false);
    }
  };

  const handleClose = () => {
    setRefinementPrompt("");
    onClose();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setRefinementPrompt(suggestion);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span>AI Design Refinement</span>
          </DialogTitle>
          <DialogDescription>
            {selectedLayerId 
              ? "Describe how you'd like to refine the selected layer."
              : "Describe how you'd like to improve the overall design."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Refinement Prompt */}
          <div className="space-y-2">
            <Label htmlFor="refinement" className="text-sm font-medium">
              What would you like to change?
            </Label>
            <Textarea
              id="refinement"
              value={refinementPrompt}
              onChange={(e) => setRefinementPrompt(e.target.value)}
              placeholder="E.g., 'Make the header darker and increase the font size' or 'Change the color scheme to be more professional'"
              className="min-h-[80px] resize-none"
              rows={3}
            />
          </div>

          {/* Quick Suggestions */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Quick suggestions:
            </Label>
            <div className="grid grid-cols-1 gap-2">
              {REFINEMENT_SUGGESTIONS.slice(0, 4).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-left p-2 text-xs bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors text-neutral-700 dark:text-neutral-300"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={refining}>
            Cancel
          </Button>
          <Button
            onClick={handleRefine}
            disabled={refining || !refinementPrompt.trim()}
            className="gradient-primary text-white min-w-[100px]"
          >
            {refining ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Refining...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Wand2 className="h-4 w-4" />
                <span>Refine</span>
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
