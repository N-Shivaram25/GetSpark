import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useKeywords } from "@/hooks/use-keywords";
import { X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface KeywordsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeywordsModal({ isOpen, onClose }: KeywordsModalProps) {
  const [keywordsText, setKeywordsText] = useState("");
  const [activeTab, setActiveTab] = useState("add");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { keywords } = useKeywords();

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

  const clearAllKeywordsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/keywords");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/keywords'] });
      toast({
        title: "All keywords cleared",
        description: "All active keywords have been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error clearing keywords",
        description: "Failed to clear keywords. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add">Add Keywords</TabsTrigger>
            <TabsTrigger value="active">Active ({keywords.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="add" className="space-y-4">
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
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <div className="max-h-80 overflow-y-auto">
              {keywords.length > 0 ? (
                <div className="space-y-2">
                  {keywords.map((keyword) => (
                    <div
                      key={keyword.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        keyword.used 
                          ? "bg-muted/50 border-muted text-muted-foreground"
                          : "bg-background border-border"
                      )}
                    >
                      <span className={cn(
                        "font-medium",
                        keyword.used && "line-through"
                      )}>
                        {keyword.keyword}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        {keyword.used ? "Used" : "Ready"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No keywords added yet</p>
                  <p className="text-sm mt-1">Switch to "Add Keywords" tab to get started</p>
                </div>
              )}
            </div>

            {keywords.length > 0 && (
              <div className="border-t pt-4">
                <Button
                  variant="destructive"
                  onClick={() => clearAllKeywordsMutation.mutate()}
                  disabled={clearAllKeywordsMutation.isPending}
                  className="w-full"
                >
                  <Trash2 size={16} className="mr-2" />
                  {clearAllKeywordsMutation.isPending ? "Clearing..." : "Clear All Keywords"}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
