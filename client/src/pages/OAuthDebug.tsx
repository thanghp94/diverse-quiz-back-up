import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OAuthDebug() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/auth/test');
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Failed to fetch config:', error);
    }
  };

  const testDirectOAuth = () => {
    if (config?.directOAuthURL) {
      window.location.href = config.directOAuthURL;
    }
  };

  const testPassportOAuth = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Google OAuth Debug</CardTitle>
          <CardDescription>Test and verify OAuth configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config && (
            <div className="bg-gray-50 p-4 rounded-lg text-sm">
              <h3 className="font-semibold mb-2">Current Configuration:</h3>
              <p><strong>Domain:</strong> {config.domain}</p>
              <p><strong>Callback URL:</strong> {config.callbackURL}</p>
              <p><strong>Client ID:</strong> {config.googleClientId}</p>
              <p><strong>Client Secret:</strong> {config.googleClientSecret}</p>
              <p><strong>Current URL:</strong> {config.currentURL}</p>
              <p><strong>Timestamp:</strong> {config.timestamp}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Button onClick={testPassportOAuth} className="w-full">
              Test Passport Google OAuth
            </Button>
            <Button onClick={testDirectOAuth} variant="outline" className="w-full">
              Test Direct Google OAuth URL
            </Button>
            <Button onClick={fetchConfig} variant="ghost" className="w-full">
              Refresh Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}