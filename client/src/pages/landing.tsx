import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Mic, Zap, Image } from "lucide-react";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation("/main");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black particle-bg relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full opacity-20 float-animation" 
             style={{ background: 'radial-gradient(circle, #ff0080, transparent)', animationDelay: '0s' }}></div>
        <div className="absolute top-1/3 right-20 w-24 h-24 rounded-full opacity-30 float-animation" 
             style={{ background: 'radial-gradient(circle, #00ff80, transparent)', animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 rounded-full opacity-25 float-animation" 
             style={{ background: 'radial-gradient(circle, #8000ff, transparent)', animationDelay: '4s' }}></div>
        <div className="absolute bottom-1/3 right-1/3 w-16 h-16 rounded-full opacity-20 float-animation" 
             style={{ background: 'radial-gradient(circle, #00ffff, transparent)', animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-40 h-40 rounded-full opacity-10 float-animation" 
             style={{ background: 'radial-gradient(circle, #ff8000, transparent)', animationDelay: '3s' }}></div>
      </div>
      <div className="text-center max-w-2xl mx-auto px-6 relative z-10">
        {/* Logo/Brand Section */}
        <div className="mb-12">
          <div className="w-20 h-20 gradient-shift rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl glass-morph float-animation">
            <Mic className="text-white text-2xl drop-shadow-lg" size={32} />
          </div>
          <h1 className="text-6xl font-bold text-white mb-4 tracking-tight neon-text">Get Spark</h1>
          <p className="text-xl text-gray-300 font-medium">Transform your voice into visual stories</p>
        </div>

        {/* Call to Action */}
        <div className="space-y-6">
          <Button 
            onClick={handleGetStarted}
            className="gradient-shift text-black px-12 py-4 rounded-xl text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl h-auto glass-morph border-2 border-white/20"
          >
            Get Started
          </Button>
          <p className="text-gray-400 text-sm">Visualize spoken words with AI-powered imagery</p>
        </div>

        {/* Feature Preview */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div className="glass-morph p-6 rounded-xl shadow-2xl border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 group">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="text-white" size={24} />
            </div>
            <h3 className="font-semibold text-white mb-2">Keyflow Mode</h3>
            <p className="text-gray-300 text-sm">Auto-generate images from spoken keywords using ClipDrop AI</p>
          </div>
          <div className="glass-morph p-6 rounded-xl shadow-2xl border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 group">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Image className="text-white" size={24} />
            </div>
            <h3 className="font-semibold text-white mb-2">Img Key Mode</h3>
            <p className="text-gray-300 text-sm">Map custom images to keywords with personalized timing</p>
          </div>
        </div>
      </div>
    </div>
  );
}
