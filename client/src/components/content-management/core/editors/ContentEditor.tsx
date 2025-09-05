import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Save, X, Video, ArrowUp, ArrowDown, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Content } from '@shared/schema';
import GoogleImageSearch from '@/components/content-management/core/search/GoogleImageSearch';

const TopicDropdown = ({ value, onChange }: { value: string | null; onChange: (value: string) => void }) => {
  const { data: topics } = useQuery({
    queryKey: ['/api/topics'],
  });

  return (
    <Select value={value || ''} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a topic..." />
      </SelectTrigger>
      <SelectContent>
        {(topics as any[])?.map((topic: any) => (
          <SelectItem key={topic.id} value={topic.id}>
            {topic.topic}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

interface ContentEditorProps {
  content: Content | null;
  onContentUpdate?: (updatedContent: Content) => void;
}

export function ContentEditor({ content, onContentUpdate }: ContentEditorProps) {
  // Early return if content is null or undefined
  if (!content) {
    return (
      <div className="p-4 text-center text-gray-500">
        No content selected for editing
      </div>
    );
  }

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    short_description: content.short_description || '',
    short_blurb: content.short_blurb || '',
    imageid: content.imageid || '',
    videoid: content.videoid || '',
    videoid2: content.videoid2 || '',
    title: content.title || '',
    prompt: content.prompt || '',
    information: content.information || '',
    topicid: content.topicid || '',
    challengesubject: Array.isArray(content.challengesubject) ? content.challengesubject.join(', ') : (content.challengesubject || ''),
    parentid: content.parentid || '',
    contentgroup: content.contentgroup || '',
    imagelink: content.imagelink || '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const updateMutation = useMutation({
    mutationFn: async (updates: typeof editData) => {
      const response = await fetch(`/api/content/${content.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update content');
      }

      return response.json();
    },
    onSuccess: (updatedContent) => {
      // Invalidate all content-related queries using the correct cache keys
      queryClient.invalidateQueries({ queryKey: ['content'] });
      queryClient.invalidateQueries({ queryKey: ['bowl-challenge-topics'] });
      queryClient.invalidateQueries({ queryKey: ['all-topics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/content-groups'] });

      // Update the specific content item in cache
      queryClient.setQueryData(['content', content.id], updatedContent);

      // Update content in all topic-based caches
      queryClient.setQueriesData(
        { queryKey: ['content'] },
        (oldData: any) => {
          if (Array.isArray(oldData)) {
            return oldData.map(item =>
              item.id === content.id ? updatedContent : item
            );
          }
          return oldData;
        }
      );

      if (onContentUpdate) {
        onContentUpdate(updatedContent);
      }
      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Content updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update content',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  const handleCancel = () => {
    setEditData({
      short_description: content.short_description || '',
      short_blurb: content.short_blurb || '',
      imageid: content.imageid || '',
      videoid: content.videoid || '',
      videoid2: content.videoid2 || '',
      title: content.title || '',
      prompt: content.prompt || '',
      information: content.information || '',
      topicid: content.topicid || '',
      challengesubject: Array.isArray(content.challengesubject) ? content.challengesubject.join(', ') : (content.challengesubject || ''),
      parentid: content.parentid || '',
      contentgroup: content.contentgroup || '',
      imagelink: content.imagelink || '',
    });
    setIsEditing(false);
  };

  // Check if current user is GV0002
  const isAuthorized = user?.id === 'GV0002';

  if (!isAuthorized) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <p className="text-red-600">Access denied. This feature is only available to authorized administrators.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Content Editor (Admin: GV0002)
          </CardTitle>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="text-green-600 border-green-300 hover:bg-green-100"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={updateMutation.isPending}
                className="text-red-600 border-red-300 hover:bg-red-100"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Layers className="h-5 w-5 text-blue-600" />
              <Label className="text-base font-medium">Basic Information</Label>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              {isEditing ? (
                <Input
                  id="title"
                  value={editData.title || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter content title..."
                  className="bg-white"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  {content.title || 'No title'}
                </div>
              )}
            </div>

            {/* Topic ID with Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="topicid">Topic</Label>
              {isEditing ? (
                <TopicDropdown
                  value={editData.topicid}
                  onChange={(value) => setEditData(prev => ({ ...prev, topicid: value }))}
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  {content.topicid || 'No topic ID'}
                </div>
              )}
            </div>

            {/* Content Group Field */}
            <div className="space-y-2">
              <Label htmlFor="contentgroup">Content Group</Label>
              {isEditing ? (
                <Input
                  id="contentgroup"
                  value={editData.contentgroup || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, contentgroup: e.target.value }))}
                  placeholder="Enter content group ID..."
                  className="bg-white"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  {content.contentgroup || 'No content group'}
                </div>
              )}
            </div>

            {/* Challenge Subject */}
            <div className="space-y-2">
              <Label htmlFor="challengesubject">Challenge Subject</Label>
              {isEditing ? (
                <Input
                  id="challengesubject"
                  value={editData.challengesubject || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, challengesubject: e.target.value }))}
                  placeholder="Enter subjects (comma separated)..."
                  className="bg-white"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  {Array.isArray(content.challengesubject) ? content.challengesubject.join(', ') : (content.challengesubject || 'No challenge subject')}
                </div>
              )}
            </div>

            {/* Parent ID */}
            <div className="space-y-2">
              <Label htmlFor="parentid">Parent ID</Label>
              {isEditing ? (
                <Input
                  id="parentid"
                  value={editData.parentid || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, parentid: e.target.value }))}
                  placeholder="Enter parent ID for hierarchy..."
                  className="bg-white"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  {content.parentid || 'No parent ID (root level)'}
                </div>
              )}
            </div>

            {/* Prompt */}
            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt</Label>
              {isEditing ? (
                <Textarea
                  id="prompt"
                  value={editData.prompt || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="Enter prompt..."
                  className="min-h-[80px] bg-white"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  {content.prompt || 'No prompt'}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Content & Media */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Video className="h-5 w-5 text-red-600" />
              <Label className="text-base font-medium">Content & Media</Label>
            </div>

            {/* Short Description */}
            <div className="space-y-2">
              <Label htmlFor="short_description">Short Description</Label>
              {isEditing ? (
                <Textarea
                  id="short_description"
                  value={editData.short_description || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, short_description: e.target.value }))}
                  placeholder="Enter short description..."
                  className="min-h-[80px] bg-white"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  {content.short_description || 'No description available'}
                </div>
              )}
            </div>

            {/* Image ID */}
            <div className="space-y-2">
              <Label htmlFor="imageid">Image ID</Label>
              {isEditing ? (
                <Input
                  id="imageid"
                  value={editData.imageid || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, imageid: e.target.value }))}
                  disabled={updateMutation.isPending}
                  className="bg-white"
                  placeholder="Image ID or URL"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  {content.imageid || 'No image ID'}
                </div>
              )}
            </div>

            {/* Image Link */}
            <div className="space-y-2">
              <Label htmlFor="imagelink">Image Link</Label>
              {isEditing ? (
                <Input
                  id="imagelink"
                  value={editData.imagelink || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, imagelink: e.target.value }))}
                  placeholder="Enter image link..."
                  className="bg-white"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  {content.imagelink || 'No image link'}
                </div>
              )}
            </div>

            {/* Video 1 */}
            <div className="space-y-2">
              <Label htmlFor="videoid">Video 1 ID</Label>
              {isEditing ? (
                <Input
                  id="videoid"
                  value={editData.videoid || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, videoid: e.target.value }))}
                  disabled={updateMutation.isPending}
                  className="bg-white"
                  placeholder="Video 1 ID"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  {content.videoid || 'No video 1 ID'}
                </div>
              )}
            </div>

            {/* Video 2 */}
            <div className="space-y-2">
              <Label htmlFor="videoid2">Video 2 ID</Label>
              {isEditing ? (
                <Input
                  id="videoid2"
                  value={editData.videoid2 || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, videoid2: e.target.value }))}
                  disabled={updateMutation.isPending}
                  className="bg-white"
                  placeholder="Video 2 ID"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  {content.videoid2 || 'No video 2 ID'}
                </div>
              )}
            </div>

            {/* Information */}
            <div className="space-y-2">
              <Label htmlFor="information">Information</Label>
              {isEditing ? (
                <Textarea
                  id="information"
                  value={editData.information || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, information: e.target.value }))}
                  placeholder="Enter information..."
                  className="min-h-[80px] bg-white"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  {content.information || 'No information'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full Width Section - Short Blurb */}
        <div className="space-y-2 border-t pt-4">
          <Label htmlFor="short_blurb">Short Blurb</Label>
          {isEditing ? (
            <Textarea
              id="short_blurb"
              value={editData.short_blurb || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, short_blurb: e.target.value }))}
              placeholder="Enter short blurb..."
              className="min-h-[120px] bg-white"
            />
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              {content.short_blurb || 'No blurb available'}
            </div>
          )}
        </div>

        {updateMutation.isPending && (
          <div className="text-center text-sm text-gray-600">
            Saving changes...
          </div>
        )}
      </CardContent>
    </Card>
  );
}