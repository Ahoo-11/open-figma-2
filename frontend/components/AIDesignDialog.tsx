import React, { useState } from "react";
import { Sparkles, Wand2, Palette, Monitor, Smartphone, FileText, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";

interface AIDesignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDesignGenerated: (canvasData: any, description: string) => void;
  projectId: number;
}

const DESIGN_TEMPLATES = [
  { id: "landing_page", name: "Landing Page", icon: Monitor, description: "Hero section, features, call-to-action" },
  { id: "mobile_app", name: "Mobile App", icon: Smartphone, description: "App interface with navigation" },
  { id: "poster", name: "Poster", icon: FileText, description: "Event or promotional poster" },
  { id: "dashboard", name: "Dashboard", icon: BarChart, description: "Data visualization interface" },
  { id: "presentation", name: "Presentation", icon: FileText, description: "Slide layout design" }
];

const STYLE_OPTIONS = [
  { id: "modern", name: "Modern", description: "Contemporary and sleek" },
  { id: "minimal", name: "Minimal", description: "Clean with lots of whitespace" },
  { id: "playful", name: "Playful", description: "Fun and vibrant" },
  { id: "corporate", name: "Corporate", description: "Professional and trustworthy" },
  { id: "creative", name: "Creative", description: "Artistic and unique" }
];

const COLOR_SCHEMES = [
  { id: "blue", name: "Blue", color: "#3B82F6" },
  { id: "green", name: "Green", color: "#10B981" },
  { id: "purple", name: "Purple", color: "#8B5CF6" },
  { id: "orange", name: "Orange", color: "#F59E0B" },
  { id: "monochrome", name: "Monochrome", color: "#6B7280" },
  { id: "colorful", name: "Colorful", color: "#EC4899" }
];

export function AIDesignDialog({ isOpen, onClose, onDesignGenerated, projectId }: AIDesignDialogProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>("modern");
  const [selectedColorScheme, setSelectedColorScheme] = useState<string>("blue");
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
        design_type: selectedTemplate as any,
        style: selectedStyle as any,
        color_scheme: selectedColorScheme as any,
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
    setSelectedTemplate("");
    setSelectedStyle("modern");
    setSelectedColorScheme("blue");
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
          {/* Design Prompt */}
          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-sm font-medium">What do you want to design?</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., 'A landing page for a fitness app with workout videos and member testimonials' or 'A modern dashboard showing sales analytics with charts and KPIs'"
              className="min-h-[80px] resize-none"
              rows={3}
            />
            <p className="text-xs text-neutral-500">Be specific about content, layout, and purpose for better results.</p>
          </div>

          {/* Design Type Templates */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Design Type (Optional)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {DESIGN_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(selectedTemplate === template.id ? "" : template.id)}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    selectedTemplate === template.id
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                      : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                  }`}
                >
                  <template.icon className={`h-5 w-5 mb-2 ${
                    selectedTemplate === template.id ? "text-primary-600" : "text-neutral-500"
                  }`} />
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-neutral-500 mt-1">{template.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Style Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Design Style</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {STYLE_OPTIONS.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    selectedStyle === style.id
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                      : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                  }`}
                >
                  <div className="font-medium text-sm">{style.name}</div>
                  <div className="text-xs text-neutral-500 mt-1">{style.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Color Scheme */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Color Scheme</Label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {COLOR_SCHEMES.map((scheme) => (
                <button
                  key={scheme.id}
                  onClick={() => setSelectedColorScheme(scheme.id)}
                  className={`p-3 rounded-lg border transition-all text-center ${
                    selectedColorScheme === scheme.id
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                      : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full mx-auto mb-2"
                    style={{ backgroundColor: scheme.color }}
                  />
                  <div className="text-xs font-medium">{scheme.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={generating}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="gradient-primary text-white min-w-[120px]"
          >
            {generating ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Wand2 className="h-4 w-4" />
                <span>Generate Design</span>
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
