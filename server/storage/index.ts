// Re-export all storage modules for clean imports
export { UserStorage } from './userStorage';
export { TopicStorage } from './topicStorage';
export { ContentStorage } from './contentStorage';
export { QuestionStorage } from './questionStorage';
export { MatchingStorage } from './matchingStorage';
export { AssignmentStorage } from './assignmentStorage';
export { StreakStorage } from './streakStorage';
export { ImageStorage } from './imageStorage';
export { VideoStorage } from './videoStorage';
export { WritingStorage } from './writingStorage';
export { DebateStorage } from './debateStorage';
export { CollectionStorage } from './collectionStorage';

// Main storage interface and implementation
export { Storage, type IStorage } from './storage';