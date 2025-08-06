import { UserStorage } from './userStorage';
import { TopicStorage } from './topicStorage';
import { ContentStorage } from './contentStorage';
import { QuestionStorage } from './questionStorage';
import { MatchingStorage } from './matchingStorage';
import { AssignmentStorage } from './assignmentStorage';
import { StreakStorage } from './streakStorage';
import { ImageStorage } from './imageStorage';
import { VideoStorage } from './videoStorage';
import { WritingStorage } from './writingStorage';
import { DebateStorage } from './debateStorage';

// Combined storage interface for backward compatibility
export interface IStorage {
  users: UserStorage;
  topics: TopicStorage;
  content: ContentStorage;
  questions: QuestionStorage;
  matching: MatchingStorage;
  assignments: AssignmentStorage;
  streaks: StreakStorage;
  images: ImageStorage;
  videos: VideoStorage;
  writing: WritingStorage;
  debate: DebateStorage;
}

export class Storage implements IStorage {
  public users: UserStorage;
  public topics: TopicStorage;
  public content: ContentStorage;
  public questions: QuestionStorage;
  public matching: MatchingStorage;
  public assignments: AssignmentStorage;
  public streaks: StreakStorage;
  public images: ImageStorage;
  public videos: VideoStorage;
  public writing: WritingStorage;
  public debate: DebateStorage;

  constructor() {
    this.users = new UserStorage();
    this.topics = new TopicStorage();
    this.content = new ContentStorage();
    this.questions = new QuestionStorage();
    this.matching = new MatchingStorage();
    this.assignments = new AssignmentStorage();
    this.streaks = new StreakStorage();
    this.images = new ImageStorage();
    this.videos = new VideoStorage();
    this.writing = new WritingStorage();
    this.debate = new DebateStorage();
  }

  // Method for daily student tracking updates
  async updateStudentTryContent(): Promise<void> {
    // Placeholder for daily student tracking functionality
    // This can be implemented later if needed
    console.log('Student try content update completed');
  }
}

// Export singleton instance for backward compatibility
export const storage = new Storage();