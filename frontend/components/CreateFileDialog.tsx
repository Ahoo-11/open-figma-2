import React, { useState } from "react";
import { FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AIDesignDialog } from "./AIDesignDialog";
import backend from "~backend/client";

interface CreateFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  onFileCreated: (fileId: number) => void;
}

export function CreateFileDialog({ isOpen, onClose, projectId, onFileCreated }: CreateFileDialogProps) {
  const [fileName, setFileName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const { toast } = useToast();

  const handleCreateBlankFile = async () => {
    if (!fileName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a file name",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const response = await backend.design.createDesignFile({
        project_id: projectId,
        name: fileName.trim(),
      });

      toast({
        title: "Success",
        description: "Blank design file created",
      });

      onFileCreated(response.design_file.id);
      handleClose();
    } catch (error) {
      console.error("Failed to create file:", error);
      toast({
        title: "Error",
        description: "Failed to create design file",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleAIDesignGenerated = async (canvasData: any, description: string) => {
    const finalFileName = fileName.trim() || description.slice(0, 50) || "AI Generated Design";

    setCreating(true);
    try {
      const response = await backend.design.createDesignFile({
        project_id: projectId,
        name: finalFileName,
        canvas_data: canvasData,
      });

      toast({
        title: "Success",
        description: "AI design file created successfully!",
      });

      onFileCreated(response.design_file.id);
      handleClose();
    } catch (error) {
      console.error("Failed to create AI design file:", error);
      toast({
        title: "Error",
        description: "Failed to create AI design file",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setFileName("");
    setShowAIDialog(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen && !showAIDialog} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Design File</DialogTitle>
            <DialogDescription>
              Choose how you'd like to start your new design.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* File Name */}
            <div className="space-y-2">
              <Label htmlFor="fileName" className="text-sm font-medium">File Name</Label>
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter file name (optional for AI)"
                className="bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
              />
            </div>

            {/* Creation Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Start with:</Label>
              
              {/* Blank File Option */}
              <Button
                variant="outline"
                className="w-full h-auto p-4 flex items-start space-x-3 text-left"
                onClick={handleCreateBlankFile}
                disabled={creating}
              >
                <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                  <FileText className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Blank File</div>
                  <div className="text-sm text-neutral-500 mt-1">
                    Start with an empty canvas and create from scratch
                  </div>
                </div>
              </Button>

              {/* AI Generated Option */}
              <Button
                variant="outline"
                className="w-full h-auto p-4 flex items-start space-x-3 text-left border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                onClick={() => setShowAIDialog(true)}
                disabled={creating}
              >
                <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium flex items-center space-x-2">
                    <span>AI-Generated Design</span>
                    <span className="text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-2 py-1 rounded-full">New</span>
                  </div>
                  <div className="text-sm text-neutral-500 mt-1">
                    Describe your vision and let AI create a design for you
                  </div>
                </div>
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={creating}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Design Dialog */}
      <AIDesignDialog
        isOpen={showAIDialog}
        onClose={() => setShowAIDialog(false)}
        onDesignGenerated={handleAIDesignGenerated}
        projectId={projectId}
      />
    </>
  );
}
