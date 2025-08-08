import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Lock, BookOpen, Trophy, Users, Star, Globe, Zap, Brain } from "lucide-react";
import merakiLogo from "@assets/MERAKI new logo vo6-03_1750301582337.png";

export default function SimpleStudentLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identifier.trim() || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both Student ID/Email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          identifier: identifier.trim(),
          password: password
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Login Successful!",
          description: "Welcome to the platform",
        });
        
        // Wait briefly for session to be saved, then redirect
        setTimeout(() => {
          if (result.needsEmailSetup) {
            window.location.href = "/setup-email";
          } else {
            window.location.href = "/";
          }
        }, 500);
      } else {
        toast({
          title: "Login Failed",
          description: result.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Unable to connect to the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: BookOpen, title: "Interactive Learning", description: "Engaging content modules" },
    { icon: Trophy, title: "Competitions", description: "Bowl & Challenge events" },
    { icon: Users, title: "Team Building", description: "Collaborate with peers" },
    { icon: Star, title: "Track Progress", description: "Monitor your achievements" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-bounce"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-yellow-300/20 rounded-full animate-pulse"></div>
        <div className="absolute bottom-32 left-1/4 w-12 h-12 bg-pink-300/20 rounded-full animate-bounce delay-1000"></div>
        <div className="absolute bottom-20 right-1/3 w-14 h-14 bg-green-300/20 rounded-full animate-pulse delay-500"></div>
        
        {/* Floating Icons */}
        <Globe className="absolute top-32 right-32 w-8 h-8 text-white/20 animate-spin" style={{animationDuration: '20s'}} />
        <Zap className="absolute bottom-40 left-20 w-6 h-6 text-yellow-300/30 animate-pulse" />
        <Brain className="absolute top-1/2 left-10 w-7 h-7 text-pink-300/30 animate-bounce" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Branding & Features */}
          <div className="text-center lg:text-left space-y-8">
            {/* Logo and Title */}
            <div className="space-y-6">
              <div className="flex items-center justify-center lg:justify-start gap-4">
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
                    Meraki
                  </h1>
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-2xl lg:text-3xl font-semibold text-white">
                  World Scholar Cup Excellence
                </h2>
                <p className="text-lg text-white/90 max-w-lg">
                  Unlock your potential, master new skills, and join a community of global scholars ready to change the world.
                </p>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto lg:mx-0">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-all duration-300"
                >
                  <feature.icon className="w-8 h-8 text-white mb-2 mx-auto lg:mx-0" />
                  <h3 className="font-semibold text-white text-sm">{feature.title}</h3>
                  <p className="text-white/80 text-xs">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex justify-center lg:justify-start gap-8 text-center">
              <div>
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-white/80 text-sm">Students</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">50+</div>
                <div className="text-white/80 text-sm">Topics</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">20+</div>
                <div className="text-white/80 text-sm">Countries</div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md shadow-2xl bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl overflow-hidden">
              <CardHeader className="space-y-6 text-center pb-8 pt-8">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 rounded-full flex items-center justify-center mx-auto shadow-xl">
                  <User className="text-white w-10 h-10" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold text-white mb-3">Welcome Back!</CardTitle>
                  <CardDescription className="text-white/90 text-lg">
                    Sign in to continue your learning journey
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-8 px-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-white">Student ID or Email</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        type="text"
                        placeholder="Enter your Student ID or Meraki Email"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="pl-12 h-14 border-2 border-white/30 focus:border-white focus:ring-2 focus:ring-white/20 rounded-xl text-base transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder:text-white/70"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-white">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 h-14 border-2 border-white/30 focus:border-white focus:ring-2 focus:ring-white/20 rounded-xl text-base transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder:text-white/70"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-14 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 hover:from-purple-700 hover:via-blue-700 hover:to-cyan-600 text-white font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 rounded-xl"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Signing you in...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-3 h-6 w-6" />
                        Start Learning
                      </>
                    )}
                  </Button>
                </form>
                
                <div className="text-center space-y-4 pt-4">
                  <div className="flex items-center gap-3 justify-center text-green-600 bg-green-50 p-3 rounded-xl border border-green-200">
                    <Star className="w-5 h-5" />
                    <span className="text-sm font-semibold">Ready for World Scholar Cup success!</span>
                  </div>
                  <p className="text-sm text-white/70">
                    Need help? Contact your teacher or administrator
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}