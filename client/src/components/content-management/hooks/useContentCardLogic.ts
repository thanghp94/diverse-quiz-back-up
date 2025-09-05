import { useState } from 'react';
import { Content } from "@/hooks/useContent";
import { useContentMedia } from "@/hooks/useContentMedia";

export const useContentCardLogic = (content: Content, subtopicContent: Content[]) => {
  const { videoData, video2Data, videoEmbedUrl, video2EmbedUrl } = useContentMedia(content);
  const [videoPopupOpen, setVideoPopupOpen] = useState(false);
  const [selectedGroupVideo, setSelectedGroupVideo] = useState<Content | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteDialogContentId, setNoteDialogContentId] = useState<string>('');

  const hasVideo1 = videoEmbedUrl && videoData;
  const hasVideo2 = video2EmbedUrl && video2Data;

  // Check if this content is a group card and find related content
  const isGroupCard = content.prompt === "groupcard";
  const groupedContent = isGroupCard ? 
    subtopicContent
      .filter(item => item.contentgroup === content.id && item.id !== content.id)
      .sort((a, b) => {
        const orderA = parseInt(a.order || '999999');
        const orderB = parseInt(b.order || '999999');
        return orderA - orderB;
      }) : 
    [];

  return {
    videoData,
    video2Data,
    videoEmbedUrl,
    video2EmbedUrl,
    videoPopupOpen,
    setVideoPopupOpen,
    selectedGroupVideo,
    setSelectedGroupVideo,
    noteDialogOpen,
    setNoteDialogOpen,
    noteDialogContentId,
    setNoteDialogContentId,
    hasVideo1,
    hasVideo2,
    isGroupCard,
    groupedContent
  };
};
