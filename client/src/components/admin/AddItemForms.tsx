import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
      return (
        <div className="space-y-2">
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
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={newItemData.title || ''}
              onChange={(e) => setNewItemData({...newItemData, title: e.target.value})}
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
        </div>
      );

    case 'matching':
      return (
        <div className="space-y-2">
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
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={newItemData.title || ''}
              onChange={(e) => setNewItemData({...newItemData, title: e.target.value})}
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
        </div>
      );

    default:
      return <div>No form available</div>;
  }
};