import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Mic, Zap, Image } from "lucide-react";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation("/main");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center max-w-2xl mx-auto px-6">
        {/* Logo/Brand Section */}
        <div className="mb-12">
          <div className="w-20 h-20 bg-black rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <Mic className="text-white text-2xl" size={32} />
          </div>
          <h1 className="text-6xl font-bold text-foreground mb-4 tracking-tight">Get Spark</h1>
          <p className="text-xl text-muted-foreground font-medium">Transform your voice into visual stories</p>
        </div>

        {/* Call to Action */}
        <div className="space-y-6">
          <Button 
            onClick={handleGetStarted}
            className="bg-black text-white px-12 py-4 rounded-xl text-lg font-semibold hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg h-auto"
          >
            Get Started
          </Button>
          <p className="text-muted-foreground text-sm">Visualize spoken words with AI-powered imagery</p>
        </div>

        {/* Feature Preview */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-border">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="text-indigo-600" size={24} />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Keyflow Mode</h3>
            <p className="text-muted-foreground text-sm">Auto-generate images from spoken keywords using ClipDrop AI</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-border">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Image className="text-green-600" size={24} />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Img Key Mode</h3>
            <p className="text-muted-foreground text-sm">Map custom images to keywords with personalized timing</p>
          </div>
        </div>
      </div>
    </div>
  );
}
