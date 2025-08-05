
import { Link, useLocation } from "wouter";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Bowl & Challenge", href: "/topics" },
  { name: "Debate", href: "/debate" },
  { name: "Writing", href: "/writing" },
  { name: "Leaderboard", href: "/leaderboard" },
  { name: "Matching", href: "/matching" },
];

const SharedNav = () => {
  const [location] = useLocation();
  const activeTab = navItems.find(item => location.startsWith(item.href))?.href;

  return (
    <div className="mb-6 flex justify-center">
      <Tabs value={activeTab} className="w-auto">
        <TabsList className="bg-purple-500/20 p-1 rounded-lg">
          {navItems.map((item) => (
            <TabsTrigger
              key={item.href}
              value={item.href}
              asChild
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-sm",
                "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <Link to={item.href}>{item.name}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};

export default SharedNav;
