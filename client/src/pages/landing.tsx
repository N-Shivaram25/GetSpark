import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Mic, Zap, Image } from "lucide-react";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation("/main");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
      <div className="text-center max-w-2xl mx-auto px-6">
        {/* Logo/Brand Section */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold text-foreground mb-4 tracking-tight">Get Spark</h1>
        </div>

        {/* Call to Action */}
        <div className="space-y-6">
          <Button 
            onClick={handleGetStarted}
            className="bg-primary text-primary-foreground px-12 py-4 rounded-xl text-lg font-semibold hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-lg h-auto"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}
