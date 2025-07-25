import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

interface KeywordsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeywordsModal({ isOpen, onClose }: KeywordsModalProps) {
  const [keywordsText, setKeywordsText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addKeywordsMutation = useMutation({
    mutationFn: async (keywords: string[]) => {
      const response = await apiRequest("POST", "/api/keywords/batch", { keywords });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/keywords'] });
      toast({
        title: "Keywords added successfully",
        description: `Added ${keywordsText.split('\n').filter(k => k.trim()).length} keywords`,
      });
      setKeywordsText("");
      onClose();
    },
    onError: () => {
      toast({
        title: "Error adding keywords",
        description: "Failed to add keywords. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDone = () => {
    const keywords = keywordsText
      .split('\n')
      .map(k => k.trim())
      .filter(k => k.length > 0);
    
    if (keywords.length === 0) {
      toast({
        title: "No keywords entered",
        description: "Please enter at least one keyword.",
        variant: "destructive",
      });
      return;
    }

    addKeywordsMutation.mutate(keywords);
  };

  const handleClear = () => {
    setKeywordsText("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Insert Keywords</DialogTitle>
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

        <div className="space-y-4">
          <div>
            <Label htmlFor="keywords" className="text-sm font-medium text-foreground mb-2 block">
              Add Keywords (one per line)
            </Label>
            <Textarea
              id="keywords"
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              rows={6}
              placeholder="Enter keywords or sentences, one per line...

Example:
sunset
ocean waves
mountain peak"
              className="w-full"
            />
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleDone}
              disabled={addKeywordsMutation.isPending}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {addKeywordsMutation.isPending ? "Adding..." : "Done"}
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={addKeywordsMutation.isPending}
              className="flex-1"
            >
              Clear
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
