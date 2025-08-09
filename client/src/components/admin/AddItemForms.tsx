import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { ActiveTab } from './types';

interface AddItemFormsProps {
  activeTab: ActiveTab;
  newItemData: any;
  setNewItemData: (data: any) => void;
}

export const AddItemForms: React.FC<AddItemFormsProps> = ({
  activeTab,
  newItemData,
  setNewItemData
}) => {
  // Fetch topics for matching content selection
  const { data: topics } = useQuery({
    queryKey: ['/api/topics'],
    enabled: activeTab === 'matching' || activeTab === 'assignments'
  });

  // Fetch content for matching content selection
  const { data: content } = useQuery({
    queryKey: ['/api/content'],
    enabled: activeTab === 'matching' || activeTab === 'assignments'
  });

  // Fetch questions for assignment question ID collection
  const { data: questions } = useQuery({
    queryKey: ['/api/questions'],
    enabled: activeTab === 'assignments'
  });

  const getContentByTopic = (topicId: string) => {
    return (content as any[])?.filter(c => c.topicid === topicId) || [];
  };
  switch (activeTab) {
    case 'students':
      return (
        <div className="space-y-2">
          <div>
            <Label htmlFor="id">Student ID</Label>
            <Input
              id="id"
              value={newItemData.id || ''}
              onChange={(e) => setNewItemData({...newItemData, id: e.target.value})}
              placeholder="HS0001"
            />
          </div>
          <div>
            <Label htmlFor="email">Meraki Email</Label>
            <Input
              id="email"
              value={newItemData.meraki_email || ''}
              onChange={(e) => setNewItemData({...newItemData, meraki_email: e.target.value})}
              placeholder="student@meraki.edu"
            />
          </div>
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={newItemData.full_name || ''}
              onChange={(e) => setNewItemData({...newItemData, full_name: e.target.value})}
              placeholder="John Doe"
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={newItemData.category || "student"}
              onValueChange={(value) => setNewItemData({...newItemData, category: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">student</SelectItem>
                <SelectItem value="teacher">teacher</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="show">Show</Label>
            <Select
              value={newItemData.show || "challenge"}
              onValueChange={(value) => setNewItemData({...newItemData, show: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="challenge">challenge</SelectItem>
                <SelectItem value="challenge, writing, debate">challenge, writing, debate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'topics':
      return (
        <div className="space-y-2">
          <div>
            <Label htmlFor="id">Topic ID</Label>
            <Input
              id="id"
              value={newItemData.id || ''}
              onChange={(e) => setNewItemData({...newItemData, id: e.target.value})}
              placeholder="T001"
            />
          </div>
          <div>
            <Label htmlFor="topic">Topic Title</Label>
            <Input
              id="topic"
              value={newItemData.topic || ''}
              onChange={(e) => setNewItemData({...newItemData, topic: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="short_summary">Short Summary</Label>
            <Textarea
              id="short_summary"
              value={newItemData.short_summary || ''}
              onChange={(e) => setNewItemData({...newItemData, short_summary: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="level">Level</Label>
            <Select
              value={newItemData.level?.toString() || "1"}
              onValueChange={(value) => setNewItemData({...newItemData, level: parseInt(value)})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Level 1</SelectItem>
                <SelectItem value="2">Level 2</SelectItem>
                <SelectItem value="3">Level 3</SelectItem>
                <SelectItem value="4">Level 4</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'content':
      return (
        <div className="space-y-2">
          <div>
            <Label htmlFor="id">Content ID</Label>
            <Input
              id="id"
              value={newItemData.id || ''}
              onChange={(e) => setNewItemData({...newItemData, id: e.target.value})}
              placeholder="C001"
            />
          </div>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={newItemData.title || ''}
              onChange={(e) => setNewItemData({...newItemData, title: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="short_blurb">Short Description</Label>
            <Textarea
              id="short_blurb"
              value={newItemData.short_blurb || ''}
              onChange={(e) => setNewItemData({...newItemData, short_blurb: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="topicid">Topic ID</Label>
            <Input
              id="topicid"
              value={newItemData.topicid || ''}
              onChange={(e) => setNewItemData({...newItemData, topicid: e.target.value})}
              placeholder="T001"
            />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              value={newItemData.type || "reading"}
              onValueChange={(value) => setNewItemData({...newItemData, type: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reading">Reading</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="activity">Activity</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select
              value={newItemData.difficulty || "easy"}
              onValueChange={(value) => setNewItemData({...newItemData, difficulty: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'assignments':
      // Filter topics and content that are NOT related to debate or writing
      const eligibleTopics = (topics as any[])?.filter(topic => 
        topic.parentid !== 'debate' && topic.parentid !== 'writing'
      ) || [];
      
      const eligibleContent = (content as any[])?.filter(content => 
        content.parentid !== 'debate' && content.parentid !== 'writing'
      ) || [];

      const selectedTopicIds = newItemData.topicid || [];
      const selectedContentIds = newItemData.contentid || [];



      const handleTopicToggle = (topicId: string) => {
        const currentIds = selectedTopicIds.slice();
        const index = currentIds.indexOf(topicId);
        if (index > -1) {
          currentIds.splice(index, 1);
        } else {
          currentIds.push(topicId);
        }
        const updatedData = {...newItemData, topicid: currentIds};
        // Auto-update question IDs when topics change
        if (updatedData.noofquestion && updatedData.typeofquestion && questions) {
          const typeOfQuestion = updatedData.typeofquestion;
          const numberOfQuestions = parseInt(updatedData.noofquestion);
          let filteredQuestions = (questions as any[]).filter(q => {
            // Primary matching is by contentid - same logic as quiz system
            const matchesContent = selectedContentIds.length > 0 && q.contentid && selectedContentIds.includes(q.contentid);
            
            // For difficulty: overview gets all questions, easy/hard filter by level
            let matchesDifficulty = true;
            if (typeOfQuestion === 'easy') {
              matchesDifficulty = q.level === 'easy';
            } else if (typeOfQuestion === 'hard') {
              matchesDifficulty = q.level === 'hard';
            }
            
            return matchesContent && matchesDifficulty;
          });
          const shuffled = filteredQuestions.sort(() => 0.5 - Math.random());
          const questionIds = shuffled.slice(0, numberOfQuestions).map(q => q.id);
          updatedData.question_id = questionIds.join(',');
        }
        setNewItemData(updatedData);
      };

      const handleContentToggle = (contentId: string) => {
        const currentIds = selectedContentIds.slice();
        const index = currentIds.indexOf(contentId);
        if (index > -1) {
          currentIds.splice(index, 1);
        } else {
          currentIds.push(contentId);
        }
        const updatedData = {...newItemData, contentid: currentIds};
        // Auto-update question IDs when content changes
        if (updatedData.noofquestion && updatedData.typeofquestion && questions) {
          const typeOfQuestion = updatedData.typeofquestion;
          const numberOfQuestions = parseInt(updatedData.noofquestion);
          let filteredQuestions = (questions as any[]).filter(q => {
            // Primary matching is by contentid - same logic as quiz system
            const matchesContent = currentIds.length > 0 && q.contentid && currentIds.includes(q.contentid);
            
            // For difficulty: overview gets all questions, easy/hard filter by level
            let matchesDifficulty = true;
            if (typeOfQuestion === 'easy') {
              matchesDifficulty = q.level === 'easy';
            } else if (typeOfQuestion === 'hard') {
              matchesDifficulty = q.level === 'hard';
            }
            
            return matchesContent && matchesDifficulty;
          });
          const shuffled = filteredQuestions.sort(() => 0.5 - Math.random());
          const questionIds = shuffled.slice(0, numberOfQuestions).map(q => q.id);
          updatedData.question_id = questionIds.join(',');
        }
        setNewItemData(updatedData);
      };

      const removeTopicId = (topicId: string) => {
        const currentIds = selectedTopicIds.filter((id: string) => id !== topicId);
        setNewItemData({...newItemData, topicid: currentIds});
      };

      const removeContentId = (contentId: string) => {
        const currentIds = selectedContentIds.filter((id: string) => id !== contentId);
        setNewItemData({...newItemData, contentid: currentIds});
      };

      return (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <div>
            <Label htmlFor="id">Assignment ID</Label>
            <Input
              id="id"
              value={newItemData.id || ''}
              onChange={(e) => setNewItemData({...newItemData, id: e.target.value})}
              placeholder="A001"
            />
          </div>
          <div>
            <Label htmlFor="assignmentname">Assignment Name</Label>
            <Input
              id="assignmentname"
              value={newItemData.assignmentname || ''}
              onChange={(e) => setNewItemData({...newItemData, assignmentname: e.target.value})}
              placeholder="Week 1 Reading Assignment"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newItemData.description || ''}
              onChange={(e) => setNewItemData({...newItemData, description: e.target.value})}
              placeholder="Assignment description..."
            />
          </div>



          {/* Content Multi-Select */}
          <div>
            <Label>Content (excludes debate and writing content)</Label>
            {selectedContentIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedContentIds.map((contentId: string) => {
                  const content = eligibleContent.find(c => c.id === contentId);
                  return content ? (
                    <Badge key={contentId} variant="secondary" className="text-xs">
                      {content.title}
                      <button
                        type="button"
                        onClick={() => removeContentId(contentId)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
            <ScrollArea className="h-32 border rounded-md p-2">
              <div className="space-y-2">
                {eligibleContent.length > 0 ? eligibleContent.map((content) => (
                  <div key={content.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`content-${content.id}`}
                      checked={selectedContentIds.includes(content.id)}
                      onCheckedChange={() => handleContentToggle(content.id)}
                    />
                    <Label htmlFor={`content-${content.id}`} className="text-sm flex-1 cursor-pointer">
                      {content.title}
                    </Label>
                  </div>
                )) : (
                  <div className="text-sm text-muted-foreground">No eligible content available</div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Question Configuration */}
          <div>
            <Label htmlFor="typeofquestion">Type of Question</Label>
            <Select
              value={newItemData.typeofquestion || 'overview'}
              onValueChange={(value) => {
                const updatedData = {...newItemData, typeofquestion: value};
                // Auto-update question IDs when type changes
                if (updatedData.noofquestion && selectedContentIds.length > 0 && questions) {
                  const numberOfQuestions = parseInt(updatedData.noofquestion);
                  let filteredQuestions = (questions as any[]).filter(q => {
                    // Primary matching is by contentid - same logic as quiz system
                    const matchesContent = selectedContentIds.length > 0 && q.contentid && selectedContentIds.includes(q.contentid);
                    
                    // For difficulty: overview gets all questions, easy/hard filter by level
                    let matchesDifficulty = true;
                    if (value === 'easy') {
                      matchesDifficulty = q.level === 'easy';
                    } else if (value === 'hard') {
                      matchesDifficulty = q.level === 'hard';
                    }
                    
                    return matchesContent && matchesDifficulty;
                  });
                  const shuffled = filteredQuestions.sort(() => 0.5 - Math.random());
                  const questionIds = shuffled.slice(0, numberOfQuestions).map(q => q.id);
                  updatedData.question_id = questionIds.join(',');
                }
                setNewItemData(updatedData);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select question type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="noofquestion">Number of Questions</Label>
            <Input
              id="noofquestion"
              type="number"
              min="1"
              max="100"
              value={newItemData.noofquestion || ''}
              onChange={(e) => {
                const updatedData = {...newItemData, noofquestion: e.target.value};
                // Auto-update question IDs when number changes
                if (updatedData.typeofquestion && selectedContentIds.length > 0 && questions) {
                  const numberOfQuestions = parseInt(e.target.value);
                  let filteredQuestions = (questions as any[]).filter(q => {
                    // Primary matching is by contentid - same logic as quiz system
                    const matchesContent = selectedContentIds.length > 0 && q.contentid && selectedContentIds.includes(q.contentid);
                    
                    // For difficulty: overview gets all questions, easy/hard filter by level
                    let matchesDifficulty = true;
                    if (updatedData.typeofquestion === 'easy') {
                      matchesDifficulty = q.level === 'easy';
                    } else if (updatedData.typeofquestion === 'hard') {
                      matchesDifficulty = q.level === 'hard';
                    }
                    
                    return matchesContent && matchesDifficulty;
                  });
                  const shuffled = filteredQuestions.sort(() => 0.5 - Math.random());
                  const questionIds = shuffled.slice(0, numberOfQuestions).map(q => q.id);
                  updatedData.question_id = questionIds.join(',');
                }
                setNewItemData(updatedData);
              }}
              placeholder="10"
            />
          </div>

          {/* Manual Generate Questions Button */}
          <div>
            <Button 
              type="button"
              variant="outline"
              onClick={() => {
                if (!questions || !selectedContentIds.length) {
                  console.log('No questions data or no content selected');
                  return;
                }
                
                const typeOfQuestion = newItemData.typeofquestion || 'overview';
                const numberOfQuestions = parseInt(newItemData.noofquestion || '10');
                
                console.log('Generating questions with:', {
                  selectedTopicIds,
                  selectedContentIds,
                  typeOfQuestion,
                  numberOfQuestions,
                  totalQuestions: questions.length
                });
                
                let filteredQuestions = (questions as any[]).filter(q => {
                  // Primary matching is by contentid - same logic as quiz system
                  const matchesContent = selectedContentIds.length > 0 && q.contentid && selectedContentIds.includes(q.contentid);
                  
                  // For difficulty: overview gets all questions, easy/hard filter by level
                  let matchesDifficulty = true;
                  if (typeOfQuestion === 'easy') {
                    matchesDifficulty = q.level === 'easy';
                  } else if (typeOfQuestion === 'hard') {
                    matchesDifficulty = q.level === 'hard';
                  }
                  // For overview, include all questions regardless of level
                  
                  const matches = matchesContent && matchesDifficulty;
                  if (matches) {
                    console.log('Question matches:', {id: q.id, contentid: q.contentid, level: q.level, typeOfQuestion});
                  }
                  return matches;
                });
                
                console.log('Filtered questions:', filteredQuestions.length);
                
                const shuffled = filteredQuestions.sort(() => 0.5 - Math.random());
                const questionIds = shuffled.slice(0, numberOfQuestions).map(q => q.id);
                
                setNewItemData({...newItemData, question_id: questionIds.join(',')});
              }}
              className="w-full"
            >
              Generate Questions ({questions ? questions.length : 0} available)
            </Button>
          </div>

          {/* Display collected question IDs count */}
          {newItemData.question_id && (
            <div className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
              <strong>Questions Found:</strong> {newItemData.question_id.split(',').length} questions collected
              {newItemData.question_id.length > 100 && (
                <div className="mt-1 text-xs">
                  Question IDs: {newItemData.question_id.substring(0, 100)}...
                </div>
              )}
            </div>
          )}

          {/* Debug info */}
          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
            <div><strong>Assignment Question Logic:</strong></div>
            <div>Selected Content: {selectedContentIds.length}</div>
            <div>Question Type: {newItemData.typeofquestion || 'overview'}</div>
            <div>Available Questions: {questions ? questions.length : 'loading...'}</div>
            <div className="mt-1 text-gray-600">Questions are filtered by contentid (same as quiz system)</div>
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={newItemData.category || ''}
              onChange={(e) => setNewItemData({...newItemData, category: e.target.value})}
              placeholder="general"
            />
          </div>
        </div>
      );

    case 'matching':
      const availableContent = newItemData.topicid ? getContentByTopic(newItemData.topicid) : [];
      
      return (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <div>
            <Label htmlFor="id">Matching ID</Label>
            <Input
              id="id"
              value={newItemData.id || ''}
              onChange={(e) => setNewItemData({...newItemData, id: e.target.value})}
              placeholder="M001"
            />
          </div>
          
          <div>
            <Label htmlFor="type">Type</Label>
            <Input
              id="type"
              value={newItemData.type || ''}
              onChange={(e) => setNewItemData({...newItemData, type: e.target.value})}
              placeholder="e.g., title-description, name-attribute"
            />
          </div>
          
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={newItemData.subject || ''}
              onChange={(e) => setNewItemData({...newItemData, subject: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="topic">Topic Name</Label>
            <Input
              id="topic"
              value={newItemData.topic || ''}
              onChange={(e) => setNewItemData({...newItemData, topic: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newItemData.description || ''}
              onChange={(e) => setNewItemData({...newItemData, description: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="topicid">Related Topic</Label>
            <Select
              value={newItemData.topicid || ""}
              onValueChange={(value) => setNewItemData({...newItemData, topicid: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select topic" />
              </SelectTrigger>
              <SelectContent>
                {(topics as any[])?.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>
                    {topic.topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Prompts Section */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Prompts (Left Side)</h4>
            {[1, 2, 3, 4, 5, 6].map(num => (
              <div key={`prompt${num}`}>
                <Label htmlFor={`prompt${num}`}>Prompt {num}</Label>
                <Select
                  value={newItemData[`prompt${num}`] || ""}
                  onValueChange={(value) => setNewItemData({...newItemData, [`prompt${num}`]: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select content for prompt ${num}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableContent.map((item: any) => (
                      <SelectItem key={item.id} value={item.title || item.id}>
                        {item.title || item.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          
          {/* Choices Section */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Choices (Right Side)</h4>
            {[1, 2, 3, 4, 5, 6].map(num => (
              <div key={`choice${num}`}>
                <Label htmlFor={`choice${num}`}>Choice {num}</Label>
                <Select
                  value={newItemData[`choice${num}`] || ""}
                  onValueChange={(value) => setNewItemData({...newItemData, [`choice${num}`]: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select content for choice ${num}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableContent.map((item: any) => (
                      <SelectItem key={item.id} value={item.title || item.id}>
                        {item.title || item.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return <div>No form available</div>;
  }
};