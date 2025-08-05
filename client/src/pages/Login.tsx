import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { GraduationCap, Mail, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [loginMethod, setLoginMethod] = useState<"email" | "id">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const loginValue = loginMethod === "email" ? email : userId;
      const endpoint = loginMethod === "email" ? `/api/users/by-email/${encodeURIComponent(loginValue)}` : `/api/users/${userId}`;
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error("User not found");
      }
      
      const user = await response.json();
      
      // Store user session
      localStorage.setItem("currentUser", JSON.stringify(user));
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.full_name || user.first_name || user.id}!`,
      });
      
      // Redirect to topics page
      setLocation("/topics");
      
    } catch (error) {
      toast({
        title: "Login failed",
        description: "User not found. Please check your email or student ID.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to access your learning platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Login Method Selection */}
          <div className="flex rounded-lg border p-1 bg-muted">
            <button
              type="button"
              onClick={() => setLoginMethod("email")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                loginMethod === "email"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod("id")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                loginMethod === "id"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="w-4 h-4" />
              Student ID
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginMethod === "email" ? (
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email or @meraki.edu.vn email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Use your regular email or Meraki email address
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="userId">Student/Teacher ID</Label>
                <Input
                  id="userId"
                  type="text"
                  placeholder="Enter your ID (e.g., HS0105, GV0002)"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Use your student ID (HS...) or teacher ID (GV...)
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-11" 
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <Separator />

          <Alert>
            <AlertDescription className="text-sm">
              <strong>Login Options:</strong>
              <br />
              • Email: Use your @meraki.edu.vn email or regular email
              <br />
              • Student ID: Use your assigned ID (HS#### for students, GV#### for teachers)
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;