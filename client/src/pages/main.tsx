import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Plus, MicOff, Trash2, Brain, Sparkles, Image as ImageIcon } from "lucide-react";
import SpeechDisplay from "@/components/speech-display";
import KeywordsModal from "@/components/keywords-modal";
import ImgKeyModal from "@/components/img-key-modal";
import VoiceToTopicPanel from "@/components/voice-to-topic-panel";
import { useWhisperSpeech } from "@/hooks/use-whisper-speech";
import { useKeywords } from "@/hooks/use-keywords";
import { useKeywordDetection } from "@/hooks/use-keyword-detection";
import { useImageGeneration } from "@/hooks/use-image-generation";
import { useVoiceToTopic } from "@/hooks/use-voice-to-topic";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function MainPage() {
  const [currentMode, setCurrentMode] = useState<'keyflow' | 'imgkey' | 'voicetopic'>('keyflow');
  const [showKeywordsModal, setShowKeywordsModal] = useState(false);
  const [showImgKeyModal, setShowImgKeyModal] = useState(false);
  
  const { keywords } = useKeywords();
  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening,
    speechLines,
    clearSpeech,
    isProcessing
  } = useWhisperSpeech();
  
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
    mode: currentMode === 'voicetopic' ? 'keyflow' : currentMode,
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

  const {
    currentTopic,
    isProcessing: isTopicProcessing,
    isComplexMode,
    toggleComplexMode,
    clearTopic
  } = useVoiceToTopic(transcript);

  const handleModeSwitch = (mode: 'keyflow' | 'imgkey' | 'voicetopic') => {
    // Stop microphone when switching modes
    if (isListening) {
      stopListening();
    }
    
    setCurrentMode(mode);
    if (mode === 'imgkey') {
      setShowImgKeyModal(true);
    }
    if (mode !== 'voicetopic') {
      clearTopic();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-lg border-b border-slate-200/50 px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Get Spark
              </h2>
              <p className="text-sm text-slate-500">Voice Interactive Experience</p>
            </div>
          </div>

          {/* Top Right Controls */}
          <div className="flex items-center space-x-4">
            {/* Insert Keywords Button - Only show for Keyflow mode */}
            {currentMode === 'keyflow' && (
              <Button
                variant="outline"
                onClick={() => setShowKeywordsModal(true)}
                className="flex items-center space-x-2 bg-white/50 backdrop-blur hover:bg-white/80 transition-all shadow-lg"
              >
                <Plus size={16} />
                <span>Insert Keywords</span>
              </Button>
            )}

            {/* Mode Toggle Buttons */}
            <div className="flex bg-white/50 backdrop-blur rounded-xl p-1 shadow-lg">
              <Button
                size="sm"
                variant={currentMode === 'keyflow' ? 'default' : 'ghost'}
                onClick={() => handleModeSwitch('keyflow')}
                className={cn(
                  "text-sm font-medium transition-all flex items-center space-x-2 px-4",
                  currentMode === 'keyflow' 
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" 
                    : "text-slate-600 hover:bg-white/80"
                )}
              >
                <Sparkles className="w-4 h-4" />
                <span>Keyflow</span>
              </Button>
              <Button
                size="sm"
                variant={currentMode === 'imgkey' ? 'default' : 'ghost'}
                onClick={() => handleModeSwitch('imgkey')}
                className={cn(
                  "text-sm font-medium transition-all flex items-center space-x-2 px-4",
                  currentMode === 'imgkey' 
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" 
                    : "text-slate-600 hover:bg-white/80"
                )}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Img Key</span>
              </Button>
              <Button
                size="sm"
                variant={currentMode === 'voicetopic' ? 'default' : 'ghost'}
                onClick={() => handleModeSwitch('voicetopic')}
                className={cn(
                  "text-sm font-medium transition-all flex items-center space-x-2 px-4",
                  currentMode === 'voicetopic' 
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" 
                    : "text-slate-600 hover:bg-white/80"
                )}
              >
                <Brain className="w-4 h-4" />
                <span>Voice Topic</span>
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
            mode={currentMode === 'voicetopic' ? 'keyflow' : currentMode}
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
      <div className="fixed bottom-8 right-8 z-50">
        <div className="relative mic-wrapper">
          {/* Enhanced circular wave animations when listening */}
          {isListening && (
            <>
              <div className="mic-circle"></div>
              <div className="mic-circle"></div>
              <div className="mic-circle"></div>
            </>
          )}
          <Button
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            className={cn(
              "w-20 h-20 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden",
              isListening 
                ? "voice-button-listening" 
                : isProcessing
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
            )}
          >
            {isProcessing ? (
              <div className="animate-spin">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
              </div>
            ) : isListening ? (
              <MicOff size={28} />
            ) : (
              <Mic size={28} />
            )}
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

      {/* Voice to Topic Panel */}
      {currentMode === 'voicetopic' && (
        <VoiceToTopicPanel
          currentTopic={currentTopic}
          isProcessing={isTopicProcessing || isProcessing}
          onComplexToggle={toggleComplexMode}
        />
      )}
    </div>
  );
}
