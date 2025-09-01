import React from "react";
import { Keyboard } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  const shortcuts = [
    { keys: ["V"], description: "Select tool" },
    { keys: ["R"], description: "Rectangle tool" },
    { keys: ["O"], description: "Circle tool" },
    { keys: ["T"], description: "Text tool" },
    { keys: ["Space"], description: "Pan tool (hold)" },
    { keys: ["Cmd", "S"], description: "Save" },
    { keys: ["Cmd", "Z"], description: "Undo" },
    { keys: ["Cmd", "Shift", "Z"], description: "Redo" },
    { keys: ["Cmd", "D"], description: "Duplicate" },
    { keys: ["Delete"], description: "Delete selected" },
    { keys: ["Cmd", "A"], description: "Select all" },
    { keys: ["Escape"], description: "Deselect" },
    { keys: ["Cmd", "+"], description: "Zoom in" },
    { keys: ["Cmd", "-"], description: "Zoom out" },
    { keys: ["Cmd", "0"], description: "Zoom to fit" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Keyboard className="h-5 w-5" />
            <span>Keyboard Shortcuts</span>
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to speed up your workflow.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <span className="text-sm">{shortcut.description}</span>
              <div className="flex space-x-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <kbd
                    key={keyIndex}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded border"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
