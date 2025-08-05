import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Mail, CheckCircle, User } from "lucide-react";

export default function SetupEmail() {
  const [personalEmail, setPersonalEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Get current user info
    fetch('/api/auth/user')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUserInfo(data.user);
        } else {
          window.location.href = '/';
        }
      })
      .catch(() => {
        window.location.href = '/';
      });
  }, []);

  const handleEmailSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!personalEmail.trim()) {
      toast({
        title: "Required Field",
        description: "Please enter your personal email address",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personalEmail.trim())) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/setup-email", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          personalEmail: personalEmail.trim()
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Email Setup Complete",
          description: "Welcome to the learning platform!",
        });
        window.location.href = "/";
      } else {
        toast({
          title: "Setup Failed", 
          description: result.message || "Unable to save email address",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Unable to connect. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/skip-email-setup", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast({
          title: "Setup Skipped",
          description: "You can add your email later in settings.",
        });
        window.location.href = "/";
      }
    } catch (error) {
      window.location.href = "/";
    } finally {
      setIsLoading(false);
    }
  };

  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Mail className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Setup Personal Email</CardTitle>
          <CardDescription>
            Add your personal email for future updates and notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Welcome:</span>
              <span>{userInfo.full_name || userInfo.id}</span>
            </div>
            {userInfo.meraki_email && (
              <div className="flex items-center gap-2 text-sm mt-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">School Email:</span>
                <span>{userInfo.meraki_email}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleEmailSetup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="personalEmail">Personal Email Address</Label>
              <Input
                id="personalEmail"
                type="email"
                placeholder="your.email@gmail.com"
                value={personalEmail}
                onChange={(e) => setPersonalEmail(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                This will be used for important updates and password recovery
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              <Mail className="h-4 w-4 mr-2" />
              {isLoading ? "Saving..." : "Save Email & Continue"}
            </Button>
          </form>

          <div className="text-center">
            <Button 
              variant="outline"
              onClick={handleSkip}
              disabled={isLoading}
              className="w-full"
            >
              Skip for Now
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              You can add your email later in account settings
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}