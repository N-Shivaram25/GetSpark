import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Plus, MicOff } from "lucide-react";
import SpeechDisplay from "@/components/speech-display";
import KeywordsModal from "@/components/keywords-modal";
import ImgKeyModal from "@/components/img-key-modal";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useKeywords } from "@/hooks/use-keywords";
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
    detectedKeywords,
    bulletPoints,
    displayedImages
  } = useSpeechRecognition(currentMode);

  const { data: imgKeyMappings = [] } = useQuery({
    queryKey: ['/api/img-key-mappings'],
  });

  const handleModeSwitch = (mode: 'keyflow' | 'imgkey') => {
    setCurrentMode(mode);
    if (mode === 'imgkey') {
      setShowImgKeyModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-black particle-bg relative">
      {/* Header */}
      <header className="glass-morph border-b border-purple-500/30 px-6 py-4 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 gradient-shift rounded-lg flex items-center justify-center shadow-lg">
              <Mic className="text-white drop-shadow-lg" size={20} />
            </div>
            <h2 className="text-2xl font-bold text-white neon-text">Get Spark</h2>
          </div>

          {/* Top Right Controls */}
          <div className="flex items-center space-x-4">
            {/* Insert Keywords Button - Only show in Keyflow mode */}
            {currentMode === 'keyflow' && (
              <Button
                variant="outline"
                onClick={() => setShowKeywordsModal(true)}
                className="flex items-center space-x-2 border-purple-500/50 text-purple-300 hover:bg-purple-500/20 hover:text-white glass-morph"
              >
                <Plus size={16} />
                <span>Insert Keywords</span>
              </Button>
            )}

            {/* Mode Toggle Buttons */}
            <div className="flex glass-morph rounded-lg p-1 border border-purple-500/30">
              <Button
                size="sm"
                variant={currentMode === 'keyflow' ? 'default' : 'ghost'}
                onClick={() => handleModeSwitch('keyflow')}
                className={cn(
                  "text-sm font-medium transition-colors",
                  currentMode === 'keyflow' 
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700" 
                    : "text-purple-300 hover:bg-purple-500/20 hover:text-white"
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
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-700 hover:to-blue-700" 
                    : "text-purple-300 hover:bg-purple-500/20 hover:text-white"
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
            <h3 className="text-lg font-semibold text-white">Live Speech</h3>
            <div className="flex items-center space-x-3">
              {isListening && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-400">Recording...</span>
                </div>
              )}
            </div>
          </div>

          <SpeechDisplay 
            speechLines={speechLines}
            transcript={transcript}
          />
        </div>

        {/* Keywords Status - Only show in Keyflow mode */}
        {currentMode === 'keyflow' && (
          <div className="mb-6 p-4 glass-morph rounded-lg border border-purple-500/30 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-white">Active Keywords</h4>
              <span className="text-sm text-purple-300">{keywords.length} keywords loaded</span>
            </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {keywords.length > 0 ? (
              keywords.map((keyword) => (
                <span
                  key={keyword.id}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm border",
                    keyword.used 
                      ? "bg-gray-800 text-gray-500 line-through border-gray-600"
                      : "bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 border-purple-500/50"
                  )}
                >
                  {keyword.keyword}
                </span>
              ))
            ) : (
              <span className="text-sm text-purple-300 italic">No keywords added yet</span>
            )}
          </div>
        </div>
        )}

        {/* Img Key Mode Bullet Points Area */}
        {currentMode === 'imgkey' && (
          <div className="mb-6">
            <div className="mt-4 space-y-3">
              {bulletPoints.map((point, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-foreground">{point}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image Display Area */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedImages.map((image) => (
              <div
                key={image.id}
                className="relative bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-500"
              >
                <img
                  src={image.url}
                  alt={image.keyword}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h4 className="font-semibold text-foreground">{image.keyword}</h4>
                  <p className="text-sm text-muted-foreground">
                    {image.source === 'clipdrop' ? 'Generated by ClipDrop API' : 'Custom Image'}
                  </p>
                </div>
                {image.timeLeft > 0 && (
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                    {image.timeLeft}s
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Fixed Voice Control Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          {/* Animated waves when listening */}
          {isListening && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-purple-400 animate-ping opacity-75"></div>
              <div className="absolute inset-0 rounded-full border-2 border-pink-400 animate-ping opacity-50" style={{ animationDelay: '0.5s' }}></div>
            </>
          )}
          <Button
            onClick={isListening ? stopListening : startListening}
            className={cn(
              "w-16 h-16 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 glass-morph border-2",
              isListening 
                ? "bg-red-500 hover:bg-red-600 animate-pulse-recording border-red-400/50" 
                : "gradient-shift border-purple-500/50 hover:border-purple-400"
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
