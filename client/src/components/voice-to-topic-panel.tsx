import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Code, Image as ImageIcon, RefreshCw, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface ImageResult {
  url: string;
  title: string;
  source: string;
}

interface TopicInfo {
  definition: string;
  basicCode: string;
  complexCode: string;
  language: string;
  topic: string;
  isComplex: boolean;
}

interface VoiceToTopicPanelProps {
  currentTopic: string;
  isProcessing: boolean;
  onComplexToggle: () => void;
  className?: string;
}

export default function VoiceToTopicPanel({ 
  currentTopic, 
  isProcessing, 
  onComplexToggle,
  className 
}: VoiceToTopicPanelProps) {
  const [images, setImages] = useState<ImageResult[]>([]);
  const [topicInfo, setTopicInfo] = useState<TopicInfo | null>(null);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [showComplex, setShowComplex] = useState(false);

  // Fetch images when topic changes
  useEffect(() => {
    if (currentTopic.trim()) {
      fetchImages(currentTopic);
    }
  }, [currentTopic]);

  // Fetch topic info when topic changes
  useEffect(() => {
    if (currentTopic.trim()) {
      fetchTopicInfo(currentTopic, showComplex);
    }
  }, [currentTopic, showComplex]);

  const fetchImages = async (topic: string) => {
    setIsLoadingImages(true);
    try {
      const response = await apiRequest("POST", "/api/voice-to-topic/images", {
        body: JSON.stringify({ topic }),
        headers: { "Content-Type": "application/json" },
      });
      
      const data = await response.json();
      setImages(data.images || []);
    } catch (error) {
      console.error("Failed to fetch images:", error);
      setImages([]);
    }
    setIsLoadingImages(false);
  };

  const fetchTopicInfo = async (topic: string, isComplex: boolean = false) => {
    setIsLoadingInfo(true);
    try {
      const response = await apiRequest("POST", "/api/voice-to-topic/info", {
        body: JSON.stringify({ topic, isComplex }),
        headers: { "Content-Type": "application/json" },
      });
      
      const data = await response.json();
      setTopicInfo(data);
    } catch (error) {
      console.error("Failed to fetch topic info:", error);
      setTopicInfo(null);
    }
    setIsLoadingInfo(false);
  };

  const handleComplexToggle = () => {
    const newComplexState = !showComplex;
    setShowComplex(newComplexState);
    onComplexToggle();
    
    // Refetch with new complexity level
    if (currentTopic.trim()) {
      fetchTopicInfo(currentTopic, newComplexState);
    }
  };

  const codeToShow = showComplex ? topicInfo?.complexCode : topicInfo?.basicCode;

  return (
    <div className={cn(
      "fixed right-0 top-16 bottom-0 w-96 bg-gradient-to-b from-slate-50 to-white border-l border-slate-200 shadow-2xl overflow-hidden z-10",
      "transform transition-transform duration-300 ease-in-out",
      currentTopic.trim() ? "translate-x-0" : "translate-x-full",
      className
    )}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Voice to Topic</h3>
            {isProcessing && (
              <RefreshCw className="w-4 h-4 animate-spin ml-auto" />
            )}
          </div>
          {currentTopic && (
            <p className="text-blue-100 text-sm mt-1 capitalize">
              {currentTopic}
            </p>
          )}
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {/* Images Section */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <span>Related Images</span>
                  {isLoadingImages && (
                    <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {images.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {images.slice(0, 3).map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.url}
                          alt={image.title}
                          className="w-full h-24 object-cover rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `data:image/svg+xml;base64,${btoa(`
                              <svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">
                                <rect width="200" height="100" fill="#f1f5f9"/>
                                <text x="100" y="50" text-anchor="middle" fill="#64748b" font-size="12">
                                  Image unavailable
                                </text>
                              </svg>
                            `)}`;
                          }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent rounded-b-lg p-2">
                          <p className="text-white text-xs font-medium truncate">
                            {image.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No images found</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Definition Section */}
            {topicInfo && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <Zap className="w-4 h-4 text-green-600" />
                    <span>Definition</span>
                    {isLoadingInfo && (
                      <RefreshCw className="w-3 h-3 animate-spin text-green-600" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-slate-700 text-sm leading-relaxed">
                    {topicInfo.definition}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Code Section */}
            {topicInfo && codeToShow && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2 text-sm">
                      <Code className="w-4 h-4 text-orange-600" />
                      <span>Code Example</span>
                      <Badge variant="secondary" className="text-xs">
                        {topicInfo.language}
                      </Badge>
                    </CardTitle>
                    
                    <Button
                      size="sm"
                      variant={showComplex ? "default" : "outline"}
                      onClick={handleComplexToggle}
                      className="text-xs px-2 py-1 h-auto"
                    >
                      {showComplex ? "Basic" : "Complex"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                    <pre className="text-slate-100 text-xs font-mono whitespace-pre-wrap">
                      {codeToShow}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
            {(isLoadingImages || isLoadingInfo) && (
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm text-slate-600">
                      Loading topic information...
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}