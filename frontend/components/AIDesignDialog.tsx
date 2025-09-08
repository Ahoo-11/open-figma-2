import React, { useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";

interface AIDesignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDesignGenerated: (canvasData: any, description: string) => void;
  projectId: number;
}

export function AIDesignDialog({ isOpen, onClose, onDesignGenerated }: AIDesignDialogProps) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please describe what you want to design",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const response = await backend.ai.generateDesign({
        prompt: prompt.trim(),
      });

      onDesignGenerated(response.canvas_data, response.design_description);

      toast({
        title: "Success",
        description: "AI design generated successfully!",
      });

      handleClose();
    } catch (error) {
      console.error("Failed to generate design:", error);
      toast({
        title: "Error",
        description: "Failed to generate design. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    setPrompt("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span>AI Design Generator</span>
          </DialogTitle>
          <DialogDescription>
            Describe your design vision and let AI create it for you. You can edit and refine it afterwards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-sm font-medium">What do you want to design?</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., 'A landing page for a fintech app with hero, features, and CTA' or 'A modern dashboard showing sales analytics with charts and KPIs'"
              className="min-h-[100px] resize-none"
              rows={4}
            />
            <p className="text-xs text-neutral-500">Only one prompt is needed. You can refine the design later.</p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={generating}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="gradient-primary text-white min-w-[140px]"
          >
            {generating ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Wand2 className="h-4 w-4" />
                <span>Generate</span>
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
