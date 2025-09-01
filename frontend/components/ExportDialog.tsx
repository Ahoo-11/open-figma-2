import React, { useState } from "react";
import { Download, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";

interface ExportDialogProps {
  designFileId: number;
  designFileName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ExportDialog({ designFileId, designFileName, isOpen, onClose }: ExportDialogProps) {
  const [format, setFormat] = useState<"svg" | "png" | "css">("svg");
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [scale, setScale] = useState(1);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setExporting(true);
    try {
      if (format === "svg") {
        const response = await backend.design.exportSVG({ design_file_id: designFileId });
        
        const blob = new Blob([response.svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${designFileName}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (format === "css") {
        const response = await backend.design.exportCSS({ design_file_id: designFileId });
        
        const blob = new Blob([response.css], { type: 'text/css' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${designFileName}.css`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const response = await backend.design.exportPNG({ 
          design_file_id: designFileId,
          width,
          height,
          scale 
        });
        
        // Convert SVG to PNG on client side
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        canvas.width = width * scale;
        canvas.height = height * scale;
        
        img.onload = () => {
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${designFileName}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }
            }, 'image/png');
          }
        };
        
        const svgBlob = new Blob([response.svg_data], { type: 'image/svg+xml' });
        const svgUrl = URL.createObjectURL(svgBlob);
        img.src = svgUrl;
      }
      
      toast({
        title: "Success",
        description: `Design exported as ${format.toUpperCase()}`,
      });
      
      onClose();
    } catch (error) {
      console.error("Failed to export design:", error);
      toast({
        title: "Error",
        description: "Failed to export design",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileImage className="h-5 w-5" />
            <span>Export Design</span>
          </DialogTitle>
          <DialogDescription>
            Export your design in different formats for sharing or development.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="format">Format</Label>
            <Select value={format} onValueChange={(value: "svg" | "png" | "css") => setFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="svg">SVG (Vector)</SelectItem>
                <SelectItem value="png">PNG (Raster)</SelectItem>
                <SelectItem value="css">CSS (Code)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {format === "png" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="width">Width (px)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(parseInt(e.target.value) || 800)}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (px)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(parseInt(e.target.value) || 600)}
                    min="1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="scale">Scale</Label>
                <Select value={scale.toString()} onValueChange={(value) => setScale(parseFloat(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                    <SelectItem value="3">3x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={exporting}>
              <Download className="h-4 w-4 mr-2" />
              {exporting ? "Exporting..." : "Export"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
