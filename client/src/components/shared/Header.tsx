import { Search, User, LogOut, Menu, X, Flame, Settings, Video, BarChart3, FileText, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { StreakDisplay } from "./StreakDisplay";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LiveClassPanel } from '@/components/live-class';
import { SimpleContentProgressPanel } from '@/components/content-management/interactions/progress/SimpleContentProgressPanel';
import { AssignmentPanel } from '@/components/shared';
import { PersonalContentPanel } from '@/components/content-management/activities/personal/PersonalContentPanel';
import { LeaderboardPanel } from '@/components/shared';
import { Content } from '@/hooks/useContent';

interface HeaderProps {
  onContentClick?: (info: { content: Content; contextList: Content[] }) => void;
}

const Header = ({ onContentClick }: HeaderProps) => {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);

  // Check if user is teacher or GV0002
  const isTeacher = user?.id === 'GV0002' || 
                   (user?.category && user.category.toLowerCase().includes('teacher'));

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast({
          title: "Logged out successfully",
          description: "You have been signed out of your account.",
        });
        window.location.href = "/";
      } else {
        toast({
          title: "Logout failed",
          description: "There was an error signing you out.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection error",
        description: "Unable to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogin = () => {
    setLocation("/");
  };

  const handleNavigation = (path: string) => {
    setLocation(path);
    setIsMobileMenuOpen(false);
  };

  const navigationItems = [
    { label: "Bowl & Challenge", path: "/" },
    { label: "Challenge Subject", path: "/challenge-subject" },
    { label: "Debate", path: "/debate" },
    { label: "Writing", path: "/writing" },
    { label: "Assignments", path: "/assignments" },
    ...(isTeacher ? [{ label: "Live Monitor", path: "/live-monitor" }] : []),
    ...(user?.id === 'GV0002' ? [{ label: "Admin", path: "/admin" }] : []),
    { label: "Leaderboard", path: "/leaderboard" },
  ];

  return (
    <>
      <header className="bg-purple-600 text-white px-4 py-3 relative">
        <div className="flex items-center justify-between">
          {/* Mobile: Hamburger + Logo + Actions */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-white rounded flex items-center justify-center">
                <span className="text-purple-600 font-bold text-xs md:text-sm">M</span>
              </div>
              <h1 className="text-lg md:text-xl font-semibold">Meraki WSC</h1>
            </div>
          </div>

          {/* Desktop Navigation - Hidden on mobile */}
          <nav className="hidden md:flex items-center gap-6">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className="text-white hover:text-white/80 transition-colors whitespace-nowrap"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Streak Display - Compact on mobile */}
            {isAuthenticated && user && user.id && (
              <div className="hidden sm:block">
                <StreakDisplay 
                  studentId={user.id} 
                  className="text-white/90 bg-white/10 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm"
                />
              </div>
            )}

            {/* Mobile Streak Badge */}
            {isAuthenticated && user && user.id && (
              <div className="sm:hidden">
                <div className="flex items-center bg-white/10 px-2 py-1 rounded-full">
                  <Flame className="w-3 h-3 text-orange-500" />
                  <span className="text-xs ml-1">1</span>
                </div>
              </div>
            )}

            {/* Search - Desktop full, Mobile icon */}
            <div className="relative">
              {/* Desktop Search */}
              <div className="hidden md:block max-w-md w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search Home"
                  className="pl-10 bg-white/20 border-white/30 text-white placeholder-white/70 focus:bg-white/30 w-48 lg:w-64"
                />
              </div>

              {/* Mobile Search Icon */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="md:hidden p-2 hover:bg-white/20 rounded transition-colors"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>

            {/* Tools Dropdown */}
            <DropdownMenu open={isToolsDropdownOpen} onOpenChange={setIsToolsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-white/20 p-2"
                  aria-label="Tools and Options"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-3 bg-gradient-to-br from-purple-600 to-blue-600 border-purple-400">
                <div className="space-y-3">
                  <LiveClassPanel>
                    <div className="flex items-center justify-between gap-3 cursor-pointer">
                      <span className="text-sm font-medium text-white">Live Class</span>
                    </div>
                  </LiveClassPanel>
                  <SimpleContentProgressPanel>
                    <div className="flex items-center justify-between gap-3 cursor-pointer">
                      <span className="text-sm font-medium text-white">Progress</span>
                    </div>
                  </SimpleContentProgressPanel>
                  <div 
                    className="flex items-center justify-between gap-3 cursor-pointer"
                    onClick={() => setIsToolsDropdownOpen(false)}
                  >
                    <span className="text-sm font-medium text-white">Assignments</span>
                    <AssignmentPanel />
                  </div>
                  {onContentClick && (
                    <div 
                      className="flex items-center justify-between gap-3 cursor-pointer"
                      onClick={() => setIsToolsDropdownOpen(false)}
                    >
                      <span className="text-sm font-medium text-white">Personal Notes</span>
                      <PersonalContentPanel onContentClick={onContentClick} />
                    </div>
                  )}
                  <div 
                    className="flex items-center justify-between gap-3 cursor-pointer"
                    onClick={() => setIsToolsDropdownOpen(false)}
                  >
                    <span className="text-sm font-medium text-white">Leaderboard</span>
                    <LeaderboardPanel />
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-white/20 p-2 md:px-3">
                    <User className="h-4 w-4" />
                    <span className="hidden lg:inline ml-2">
                      {user.full_name || user.first_name || user.id || 'User'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User'}
                  </div>
                  <div className="px-2 py-1 text-xs text-muted-foreground">
                    {user.category || 'Student'} • {user.id || 'Unknown'}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" onClick={handleLogin} className="text-white hover:bg-white/20 p-2">
                <User className="h-4 w-4" />
                <span className="hidden md:inline ml-2">Sign In</span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Search Dropdown */}
        {isSearchOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-purple-600 border-t border-white/20 p-4 z-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search Home"
                className="pl-10 bg-white/20 border-white/30 text-white placeholder-white/70 focus:bg-white/30 w-full"
                autoFocus
              />
            </div>
          </div>
        )}
      </header>

      {/* Mobile Off-Canvas Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-purple-700 shadow-xl">
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-sm">M</span>
                </div>
                <h2 className="text-lg font-semibold text-white">Menu</h2>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors text-white"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="p-4">
              <ul className="space-y-2">
                {navigationItems.map((item) => (
                  <li key={item.path}>
                    <button
                      onClick={() => handleNavigation(item.path)}
                      className="w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>

              {/* Mobile Streak Display in Menu */}
              {isAuthenticated && user && user.id && (
                <div className="mt-6 pt-4 border-t border-white/20">
                  <StreakDisplay 
                    studentId={user.id} 
                    className="text-white/90 bg-white/10 px-3 py-2 rounded-lg"
                  />
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
