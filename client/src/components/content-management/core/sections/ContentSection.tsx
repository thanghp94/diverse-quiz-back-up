
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Book, 
  Trophy, 
  Users, 
  Edit, 
  BarChart3, 
  User,
  Star,
  Award,
  Clock,
  Zap
} from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  starred?: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  link?: string;
}

interface ContentSectionProps {
  title: string;
  icon: React.ReactNode;
  items: ContentItem[];
  color: string;
}

const ContentSection = ({ title, icon, items, color }: ContentSectionProps) => {
  const getDifficultyStars = (difficulty?: string) => {
    if (!difficulty) return null;
    
    const starCount = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
    return (
      <div className="flex gap-1">
        {[...Array(3)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < starCount ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-1 rounded ${color}`}>
          {icon}
        </div>
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => {
          if (item.link) {
            return (
              <Link key={item.id} to={item.link}>
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {item.starred && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      )}
                      <div className={`p-1 rounded ${item.color}`}>
                        {item.icon}
                      </div>
                    </div>
                    {item.difficulty && getDifficultyStars(item.difficulty)}
                  </div>
                  <h3 className="font-medium text-gray-800 text-sm">{item.title}</h3>
                </Card>
              </Link>
            );
          }

          return (
            <Card key={item.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {item.starred && (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  )}
                  <div className={`p-1 rounded ${item.color}`}>
                    {item.icon}
                  </div>
                </div>
                {item.difficulty && getDifficultyStars(item.difficulty)}
              </div>
              <h3 className="font-medium text-gray-800 text-sm">{item.title}</h3>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ContentSection;
