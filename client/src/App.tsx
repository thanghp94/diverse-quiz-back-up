import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router as WouterRouter, Route, Switch } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import SimpleStudentLogin from "./pages/SimpleStudentLogin";
import SetupEmail from "./pages/SetupEmail";
import Topics from "./pages/Topics";
import Content from "./pages/Content";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";
import DebatePage from "./pages/DebatePage";
import WritingPage from "./pages/WritingPage";
import ChallengeSubject from "./pages/ChallengeSubject";
import Login from "./pages/Login";
import AssignmentPage from "./pages/AssignmentPage";
import LiveClass from "./pages/LiveClass";
import LiveClassPage from "./pages/LiveClassPage";
import AdminPage from "./pages/AdminPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      queryFn: async ({ queryKey }) => {
        let url = queryKey[0] as string;
        
        // Handle live class activities with query parameters
        if (url === '/api/live-class-activities' && queryKey.length > 1) {
          const [, studentIds, startTime] = queryKey;
          if (studentIds && startTime) {
            const params = new URLSearchParams({
              studentIds: Array.isArray(studentIds) ? studentIds.join(',') : String(studentIds),
              startTime: String(startTime)
            });
            url = `${url}?${params.toString()}`;
          }
        }
        
        const response = await fetch(url, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`${response.status}: ${response.statusText}`);
        }
        
        return response.json();
      },
    },
  },
});

function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/setup-email" component={SetupEmail} />
      {!isAuthenticated ? (
        <Route path="/" component={SimpleStudentLogin} />
      ) : (
        <>
          <Route path="/" component={Topics} />
          <Route path="/topics" component={Topics} />
          <Route path="/challenge-subject" component={ChallengeSubject} />
          <Route path="/content/:id" component={Content} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/debate" component={DebatePage} />
          <Route path="/writing" component={WritingPage} />
          <Route path="/assignments" component={AssignmentPage} />
          <Route path="/live-class" component={LiveClass} />
          <Route path="/live-monitor" component={LiveClassPage} />
          <Route path="/admin" component={AdminPage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <WouterRouter>
        <AppRouter />
      </WouterRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
