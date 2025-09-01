import React from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

export default function CreateProjectDialog({
  isOpen,
  onClose,
  onProjectCreated,
}: CreateProjectDialogProps) {
  const { toast } = useToast();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      return await backend.design.createProject({
        name: name.trim(),
        description: description.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      setName("");
      setDescription("");
      onProjectCreated();
    },
    onError: (error) => {
      console.error("Failed to create project:", error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Start a new design project to organize your creative work.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !name.trim()}
            >
              {createMutation.isPending ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
