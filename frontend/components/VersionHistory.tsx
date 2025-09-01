import React, { useState, useEffect } from "react";
import { Clock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { DesignVersion } from "~backend/design/types";

interface VersionHistoryProps {
  designFileId: number;
  isOpen: boolean;
  onClose: () => void;
  onVersionRestored: () => void;
}

export function VersionHistory({ designFileId, isOpen, onClose, onVersionRestored }: VersionHistoryProps) {
  const [versions, setVersions] = useState<DesignVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen, designFileId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const response = await backend.design.getDesignVersions({ design_file_id: designFileId });
      setVersions(response.versions);
    } catch (error) {
      console.error("Failed to load versions:", error);
      toast({
        title: "Error",
        description: "Failed to load version history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionNumber: number) => {
    setRestoring(versionNumber);
    try {
      await backend.design.restoreVersion({
        design_file_id: designFileId,
        version_number: versionNumber,
      });
      
      toast({
        title: "Success",
        description: `Restored to version ${versionNumber}`,
      });
      
      onVersionRestored();
      onClose();
    } catch (error) {
      console.error("Failed to restore version:", error);
      toast({
        title: "Error",
        description: "Failed to restore version",
        variant: "destructive",
      });
    } finally {
      setRestoring(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Version History</span>
          </DialogTitle>
          <DialogDescription>
            View and restore previous versions of your design.
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-96 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-center py-4">Loading versions...</div>
          ) : versions.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No saved versions</div>
          ) : (
            versions.map((version) => (
              <Card key={version.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Version {version.version_number}</h4>
                      <p className="text-sm text-gray-500">
                        {new Date(version.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(version.version_number)}
                      disabled={restoring === version.version_number}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      {restoring === version.version_number ? "Restoring..." : "Restore"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
