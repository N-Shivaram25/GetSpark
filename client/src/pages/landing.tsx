import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Mic, Zap, Image } from "lucide-react";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation("/main");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 right-20 w-24 h-24 bg-blue-300 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-blue-400 rounded-full opacity-25 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/3 right-1/3 w-16 h-16 bg-blue-500 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>
      <div className="text-center max-w-2xl mx-auto px-6 relative z-10">
        {/* Logo/Brand Section */}
        <div className="mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl">
            <Mic className="text-white text-2xl" size={32} />
          </div>
          <h1 className="text-6xl font-bold text-blue-900 mb-4 tracking-tight">Get Spark</h1>
          <p className="text-xl text-blue-700 font-medium">Transform your voice into visual stories</p>
        </div>

        {/* Call to Action */}
        <div className="space-y-6">
          <Button 
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-12 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-2xl h-auto"
          >
            Get Started
          </Button>
          <p className="text-blue-600 text-sm">Visualize spoken words with AI-powered imagery</p>
        </div>

        {/* Feature Preview */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-blue-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="text-blue-600" size={24} />
            </div>
            <h3 className="font-semibold text-blue-900 mb-2">Keyflow Mode</h3>
            <p className="text-blue-700 text-sm">Auto-generate images from spoken keywords using ClipDrop AI</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-blue-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Image className="text-blue-600" size={24} />
            </div>
            <h3 className="font-semibold text-blue-900 mb-2">Img Key Mode</h3>
            <p className="text-blue-700 text-sm">Map custom images to keywords with personalized timing</p>
          </div>
        </div>
      </div>
    </div>
  );
}
