import React from "react";
import { Keyboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsHelp({ isOpen, onClose }: ShortcutsHelpProps) {
  const shortcuts = [
    { key: "V", description: "Select tool" },
    { key: "R", description: "Rectangle tool" },
    { key: "O", description: "Circle tool" },
    { key: "T", description: "Text tool" },
    { key: "H", description: "Pan tool" },
    { key: "Ctrl/Cmd + S", description: "Save design" },
    { key: "Ctrl/Cmd + D", description: "Duplicate selected layer" },
    { key: "Delete", description: "Delete selected layer" },
    { key: "Ctrl/Cmd + Z", description: "Undo (coming soon)" },
    { key: "Ctrl/Cmd + Y", description: "Redo (coming soon)" },
    { key: "Space + Drag", description: "Pan canvas" },
    { key: "Mouse Wheel", description: "Zoom in/out" },
    { key: "Ctrl/Cmd + E", description: "Export design" },
    { key: "?", description: "Show this help" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Keyboard className="h-5 w-5" />
            <span>Keyboard Shortcuts</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {shortcut.description}
              </span>
              <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded border">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
