import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, User, Mail } from "lucide-react";

export default function ValidateAccess() {
  const [studentId, setStudentId] = useState("");
  const [merakiEmail, setMerakiEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get Google user info from session
    fetch('/api/auth/google-user')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setGoogleUser(data.user);
        } else {
          window.location.href = '/';
        }
      })
      .catch(() => {
        window.location.href = '/';
      });
  }, []);

  const handleValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentId.trim() && !merakiEmail.trim()) {
      toast({
        title: "Required Information",
        description: "Please enter either your Student ID or Meraki Email",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/validate-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          studentId: studentId.trim(),
          merakiEmail: merakiEmail.trim()
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Access Granted",
          description: "Welcome! Redirecting to learning platform...",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        toast({
          title: "Validation Failed", 
          description: result.message || "Student ID or Meraki Email not found",
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

  const handleRequestAccess = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/request-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast({
          title: "Access Request Sent",
          description: "Admin has been notified. You'll receive an email when access is approved.",
        });
      } else {
        toast({
          title: "Request Failed",
          description: "Unable to send access request. Please contact admin directly.",
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

  if (!googleUser) {
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
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Validate Your Access</CardTitle>
          <CardDescription>
            Hi {googleUser.firstName}! Please provide your Student ID or Meraki Email to access the learning platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Google Account:</span>
              <span>{googleUser.email}</span>
            </div>
          </div>

          <form onSubmit={handleValidation} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID (if available)</Label>
              <Input
                id="studentId"
                type="text"
                placeholder="Enter your Student ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="merakiEmail">Meraki Email (if available)</Label>
              <Input
                id="merakiEmail"
                type="email"
                placeholder="Enter your Meraki Email"
                value={merakiEmail}
                onChange={(e) => setMerakiEmail(e.target.value)}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || (!studentId.trim() && !merakiEmail.trim())}
            >
              <User className="h-4 w-4 mr-2" />
              {isLoading ? "Validating..." : "Validate Access"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have your Student ID or Meraki Email?
            </p>
            <Button 
              variant="outline"
              onClick={handleRequestAccess}
              disabled={isLoading}
              className="w-full"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Request Access from Admin
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}