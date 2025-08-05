import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronDown, ChevronUp, Play, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import ContentPopup from '@/components/ContentPopup';
import { trackContentAccess, getCurrentUserId } from '@/lib/contentTracking';

interface Topic {
  id: string;
  topic: string;
  short_summary: string | null;
  challengesubject: string | null;
  image: string;
  parentid: string | null;
  showstudent: boolean;
}

interface Content {
  id: string;
  topicid: string;
  imageid: string | null;
  videoid: string | null;
  videoid2: string | null;
  challengesubject: string[] | null;
  parentid: string | null;
  prompt: string;
  information: string;
  title?: string;
  short_blurb?: string;
  short_description?: string;
}

interface Image {
  id: string;
  imagelink: string | null;
  contentid: string | null;
  default: string | null;
}

export default function DebatePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [openTopics, setOpenTopics] = useState<Set<string>>(new Set());
  const [selectedContentInfo, setSelectedContentInfo] = useState<{
    content: Content;
    contextList: Content[];
    imageUrl: string | null;
    quizLevel?: 'easy' | 'hard' | null;
  } | null>(null);

  const { data: bowlChallengeTopics = [], isLoading: bowlTopicsLoading } = useQuery<Topic[]>({
    queryKey: ['/api/topics/bowl-challenge'],
  });

  const { data: allTopics = [], isLoading: allTopicsLoading } = useQuery<Topic[]>({
    queryKey: ['/api/topics'],
  });

  const { data: content = [], isLoading: contentLoading } = useQuery<Content[]>({
    queryKey: ['/api/content'],
  });

  const { data: images = [], isLoading: imagesLoading } = useQuery<Image[]>({
    queryKey: ['/api/images'],
  });

  // Filter for debate topics and content
  const debateTopics = allTopics.filter(topic => 
    topic.challengesubject === 'debate' || topic.parentid === 'debate'
  );

  const debateContent = content.filter(item => item.parentid === 'debate');

  // Filter based on search term
  const filteredDebateTopics = debateTopics.filter(topic =>
    topic.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.short_summary?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDebateContent = debateContent.filter(item =>
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.short_blurb?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.information?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create topic hierarchy for debate
  const topicHierarchy = React.useMemo(() => {
    const mainTopics = filteredDebateTopics.filter(topic => !topic.parentid || topic.parentid === 'debate');
    
    return mainTopics.map(mainTopic => {
      const subTopics = filteredDebateTopics.filter(topic => topic.parentid === mainTopic.id);
      const topicContent = filteredDebateContent.filter(item => item.topicid === mainTopic.id);
      
      return {
        ...mainTopic,
        subTopics,
        content: topicContent
      };
    });
  }, [filteredDebateTopics, filteredDebateContent]);

  const toggleTopic = (topicId: string) => {
    const newOpenTopics = new Set(openTopics);
    if (newOpenTopics.has(topicId)) {
      newOpenTopics.delete(topicId);
    } else {
      newOpenTopics.add(topicId);
    }
    setOpenTopics(newOpenTopics);
  };

  const findImageUrl = (content: Content): string | null => {
    if (content.imageid && images) {
      const image = images.find(img => img.id === content.imageid);
      if (image && image.imagelink) {
        return image.imagelink;
      }
    }
    return null;
  };

  const handleContentClick = (content: Content, contextList: Content[]) => {
    setSelectedContentInfo({
      content,
      contextList,
      imageUrl: findImageUrl(content),
    });
    
    // Track content access when student clicks on content
    const currentUserId = getCurrentUserId();
    if (currentUserId) {
      trackContentAccess(currentUserId, content.id);
    }
  };

  const closePopup = useCallback(() => {
    setSelectedContentInfo(null);
  }, []);

  const isLoading = bowlTopicsLoading || allTopicsLoading || contentLoading || imagesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700">
        <Header />
        <div className="text-center py-8">
          <div className="text-center py-8 text-white">Loading debate content...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <MessageSquare className="h-10 w-10 text-white" />
            <h1 className="text-4xl font-bold text-white">Debate Center</h1>
          </div>
          <p className="text-white/90 text-lg mb-6">
            Engage in thoughtful debates and develop your argumentation skills
          </p>
          
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search debate topics and content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/20 border-white/30 text-white placeholder-white/70 focus:bg-white/30"
            />
          </div>
        </div>

        <div className="space-y-4">
          {topicHierarchy.length === 0 && filteredDebateContent.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="text-center py-12">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-white/50" />
                <h3 className="text-xl font-semibold text-white mb-2">No debate content found</h3>
                <p className="text-white/70">Try adjusting your search terms or check back later</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Main topic cards */}
              {topicHierarchy.map((mainTopic) => (
                <Card key={mainTopic.id} className="bg-white/10 backdrop-blur-md border-white/20">
                  <Collapsible 
                    open={openTopics.has(mainTopic.id)} 
                    onOpenChange={() => toggleTopic(mainTopic.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="text-left">
                            <h2 className="text-2xl font-bold text-white mb-2">{mainTopic.topic}</h2>
                            {mainTopic.short_summary && (
                              <p className="text-white/80">{mainTopic.short_summary}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {mainTopic.content.length > 0 && (
                              <Badge variant="secondary" className="bg-white/20 text-white">
                                {mainTopic.content.length} content
                              </Badge>
                            )}
                            {openTopics.has(mainTopic.id) ? 
                              <ChevronUp className="h-6 w-6 text-white" /> : 
                              <ChevronDown className="h-6 w-6 text-white" />
                            }
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        {/* Content items for this topic */}
                        {mainTopic.content.length > 0 && (
                          <div className="grid gap-4 mb-6">
                            {mainTopic.content.map((item) => (
                              <div
                                key={item.id}
                                onClick={() => handleContentClick(item, filteredDebateContent)}
                                className="bg-white/10 rounded-lg p-4 cursor-pointer hover:bg-white/20 transition-colors border border-white/20"
                              >
                                <div className="flex items-start gap-4">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-white mb-2">
                                      {item.title || item.short_blurb || 'Debate Content'}
                                    </h4>
                                    {item.short_description && (
                                      <p className="text-white/80 text-sm mb-2">{item.short_description}</p>
                                    )}
                                    {item.information && (
                                      <p className="text-white/70 text-sm line-clamp-3">
                                        {item.information.substring(0, 150)}...
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    {item.imageid && (
                                      <ImageIcon className="h-5 w-5 text-green-400" />
                                    )}
                                    {item.videoid && (
                                      <Play className="h-5 w-5 text-blue-400" />
                                    )}
                                    {item.challengesubject && item.challengesubject.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {item.challengesubject.map((subject, index) => (
                                          <Badge key={index} variant="outline" className="text-xs text-white border-white/30">
                                            {subject}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Sub-topics */}
                        {mainTopic.subTopics.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {mainTopic.subTopics.map((subTopic) => {
                              const subTopicContent = filteredDebateContent.filter(item => item.topicid === subTopic.id);
                              return (
                                <div
                                  key={subTopic.id}
                                  className="bg-white/10 rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-colors"
                                >
                                  <h4 className="font-semibold text-white mb-2">{subTopic.topic}</h4>
                                  {subTopic.short_summary && (
                                    <p className="text-white/80 text-sm mb-3">{subTopic.short_summary}</p>
                                  )}
                                  {subTopicContent.length > 0 && (
                                    <div className="space-y-2">
                                      {subTopicContent.map((item) => (
                                        <div
                                          key={item.id}
                                          onClick={() => handleContentClick(item, filteredDebateContent)}
                                          className="bg-white/10 rounded p-2 cursor-pointer hover:bg-white/20 transition-colors"
                                        >
                                          <p className="text-white text-sm font-medium">
                                            {item.title || item.short_blurb}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}

              {/* Standalone debate content (not linked to specific topics) */}
              {filteredDebateContent.filter(item => !debateTopics.find(topic => topic.id === item.topicid)).length > 0 && (
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <h2 className="text-2xl font-bold text-white">Additional Debate Content</h2>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {filteredDebateContent
                        .filter(item => !debateTopics.find(topic => topic.id === item.topicid))
                        .map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleContentClick(item, filteredDebateContent)}
                            className="bg-white/10 rounded-lg p-4 cursor-pointer hover:bg-white/20 transition-colors border border-white/20"
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex-1">
                                <h4 className="font-semibold text-white mb-2">
                                  {item.title || item.short_blurb || 'Debate Content'}
                                </h4>
                                {item.short_description && (
                                  <p className="text-white/80 text-sm mb-2">{item.short_description}</p>
                                )}
                                {item.information && (
                                  <p className="text-white/70 text-sm line-clamp-3">
                                    {item.information.substring(0, 150)}...
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col gap-2">
                                {item.imageid && (
                                  <ImageIcon className="h-5 w-5 text-green-400" />
                                )}
                                {item.videoid && (
                                  <Play className="h-5 w-5 text-blue-400" />
                                )}
                                {item.challengesubject && item.challengesubject.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {item.challengesubject.map((subject, index) => (
                                      <Badge key={index} variant="outline" className="text-xs text-white border-white/30">
                                        {subject}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      <ContentPopup
        isOpen={!!selectedContentInfo}
        onClose={closePopup}
        content={selectedContentInfo?.content ?? null}
        contentList={selectedContentInfo?.contextList ?? []}
        onContentChange={newContent => {
          if (selectedContentInfo) {
            setSelectedContentInfo({ 
              ...selectedContentInfo, 
              content: newContent,
              imageUrl: findImageUrl(newContent),
            });
          }
        }}
        startQuizDirectly={false}
        quizLevel={selectedContentInfo?.quizLevel}
        imageUrl={selectedContentInfo?.imageUrl ?? null}
        isImageLoading={imagesLoading}
      />
    </div>
  );
}