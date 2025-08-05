import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Mail, User } from "lucide-react";

export default function StudentLogin() {
  const [loginMethod, setLoginMethod] = useState<"initial" | "email">("initial");
  const [identifier, setIdentifier] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInitialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast({
        title: "Error", 
        description: "Please enter your Student ID or Meraki Email",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/student-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.needsPersonalEmail) {
          setLoginMethod("email");
          toast({
            title: "Account Setup",
            description: "Please provide your personal email for future logins",
          });
        } else {
          toast({
            title: "Success",
            description: "Login successful! Redirecting...",
          });
          window.location.href = "/";
        }
      } else {
        toast({
          title: "Login Failed",
          description: result.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Connection error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter your personal email",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/email-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: personalEmail.trim() }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Login successful! Redirecting...",
        });
        window.location.href = "/";
      } else {
        const error = await response.json();
        toast({
          title: "Login Failed",
          description: error.message || "Email not found",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Connection error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPersonalEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter your personal email",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/set-personal-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          identifier: identifier.trim(),
          personalEmail: personalEmail.trim() 
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Email saved! Login successful! Redirecting...",
        });
        window.location.href = "/";
      } else {
        const error = await response.json();
        toast({
          title: "Setup Failed",
          description: error.message || "Failed to save email",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Connection error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loginMethod === "email") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Mail className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Setup Google Login</CardTitle>
            <CardDescription>
              Link your Google account for easy future access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetPersonalEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="personalEmail">Your Google Email</Label>
                <Input
                  id="personalEmail"
                  type="email"
                  placeholder="Enter your Google email"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">
                  This will be used for Google authentication in future logins
                </p>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Setting up..." : "Setup Google Login"}
              </Button>
            </form>
            
            <div className="mt-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setLoginMethod("initial")}
              >
                Back to Student ID Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <BookOpen className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Student Access</CardTitle>
          <CardDescription>
            Sign in with your Google account to access the learning platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={async () => {
              try {
                // Test OAuth config first
                const configResponse = await fetch('/api/auth/test');
                const config = await configResponse.json();
                console.log('OAuth Config:', config);
                
                // Then redirect to Google OAuth
                window.location.href = "/api/auth/google";
              } catch (error) {
                console.error('OAuth test failed:', error);
                window.location.href = "/api/auth/google";
              }
            }}
            className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700" 
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </Button>
          
          <div className="text-center text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p>After signing in, you'll be prompted to validate your student access.</p>
            <p className="text-xs">New students: Contact admin if validation fails.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}