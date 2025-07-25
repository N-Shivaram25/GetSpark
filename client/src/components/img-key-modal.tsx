import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X, Upload, Trash2 } from "lucide-react";
import type { ImgKeyMapping } from "@shared/schema";

interface ImgKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  mappings: ImgKeyMapping[];
}

export default function ImgKeyModal({ isOpen, onClose, mappings }: ImgKeyModalProps) {
  const [keyword, setKeyword] = useState("");
  const [duration, setDuration] = useState(6);
  const [bulletPoints, setBulletPoints] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addMappingMutation = useMutation({
    mutationFn: async (data: { keyword: string; duration: number; bulletPoints: boolean; files: File[] }) => {
      const formData = new FormData();
      formData.append('keyword', data.keyword);
      formData.append('duration', data.duration.toString());
      formData.append('bulletPoints', data.bulletPoints.toString());
      
      data.files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch('/api/img-key-mappings', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create mapping');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/img-key-mappings'] });
      toast({
        title: "Mapping saved successfully",
        description: `Created mapping for "${keyword}"`,
      });
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error saving mapping",
        description: "Failed to save mapping. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMappingMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/img-key-mappings/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/img-key-mappings'] });
      toast({
        title: "Mapping deleted",
        description: "The mapping has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error deleting mapping",
        description: "Failed to delete mapping. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setKeyword("");
    setDuration(6);
    setBulletPoints(false);
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleSaveMapping = () => {
    if (!keyword.trim()) {
      toast({
        title: "Keyword required",
        description: "Please enter a keyword or sentence.",
        variant: "destructive",
      });
      return;
    }

    addMappingMutation.mutate({
      keyword: keyword.trim(),
      duration,
      bulletPoints,
      files: selectedFiles,
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Img Key Mode Configuration</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X size={16} />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Keyword/Sentence Input */}
          <div>
            <Label htmlFor="keyword" className="text-sm font-medium text-foreground mb-2 block">
              Keyword or Sentence
            </Label>
            <Input
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter keyword or sentence to map"
            />
          </div>

          {/* Image Upload Area */}
          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">
              Upload Images
            </Label>
            <div className="space-y-3">
              <div 
                className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer bg-muted/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Upload className="mx-auto text-muted-foreground mb-2" size={24} />
                <p className="text-foreground">Drop images here or click to upload</p>
                <p className="text-sm text-muted-foreground mt-1">You can add multiple images one by one</p>
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="flex items-center justify-between text-sm text-foreground bg-muted p-2 rounded-lg border border-border">
                  <span>{selectedFiles.length} image(s) selected</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFiles([])}
                    className="text-muted-foreground hover:text-foreground h-auto p-1"
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </div>
            
            {selectedFiles.length > 0 && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                {selectedFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-20 object-cover rounded-lg border border-border"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFile(index)}
                    >
                      <X size={12} />
                    </Button>
                    <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Display Duration */}
          <div>
            <Label htmlFor="duration" className="text-sm font-medium text-foreground mb-2 block">
              Display Duration (seconds)
            </Label>
            <Input
              id="duration"
              type="number"
              min={1}
              max={60}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 6)}
            />
          </div>

          {/* Bullet Points Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="bulletPoints"
              checked={bulletPoints}
              onCheckedChange={(checked) => setBulletPoints(checked as boolean)}
            />
            <Label htmlFor="bulletPoints" className="text-sm font-medium text-foreground">
              Show as bullet points
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleSaveMapping}
              disabled={addMappingMutation.isPending}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {addMappingMutation.isPending ? "Saving..." : "Save Mapping"}
            </Button>
            <Button
              variant="outline"
              onClick={resetForm}
              disabled={addMappingMutation.isPending}
            >
              Clear
            </Button>
          </div>

          {/* Existing Mappings */}
          {mappings.length > 0 && (
            <div className="pt-6 border-t border-border">
              <h4 className="font-medium text-foreground mb-3">Current Mappings</h4>
              <div className="space-y-3">
                {mappings.map((mapping) => (
                  <div key={mapping.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{mapping.keyword}</p>
                      <p className="text-sm text-muted-foreground">
                        {mapping.imageUrls.length} image(s) • {mapping.duration}s • 
                        {mapping.bulletPoints ? " With bullets" : " No bullets"}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMappingMutation.mutate(mapping.id)}
                      disabled={deleteMappingMutation.isPending}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
