import { Button } from "@/components/ui/button";
import { Mic, Sparkles, Brain, Image as ImageIcon, Zap, ArrowRight, Play } from "lucide-react";
import { useLocation } from "wouter";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Floating particles */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-white/20 rounded-full animate-bounce delay-200"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-blue-400/40 rounded-full animate-bounce delay-700"></div>
        <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-purple-400/30 rounded-full animate-bounce delay-1200"></div>
        <div className="absolute bottom-20 right-20 w-1 h-1 bg-pink-400/40 rounded-full animate-bounce delay-300"></div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-6xl mx-auto">
          
          {/* Main Logo and Title */}
          <div className="mb-12">
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl transform rotate-12 hover:rotate-0 transition-transform duration-500">
                <Sparkles className="text-white" size={60} />
              </div>
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full animate-ping"></div>
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-blue-400 rounded-full animate-pulse delay-500"></div>
            </div>
            
            <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent leading-tight">
              Get Spark
            </h1>
            <p className="text-2xl text-slate-300 mb-4 max-w-3xl mx-auto leading-relaxed">
              Transform your voice into extraordinary visual experiences with cutting-edge AI technology
            </p>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Three powerful modes: AI image generation, custom mappings, and intelligent topic exploration
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
            {/* Keyflow Mode */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="text-white" size={28} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Keyflow Mode</h3>
              <p className="text-slate-300 text-sm">AI-powered image generation from your spoken keywords using advanced ClipDrop technology</p>
            </div>

            {/* Img Key Mode */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <ImageIcon className="text-white" size={28} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Img Key Mode</h3>
              <p className="text-slate-300 text-sm">Custom image-to-keyword mappings with personalized visual experiences and timing controls</p>
            </div>

            {/* Voice to Topic Mode */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Brain className="text-white" size={28} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Voice to Topic</h3>
              <p className="text-slate-300 text-sm">Intelligent educational content with real-time topic analysis, images, and code examples</p>
            </div>
          </div>

          {/* Technology Highlights */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8">Powered by Advanced AI</h2>
            <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/20">
                <Mic className="w-5 h-5 text-blue-400" />
                <span className="text-white font-medium">Web Speech API</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/20">
                <Zap className="w-5 h-5 text-purple-400" />
                <span className="text-white font-medium">Real-Time Processing</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/20">
                <ImageIcon className="w-5 h-5 text-pink-400" />
                <span className="text-white font-medium">ClipDrop API</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/20">
                <Brain className="w-5 h-5 text-green-400" />
                <span className="text-white font-medium">Smart Detection</span>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="space-y-6">
            <Button 
              size="lg" 
              onClick={() => setLocation("/main")}
              className="group px-12 py-6 text-xl font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
            >
              <Play className="w-6 h-6 mr-3 group-hover:translate-x-1 transition-transform" />
              Launch Get Spark
              <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <p className="text-slate-400 text-sm">
              Experience the future of voice-interactive technology
            </p>
          </div>

          {/* Footer */}
          <div className="mt-20 pt-8 border-t border-white/10">
            <p className="text-slate-500 text-sm">
              © 2025 Get Spark. Powered by cutting-edge AI technology.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
