
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, BookOpen, Image as ImageIcon, Trophy } from "lucide-react";
import ContentSidebar from "@/components/ContentSidebar";
import { ContentPopup } from "@/components/content";
import { useContentById } from "@/hooks/useContent";
import { useContentImage } from "@/hooks/useContentImage";
import { useState } from "react";

const Content = () => {
  const { id } = useParams<{ id: string }>();
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const { data: content, isLoading, error } = useContentById(id || "");
  const { data: imageUrl, isLoading: isImageLoading } = useContentImage(content?.imageid, content?.imagelink);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-8">
          <p className="text-white">Loading content...</p>
        </Card>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-8">
          <h1 className="text-2xl font-bold text-white mb-4">Content Not Found</h1>
          <p className="text-white/80 mb-6">The requested content could not be found.</p>
          <Link to="/topics">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Topics
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const getContentIcon = (content: any) => {
    if (content.videoid || content.videoid2) return <Play className="h-5 w-5" />;
    if (content.url) return <BookOpen className="h-5 w-5" />;
    return <BookOpen className="h-5 w-5" />;
  };

  const getContentTypeColor = (content: any) => {
    if (content.videoid || content.videoid2) return 'bg-red-500/20 text-red-200';
    if (content.url) return 'bg-blue-500/20 text-blue-200';
    return 'bg-green-500/20 text-green-200';
  };

  const getContentType = (content: any) => {
    if (content.videoid || content.videoid2) return 'video';
    if (content.url) return 'article';
    return 'content';
  };

  const contentType = getContentType(content);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link to="/topics">
            <Button 
              variant="outline" 
              className="border-white/30 text-white hover:bg-white/10 mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Topics
            </Button>
          </Link>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-80 flex-shrink-0 hidden lg:block">
            <ContentSidebar />
          </div>

          {/* Main Content Preview */}
          <div className="flex-1 min-w-0">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 overflow-hidden">
              <div className="relative">
                <div className="w-full h-64 bg-gradient-to-br from-blue-600 via-orange-600 to-red-600 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">{content.title}</span>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge className={`${getContentTypeColor(content)}`}>
                    {getContentIcon(content)}
                    <span className="ml-2 capitalize">{contentType}</span>
                  </Badge>
                </div>
              </div>

              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-3xl">{content.title}</CardTitle>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => setIsPopupOpen(true)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
                      View Details
                    </Button>
                    <Link to="/quiz">
                      <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">
                        <Trophy className="mr-2 h-4 w-4" />
                        Quiz
                      </Button>
                    </Link>
                  </div>
                </div>
                {content.short_description && (
                  <p className="text-white/80 text-lg">{content.short_description}</p>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Quick Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {content.short_blurb && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">Overview</h4>
                      <p className="text-white/80 text-sm">{content.short_blurb}</p>
                    </div>
                  )}

                  {(content.imageid || content.videoid || content.videoid2) && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">Media References</h4>
                      <div className="space-y-2">
                        {content.imageid && (
                          <Badge variant="outline" className="text-white border-white/30">
                            Image ID: {content.imageid}
                          </Badge>
                        )}
                        {content.videoid && (
                          <Badge variant="outline" className="text-white border-white/30">
                            Video ID: {content.videoid}
                          </Badge>
                        )}
                        {content.videoid2 && (
                          <Badge variant="outline" className="text-white border-white/30">
                            Video ID 2: {content.videoid2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <Button 
                    onClick={() => setIsPopupOpen(true)}
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    Open Full Content View
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Content Popup */}
      <ContentPopup 
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        content={content}
        contentList={content ? [content] : []}
        onContentChange={() => {}}
        imageUrl={imageUrl}
        isImageLoading={isImageLoading}
      />
    </div>
  );
};

export default Content;
