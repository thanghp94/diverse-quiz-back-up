import { Card, CardContent } from "@/components/ui/card";
interface VideoPlayerProps {
  videoEmbedUrl: string | null;
  video2EmbedUrl: string | null;
  videoData: {
    video_name?: string | null;
  } | null;
  video2Data: {
    video_name?: string | null;
  } | null;
  compact?: boolean;
}
export const VideoPlayer = ({
  videoEmbedUrl,
  video2EmbedUrl,
  videoData,
  video2Data,
  compact = false
}: VideoPlayerProps) => {
  if (!videoEmbedUrl && !video2EmbedUrl) {
    return null;
  }

  // If compact mode and both videos exist, show them side by side
  if (compact && videoEmbedUrl && video2EmbedUrl) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4">
            {videoData?.video_name && <h4 className="font-medium text-xs text-gray-600 mb-2">{videoData.video_name}</h4>}
            <div className="aspect-video">
              <iframe className="w-full h-full rounded-lg" src={videoEmbedUrl} title={videoData?.video_name || 'YouTube video player'} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            {video2Data?.video_name && <h4 className="font-medium text-xs text-gray-600 mb-2">{video2Data.video_name}</h4>}
            <div className="aspect-video">
              <iframe className="w-full h-full rounded-lg" src={video2EmbedUrl} title={video2Data?.video_name || 'YouTube video player 2'} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Single video or non-compact mode
  return (
    <Card>
      <CardContent className={compact ? "pt-4" : "pt-6"}>
        <div className="space-y-4">
          {videoEmbedUrl && (
            <div>
              {videoData?.video_name && <h4 className={`font-medium ${compact ? 'text-xs' : 'text-sm'} text-gray-600 mb-2`}>{videoData.video_name}</h4>}
              <div className="aspect-video">
                <iframe className="w-full h-full rounded-lg" src={videoEmbedUrl} title={videoData?.video_name || 'YouTube video player'} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
              </div>
            </div>
          )}
          {video2EmbedUrl && (
            <div>
              {video2Data?.video_name && <h4 className={`font-medium ${compact ? 'text-xs' : 'text-sm'} text-gray-600 mb-2`}>{video2Data.video_name}</h4>}
              <div className="aspect-video">
                <iframe className="w-full h-full rounded-lg" src={video2EmbedUrl} title={video2Data?.video_name || 'YouTube video player 2'} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};