import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Plus, MicOff, Trash2 } from "lucide-react";
import SpeechDisplay from "@/components/speech-display";
import KeywordsModal from "@/components/keywords-modal";
import ImgKeyModal from "@/components/img-key-modal";
import { useRealTimeSpeech } from "@/hooks/use-real-time-speech";
import { useKeywords } from "@/hooks/use-keywords";
import { useKeywordDetection } from "@/hooks/use-keyword-detection";
import { useImageGeneration } from "@/hooks/use-image-generation";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function MainPage() {
  const [currentMode, setCurrentMode] = useState<'keyflow' | 'imgkey'>('keyflow');
  const [showKeywordsModal, setShowKeywordsModal] = useState(false);
  const [showImgKeyModal, setShowImgKeyModal] = useState(false);
  
  const { keywords } = useKeywords();
  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening,
    speechLines,
    clearSpeech
  } = useRealTimeSpeech();
  
  // clearSpeech function is now provided by the hook
  
  const { displayedImages, generateImage } = useImageGeneration();

  // Debug logging for keyword detection
  useEffect(() => {
    console.log('Speech transcript:', transcript);
    console.log('Speech lines:', speechLines);
    console.log('Current mode:', currentMode);
    console.log('Available keywords:', keywords);
  }, [transcript, speechLines, currentMode, keywords]);

  const handleKeywordDetected = (keyword: string, mode: 'keyflow' | 'imgkey', duration?: number) => {
    console.log(`Keyword detected: ${keyword} in mode: ${mode}, duration: ${duration || 6}`);
    if (mode === 'keyflow') {
      generateImage(keyword, duration || 6);
    }
    // For imgkey mode, we'll implement custom image display later
  };
  
  const { detectedKeywords } = useKeywordDetection({
    transcript,
    speechLines,
    mode: currentMode,
    onKeywordDetected: handleKeywordDetected
  });

  const { data: imgKeyMappings = [] } = useQuery<Array<{
    id: string;
    keyword: string;
    duration: number | null;
    imageUrls: string[];
    bulletPoints: boolean | null;
  }>>({
    queryKey: ['/api/img-key-mappings'],
  });

  const handleModeSwitch = (mode: 'keyflow' | 'imgkey') => {
    setCurrentMode(mode);
    if (mode === 'imgkey') {
      setShowImgKeyModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Header */}
      <header className="bg-white border-b border-border px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg">
              <Mic className="text-primary-foreground" size={20} />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Get Spark</h2>
          </div>

          {/* Top Right Controls */}
          <div className="flex items-center space-x-4">
            {/* Insert Keywords Button */}
            <Button
              variant="outline"
              onClick={() => setShowKeywordsModal(true)}
              className="flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Insert Keywords</span>
            </Button>

            {/* Mode Toggle Buttons */}
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                size="sm"
                variant={currentMode === 'keyflow' ? 'default' : 'ghost'}
                onClick={() => handleModeSwitch('keyflow')}
                className={cn(
                  "text-sm font-medium transition-colors",
                  currentMode === 'keyflow' 
                    ? "bg-primary text-primary-foreground" 
                    : "text-foreground hover:bg-accent"
                )}
              >
                Keyflow Mode
              </Button>
              <Button
                size="sm"
                variant={currentMode === 'imgkey' ? 'default' : 'ghost'}
                onClick={() => handleModeSwitch('imgkey')}
                className={cn(
                  "text-sm font-medium transition-colors",
                  currentMode === 'imgkey' 
                    ? "bg-primary text-primary-foreground" 
                    : "text-foreground hover:bg-accent"
                )}
              >
                Img Key Mode
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Voice Display Box */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Advanced Speech Recognition</h3>
            <div className="flex items-center space-x-3">
              {speechLines.some(line => line.trim()) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSpeech}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={16} className="mr-1" />
                  Clear
                </Button>
              )}
              {isListening && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-600">Recording...</span>
                </div>
              )}
            </div>
          </div>

          <SpeechDisplay 
            speechLines={speechLines}
            transcript={transcript}
            isListening={isListening}
            mode={currentMode}
            detectedKeywords={detectedKeywords}
          />
        </div>

        {/* Generated Images Display - Right below Speech Display */}
        {displayedImages.length > 0 && (
          <div className="mb-6 flex justify-center">
            <div className="max-w-2xl w-full">
              {displayedImages.map((image) => (
                <div key={image.id} className="mb-4 bg-card rounded-lg shadow-lg overflow-hidden">
                  <img
                    src={image.url}
                    alt={`Generated for ${image.keyword}`}
                    className="w-full h-80 object-cover"
                    onError={(e) => {
                      console.error('Failed to load image:', image.url);
                      // Set a guaranteed working placeholder
                      e.currentTarget.src = `data:image/svg+xml;base64,${btoa(`
                        <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
                          <rect width="600" height="400" fill="#f0f0f0"/>
                          <text x="300" y="200" text-anchor="middle" font-family="Arial" font-size="18" fill="#666">
                            ${image.keyword}
                          </text>
                        </svg>
                      `)}`;
                    }}
                  />
                  <div className="p-4 text-center">
                    <h5 className="font-medium text-card-foreground text-lg">{image.keyword}</h5>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer - Active Keywords Count */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-2">
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-sm text-muted-foreground">
            Active Keywords: {keywords.length}
          </span>
        </div>
      </footer>

      {/* Fixed Voice Control Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative mic-wrapper">
          {/* Circular wave animations when listening */}
          {isListening && (
            <>
              <div className="mic-circle"></div>
              <div className="mic-circle"></div>
            </>
          )}
          <Button
            onClick={isListening ? stopListening : startListening}
            className={cn(
              "w-16 h-16 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110",
              isListening 
                ? "voice-button-listening" 
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
          </Button>
        </div>
      </div>

      {/* Modals */}
      {showKeywordsModal && (
        <KeywordsModal
          isOpen={showKeywordsModal}
          onClose={() => setShowKeywordsModal(false)}
        />
      )}

      {showImgKeyModal && (
        <ImgKeyModal
          isOpen={showImgKeyModal}
          onClose={() => setShowImgKeyModal(false)}
          mappings={imgKeyMappings}
        />
      )}
    </div>
  );
}
