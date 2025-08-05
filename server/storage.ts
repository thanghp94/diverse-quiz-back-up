import { users, topics, content, images, questions, matching, videos, matching_attempts, content_ratings, student_streaks, daily_activities, writing_prompts, writing_submissions, assignment, assignment_student_try, student_try, learning_progress, cron_jobs, student_try_content, pending_access_requests, debate_submissions, type User, type InsertUser, type UpsertUser, type Topic, type Content, type Image, type Question, type Matching, type Video, type MatchingAttempt, type InsertMatchingAttempt, type ContentRating, type InsertContentRating, type StudentStreak, type InsertStudentStreak, type DailyActivity, type InsertDailyActivity, type WritingPrompt, type InsertWritingPrompt, type WritingSubmission, type InsertWritingSubmission, type LearningProgress, type InsertLearningProgress, type CronJob, type InsertCronJob, type DebateSubmission, type InsertDebateSubmission } from "@shared/schema";
import { eq, isNull, ne, asc, sql, and, desc, inArray, gte, lte, isNotNull } from "drizzle-orm";
import * as schema from "@shared/schema";
import crypto from 'crypto';
import { db } from "./db";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // Add writing_submissions property
  writingSubmissions: typeof writing_submissions;
  getUser(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByIdentifier(identifier: string): Promise<User | undefined>;
  updateUserEmail(userId: string, newEmail: string): Promise<User>;
  updateUser(userId: string, updateData: Partial<User>): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Topics
  getTopics(): Promise<Topic[]>;
  getBowlChallengeTopics(): Promise<Topic[]>;
  getTopicById(id: string): Promise<Topic | undefined>;
  updateTopic(topicId: string, updateData: Partial<Topic>): Promise<Topic | undefined>;
  createTopic(topicData: any): Promise<Topic>;

  // Content
  getContent(topicId?: string): Promise<Content[]>;
  getContentById(id: string): Promise<Content | undefined>;
  updateContent(id: string, updates: { short_description?: string; short_blurb?: string; imageid?: string; videoid?: string; videoid2?: string }): Promise<Content | undefined>;
  createContent(contentData: any): Promise<Content>;

  // Content Groups
  getContentGroups(): Promise<Array<{ contentgroup: string; url: string; content_count: number }>>;
  getContentByGroup(contentgroup: string): Promise<Content[]>;

  // Images
  getImages(): Promise<Image[]>;
  getImageById(id: string): Promise<Image | undefined>;

  // Questions
  getQuestions(contentId?: string, topicId?: string, level?: string): Promise<Question[]>;
  getQuestionById(id: string): Promise<Question | undefined>;

  // Matching
  getMatchingActivities(): Promise<Matching[]>;
  getMatchingById(id: string): Promise<Matching | undefined>;
  getMatchingByTopicId(topicId: string): Promise<Matching[]>;
  createMatching(matchingData: any): Promise<Matching>;

  // Videos
  getVideos(): Promise<Video[]>;
  getVideoById(id: string): Promise<Video | undefined>;
  getVideosByContentId(contentId: string): Promise<Video[]>;

  // Matching Attempts
  createMatchingAttempt(attempt: InsertMatchingAttempt): Promise<MatchingAttempt>;
  getMatchingAttempts(studentId: string, matchingId?: string): Promise<MatchingAttempt[]>;
  getMatchingAttemptById(id: string): Promise<MatchingAttempt | undefined>;
  updateMatchingAttempt(id: string, updates: Partial<MatchingAttempt>): Promise<MatchingAttempt>;

  // Content Ratings
  createContentRating(rating: InsertContentRating): Promise<ContentRating>;
  getContentRating(studentId: string, contentId: string): Promise<ContentRating | null>;
  getContentRatingsByStudent(studentId: string): Promise<ContentRating[]>;
  updateContentRating(studentId: string, contentId: string, rating: string): Promise<ContentRating>;
  incrementContentViewCount(studentId: string, contentId: string): Promise<ContentRating>;
  getContentRatingStats(contentId: string): Promise<{ easy: number; normal: number; hard: number }>;

  // Student Streaks
  getStudentStreak(studentId: string): Promise<StudentStreak | undefined>;
  updateStudentStreak(studentId: string): Promise<StudentStreak>;
  getStreakLeaderboard(limit?: number): Promise<StudentStreak[]>;

  // Daily Activities
  recordDailyActivity(studentId: string, points: number): Promise<DailyActivity>;
  getDailyActivity(studentId: string, date: Date): Promise<DailyActivity | undefined>;
  getLeaderboards(): Promise<{
    totalPoints: Array<{ student_id: string; total_points: number; full_name?: string }>;
    bestStreak: Array<{ student_id: string; longest_streak: number; full_name?: string }>;
    todayQuizzes: Array<{ student_id: string; today_count: number; full_name?: string }>;
    weeklyQuizzes: Array<{ student_id: string; weekly_count: number; full_name?: string }>;
  }>;

  // Writing Prompts
  getWritingPrompts(): Promise<WritingPrompt[]>;
  getWritingPromptById(id: string): Promise<WritingPrompt | undefined>;
  getWritingPromptsByCategory(category: string): Promise<WritingPrompt[]>;

  // Writing Submissions
  createWritingSubmission(submission: InsertWritingSubmission): Promise<WritingSubmission>;
  getWritingSubmission(id: string): Promise<WritingSubmission | undefined>;
  getStudentWritingSubmissions(studentId: string): Promise<WritingSubmission[]>;
  updateWritingSubmission(id: string, updates: Partial<WritingSubmission>): Promise<WritingSubmission>;

  // Debate Submissions
  createDebateSubmission(submission: InsertDebateSubmission): Promise<DebateSubmission>;
  getDebateSubmission(id: string): Promise<DebateSubmission | undefined>;
  getDebateSubmissionsByStudent(studentId: string): Promise<DebateSubmission[]>;
  getDebateSubmissionsByContent(contentId: string): Promise<DebateSubmission[]>;
  updateDebateSubmission(id: string, updates: Partial<DebateSubmission>): Promise<DebateSubmission>;

  // Assignments
  createAssignment(assignment: any): Promise<any>;
  getAssignmentById(id: string): Promise<any>;
  getAllAssignments(): Promise<any[]>;
  getLiveClassAssignments(): Promise<any[]>;
  duplicateAssignment(id: string, newType: string): Promise<any>;

  // Assignment Student Tries
  createAssignmentStudentTry(assignmentStudentTryData: any): Promise<any>;
  getAssignmentStudentTryById(id: string): Promise<any>;
  getAllAssignmentStudentTries(): Promise<any[]>;

  // Student Tries
  createStudentTry(studentTry: any): Promise<any>;
  getStudentTryById(id: string): Promise<any>;
  getAllStudentTries(): Promise<any[]>;
  updateStudentTry(id: string, updates: any): Promise<any>;

  // Learning Progress
  getStudentLearningProgress(studentId: string): Promise<any[]>;
  createLearningProgress(progress: any): Promise<any>;
  updateLearningProgress(id: string, updates: any): Promise<any>;

  // Content Progress
  getContentProgress(studentId: string): Promise<any[]>;

  // Personal Content
  getPersonalContent(studentId: string): Promise<any[]>;

  // Cron Jobs
  getCronJob(jobName: string): Promise<CronJob | undefined>;
  createCronJob(job: InsertCronJob): Promise<CronJob>;
  updateCronJob(jobName: string, lastRun: Date, nextRun: Date): Promise<CronJob>;
  updateStudentTryContent(): Promise<void>;

  // Leaderboards
  getStudentTriesLeaderboard(): Promise<any[]>;
  getLeaderboards(): Promise<any>;

  // Access Requests
  createPendingAccessRequest(request: any): Promise<any>;

  // Student Try Content
  createStudentTryContent(record: any): Promise<any>;
  getStudentTryContentByStudent(studentId: string): Promise<any[]>;
  getRecentStudentTryContent(): Promise<any[]>;

  // Live Class Monitoring
  getLiveClassActivities(studentIds: string[], startTime: string): Promise<any[]>;
  getQuestion(questionId: string): Promise<any | null>;
}

export class DatabaseStorage implements IStorage {
  // Expose writing_submissions table
  writingSubmissions = writing_submissions;
  private async executeWithRetry<T>(operation: () => Promise<T>, retries = 3): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        console.error(`Database operation failed (attempt ${attempt}/${retries}):`, error?.message || error);

        if (attempt === retries) {
          throw error;
        }

        // If it's a connection issue, wait and retry
        if (error?.message?.includes('endpoint is disabled') || 
            error?.message?.includes('connection') ||
            error?.code === 'XX000') {
          console.log(`Retrying database operation in ${attempt * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        } else {
          throw error;
        }
      }
    }
    throw new Error('Max retries exceeded');
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.executeWithRetry(async () => {
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0];
    });
  }

  async getAllUsers(): Promise<User[]> {
    return this.executeWithRetry(async () => {
      const result = await db.select().from(users).orderBy(asc(users.first_name));
      return result;
    });
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.executeWithRetry(async () => {
      const result = await db.select().from(users).where(
        sql`${users.email} = ${email} OR ${users.meraki_email} = ${email}`
      );
      return result[0];
    });
  }

  async getUserByIdentifier(identifier: string): Promise<User | undefined> {
    return this.executeWithRetry(async () => {
      const result = await db.select().from(users).where(
        sql`${users.id} = ${identifier} OR ${users.meraki_email} = ${identifier}`
      );
      return result[0];
    });
  }

  async updateUserEmail(userId: string, newEmail: string): Promise<User> {
    return this.executeWithRetry(async () => {
      const [updatedUser] = await db
        .update(users)
        .set({ email: newEmail })
        .where(eq(users.id, userId))
        .returning();
      return updatedUser;
    });
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    return await this.executeWithRetry(async () => {
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
          },
        })
        .returning();
      return user;
    });
  }

  // Topics
  async getTopics(): Promise<Topic[]> {
    return this.executeWithRetry(async () => {
      return await db.select().from(topics).orderBy(asc(topics.topic));
    });
  }

  async getBowlChallengeTopics(): Promise<Topic[]> {
    return this.executeWithRetry(async () => {
      return await db.select().from(topics)
        .where(
          sql`${topics.parentid} IS NULL 
          AND ${topics.topic} IS NOT NULL 
          AND ${topics.topic} != ''
          AND ${topics.topic} NOT IN ('Art', 'Bowl', 'Challenge', 'Debate', 'History', 'Literature', 'Media', 'Music', 'Science and Technology', 'Social Studies', 'Special areas', 'Teaching lesson', 'Writing')`
        )
        .orderBy(asc(topics.topic));
    });
  }

  async getTopicById(id: string): Promise<Topic | undefined> {
    const result = await db.select().from(topics).where(eq(topics.id, id));
    return result[0];
  }

  // Content
  async getContent(topicId?: string): Promise<Content[]> {
    return this.executeWithRetry(async () => {
      if (topicId) {
        return await db.select().from(content).where(eq(content.topicid, topicId));
      }
      return await db.select().from(content);
    });
  }

  async getContentById(id: string): Promise<Content | undefined> {
    const result = await db.select().from(content).where(eq(content.id, id));
    return result[0];
  }

  // Images
  async getImages(): Promise<Image[]> {
    return this.executeWithRetry(async () => {
      return await db.select().from(images);
    });
  }

  async getImageById(id: string): Promise<Image | undefined> {
    const result = await db.select().from(images).where(eq(images.id, id));
    return result[0];
  }

  // Questions
  async getQuestion(questionId: string): Promise<any | null> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM question 
        WHERE id = ${questionId}
        LIMIT 1
      `);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching question:', error);
      return null;
    }
  }

  async getQuestions(contentId?: string, topicId?: string, level?: string): Promise<Question[]> {
    try {
      console.log(`Storage: getQuestions called with contentId: ${contentId}, topicId: ${topicId}, level: ${level}`);

      const conditions: any[] = [];

      // Handle content/topic filtering
      if (contentId) {
        conditions.push(eq(schema.questions.contentid, contentId));
        console.log(`Added contentId condition: ${contentId}`);
      } else if (topicId) {
        // For topic-level queries, first get all content IDs for this topic
        console.log(`Getting content IDs for topicId: ${topicId}`);
        const contentInTopic = await db
          .select({ id: schema.content.id })
          .from(schema.content)
          .where(eq(schema.content.topicid, topicId));

        const contentIds = contentInTopic.map(c => c.id);
        console.log(`Found ${contentIds.length} content items in topic ${topicId}:`, contentIds);

        if (contentIds.length > 0) {
          // Filter questions by these content IDs - ensure contentid is not null
          conditions.push(and(
            inArray(schema.questions.contentid, contentIds),
            isNotNull(schema.questions.contentid)
          ));
          console.log(`Added content IDs condition for topic: ${topicId} with ${contentIds.length} content items`);
        } else {
          console.log(`No content found for topic ${topicId}, returning empty result`);
          return [];
        }
      }

      // Handle level filtering properly
      if (level) {
        if (level.toLowerCase() === 'overview') {
          // For Overview, get questions with questionlevel = 'Overview' or null/empty
          const overviewCondition = sql`(LOWER(TRIM(${schema.questions.questionlevel})) = 'overview' OR ${schema.questions.questionlevel} IS NULL OR TRIM(${schema.questions.questionlevel}) = '')`;
          conditions.push(overviewCondition);
          console.log(`Added Overview level condition`);
        } else {
          // For Easy/Hard, filter by exact level match (case insensitive)
          const levelCondition = sql`LOWER(TRIM(${schema.questions.questionlevel})) = ${level.toLowerCase()}`;
          conditions.push(levelCondition);
          console.log(`Added level condition for: ${level.toLowerCase()}`);
        }
      }

      let questions;
      if (conditions.length === 0) {
        questions = await db.select().from(schema.questions);
      } else {
        questions = await db.select().from(schema.questions).where(and(...conditions));
      }

      console.log(`Found ${questions.length} questions for contentId: ${contentId}, topicId: ${topicId}, level: ${level}`);

      // If we're filtering by level and got no results, let's check what levels are available
      if (level && questions.length === 0 && (contentId || topicId)) {
        console.log(`No questions found for level "${level}". Checking available levels...`);

        let debugQuery;
        if (contentId) {
          debugQuery = db.select({ level: schema.questions.questionlevel }).from(schema.questions).where(eq(schema.questions.contentid, contentId));
        } else if (topicId) {
          // For topic-level debug, check levels across all content in the topic
          const contentInTopic = await db
            .select({ id: schema.content.id })
            .from(schema.content)
            .where(eq(schema.content.topicid, topicId));

          const contentIds = contentInTopic.map(c => c.id);
          if (contentIds.length > 0) {
            debugQuery = db.select({ level: schema.questions.questionlevel }).from(schema.questions).where(inArray(schema.questions.contentid, contentIds));
          } else {
            return [];
          }
        }

        if (debugQuery) {
          const availableLevels = await debugQuery;
          const uniqueLevels = Array.from(new Set(availableLevels.map(q => q.level).filter(Boolean)));
          console.log(`Available levels for this content/topic:`, uniqueLevels);
        }
      }

      return questions;
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  }

  async getQuestionById(id: string): Promise<Question | undefined> {
    const result = await db.select().from(questions).where(eq(questions.id, id));
    return result[0];
  }

  // Matching
  async getMatchingActivities(): Promise<Matching[]> {
    return await db.select().from(matching);
  }

  async getMatchingById(id: string): Promise<Matching | undefined> {
    const result = await db.select().from(matching).where(eq(matching.id, id));
    return result[0];
  }

  async getMatchingByTopicId(topicId: string): Promise<Matching[]> {
    return await db.select().from(matching).where(eq(matching.topicid, topicId));
  }

  async getVideos(): Promise<Video[]> {
    return await db.select().from(videos);
  }

  async getVideoById(id: string): Promise<Video | undefined> {
    const result = await db.select().from(videos).where(eq(videos.id, id));
    return result[0] || undefined;
  }

  async getVideosByContentId(contentId: string): Promise<Video[]> {
    return await db.select().from(videos).where(eq(videos.contentid, contentId));
  }

  async createMatchingAttempt(attempt: InsertMatchingAttempt): Promise<MatchingAttempt> {
    const result = await db.insert(matching_attempts).values(attempt).returning();
    return result[0];
  }

  async getMatchingAttempts(studentId: string, matchingId?: string): Promise<MatchingAttempt[]> {
    if (matchingId) {
      return await db.select().from(matching_attempts)
        .where(and(
          eq(matching_attempts.student_id, studentId),
          eq(matching_attempts.matching_id, matchingId)
        ))
        .orderBy(desc(matching_attempts.created_at));
    }

    return await db.select().from(matching_attempts)
      .where(eq(matching_attempts.student_id, studentId))
      .orderBy(desc(matching_attempts.created_at));
  }

  async getMatchingAttemptById(id: string): Promise<MatchingAttempt | undefined> {
    const result = await db.select().from(matching_attempts).where(eq(matching_attempts.id, id));
    return result[0] || undefined;
  }

  async updateMatchingAttempt(id: string, updates: Partial<MatchingAttempt>): Promise<MatchingAttempt> {
    const result = await db.update(matching_attempts)
      .set(updates)
      .where(eq(matching_attempts.id, id))
      .returning();
    return result[0];
  }

  // Content Ratings
  async createContentRating(rating: InsertContentRating): Promise<ContentRating> {
    const result = await db.insert(content_ratings).values(rating).returning();
    return result[0];
  }

  async getContentRating(studentId: string, contentId: string): Promise<ContentRating | null> {
    return this.executeWithRetry(async () => {
      const result = await db.select().from(content_ratings)
        .where(and(
          eq(content_ratings.student_id, studentId),
          eq(content_ratings.content_id, contentId)
        ));
      return result[0] || null;
    });
  }

  async updateContentRating(studentId: string, contentId: string, rating?: string, personalNote?: string): Promise<ContentRating> {
    const existing = await this.getContentRating(studentId, contentId);
    if (existing) {
      const updateData: any = { updated_at: new Date() };
      if (rating !== undefined) updateData.rating = rating;
      if (personalNote !== undefined) updateData.personal_note = personalNote;

      const result = await db.update(content_ratings)
        .set(updateData)
        .where(and(
          eq(content_ratings.student_id, studentId),
          eq(content_ratings.content_id, contentId)
        ))
        .returning();
      return result[0];
    } else {
      return await this.createContentRating({
        id: crypto.randomUUID(),
        student_id: studentId,
        content_id: contentId,
        rating: rating || 'normal',
        personal_note: personalNote
      });
    }
  }

  async incrementContentViewCount(studentId: string, contentId: string): Promise<ContentRating> {
    const existing = await this.getContentRating(studentId, contentId);
    if (existing) {
      const currentCount = existing.view_count || 1;
      const result = await db.update(content_ratings)
        .set({
          view_count: currentCount + 1,
          updated_at: new Date(),
        })
        .where(and(
          eq(content_ratings.student_id, studentId),
          eq(content_ratings.content_id, contentId)
        ))
        .returning();
      return result[0];
    } else {
      return await this.createContentRating({
        id: crypto.randomUUID(),
        student_id: studentId,
        content_id: contentId,
        rating: 'viewed',
        personal_note: null,
        view_count: 1,
      });
    }
  }

  async getContentRatingsByStudent(studentId: string): Promise<ContentRating[]> {
    const ratings = await db.select().from(content_ratings)
      .where(eq(content_ratings.student_id, studentId));
    return ratings;
  }

  async getContentRatingStats(contentId: string): Promise<{ easy: number; normal: number; hard: number }> {
    const ratings = await db.select().from(content_ratings)
      .where(eq(content_ratings.content_id, contentId));

    return {
      easy: ratings.filter(r => r.rating === 'ok').length,
      normal: ratings.filter(r => r.rating === 'normal').length,
      hard: ratings.filter(r => r.rating === 'really_bad').length
    };
  }

  // Student Streaks
  async getStudentStreak(studentId: string): Promise<StudentStreak | undefined> {
    const result = await db.select().from(student_streaks)
      .where(eq(student_streaks.student_id, studentId));
    return result[0] || undefined;
  }

  async updateStudentStreak(studentId: string): Promise<StudentStreak> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.getStudentStreak(studentId);
    const todayActivity = await this.getDailyActivity(studentId, today);

    if (!existing) {
      const result = await db.insert(student_streaks).values({
        id: crypto.randomUUID(),
        student_id: studentId,
        current_streak: todayActivity ? 1 : 0,
        longest_streak: todayActivity ? 1 : 0,
        last_activity_date: todayActivity ? today : null
      }).returning();
      return result[0];
    }

    let newCurrentStreak = existing.current_streak || 0;
    let newLongestStreak = existing.longest_streak || 0;

    if (todayActivity) {
      const lastActivity = existing.last_activity_date;
      if (lastActivity) {
        const lastDate = new Date(lastActivity);
        lastDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
          newCurrentStreak += 1;
        } else if (daysDiff > 1) {
          newCurrentStreak = 1;
        }
      } else {
        newCurrentStreak = 1;
      }

      newLongestStreak = Math.max(newLongestStreak, newCurrentStreak);
    }

    const result = await db.update(student_streaks)
      .set({
        current_streak: newCurrentStreak,
        longest_streak: newLongestStreak,
        last_activity_date: todayActivity ? today : existing.last_activity_date,
        updated_at: new Date()
      })
      .where(eq(student_streaks.student_id, studentId))
      .returning();
    return result[0];
  }

  async getStreakLeaderboard(limit: number = 10): Promise<StudentStreak[]> {
    return await db.select().from(student_streaks)
      .orderBy(desc(student_streaks.longest_streak))
      .limit(limit);
  }

  // Daily Activities
  async recordDailyActivity(studentId: string, points: number): Promise<DailyActivity> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.getDailyActivity(studentId, today);

    if (existing) {
      const result = await db.update(daily_activities)
        .set({
          activities_count: (existing.activities_count || 0) + 1,
          points_earned: (existing.points_earned || 0) + points
        })
        .where(eq(daily_activities.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(daily_activities).values({
        id: crypto.randomUUID(),
        student_id: studentId,
        activity_date: today,
        activities_count: 1,
        points_earned: points
      }).returning();
      return result[0];
    }
  }

  async getDailyActivity(studentId: string, date: Date): Promise<DailyActivity | undefined> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const result = await db.select().from(daily_activities)
      .where(and(
        eq(daily_activities.student_id, studentId),
        eq(daily_activities.activity_date, targetDate)
      ));
    return result[0] || undefined;
  }

  async getLeaderboards(): Promise<{
    totalPoints: Array<{ student_id: string; total_points: number; full_name?: string }>;
    bestStreak: Array<{ student_id: string; longest_streak: number; full_name?: string }>;
    todayQuizzes: Array<{ student_id: string; today_count: number; full_name?: string }>;
    weeklyQuizzes: Array<{ student_id: string; weekly_count: number; full_name?: string }>;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Total points leaderboard
    const totalPointsResult = await db.select({
      student_id: daily_activities.student_id,
      total_points: sql<number>`SUM(${daily_activities.points_earned})`,
      full_name: users.full_name
    })
    .from(daily_activities)
    .leftJoin(users, eq(daily_activities.student_id, users.id))
    .groupBy(daily_activities.student_id, users.full_name)
    .orderBy(desc(sql`SUM(${daily_activities.points_earned})`))
    .limit(10);

    // Best streak leaderboard
    const bestStreakResult = await db.select({
      student_id: student_streaks.student_id,
      longest_streak: student_streaks.longest_streak,
      full_name: users.full_name
    })
    .from(student_streaks)
    .leftJoin(users, eq(student_streaks.student_id, users.id))
    .orderBy(desc(student_streaks.longest_streak))
    .limit(10);

    // Today's quizzes leaderboard
    const todayQuizzesResult = await db.select({
      student_id: daily_activities.student_id,
      today_count: daily_activities.activities_count,
      full_name: users.full_name
    })
    .from(daily_activities)
    .leftJoin(users, eq(daily_activities.student_id, users.id))
    .where(eq(daily_activities.activity_date, today))
    .orderBy(desc(daily_activities.activities_count))
    .limit(10);

    // Weekly quizzes leaderboard
    const weeklyQuizzesResult = await db.select({
      student_id: daily_activities.student_id,
      weekly_count: sql<number>`SUM(${daily_activities.activities_count})`,
      full_name: users.full_name
    })
    .from(daily_activities)
    .leftJoin(users, eq(daily_activities.student_id, users.id))
    .where(sql`${daily_activities.activity_date} >= ${weekAgo}`)
    .groupBy(daily_activities.student_id, users.full_name)
    .orderBy(desc(sql`SUM(${daily_activities.activities_count})`))
    .limit(10);

    return {
      totalPoints: totalPointsResult.map(r => ({
        student_id: r.student_id,
        total_points: r.total_points,
        full_name: r.full_name || undefined
      })),
      bestStreak: bestStreakResult.map(r => ({
        student_id: r.student_id,
        longest_streak: r.longest_streak || 0,
        full_name: r.full_name || undefined
      })),
      todayQuizzes: todayQuizzesResult.map(r => ({
        student_id: r.student_id,
        today_count: r.today_count || 0,
        full_name: r.full_name || undefined
      })),
      weeklyQuizzes: weeklyQuizzesResult.map(r => ({
        student_id: r.student_id,
        weekly_count: r.weekly_count,
        full_name: r.full_name || undefined
      }))
    };
  }

  // Writing Prompts
  async getWritingPrompts(): Promise<WritingPrompt[]> {
    return await db.select().from(writing_prompts).orderBy(asc(writing_prompts.category));
  }

  async getWritingPromptById(id: string): Promise<WritingPrompt | undefined> {
    const result = await db.select().from(writing_prompts).where(eq(writing_prompts.id, id));
    return result[0] || undefined;
  }

  async getWritingPromptsByCategory(category: string): Promise<WritingPrompt[]> {
    return await db.select().from(writing_prompts)
      .where(eq(writing_prompts.category, category))
      .orderBy(asc(writing_prompts.title));
  }

  // Writing Submissions
  async createWritingSubmission(submission: InsertWritingSubmission): Promise<WritingSubmission> {
    // Ensure ID is generated if not provided
    const submissionData = {
      ...submission,
      id: submission.id || crypto.randomUUID(),
      created_at: submission.created_at || new Date(),
      updated_at: submission.updated_at || new Date()
    };

    console.log('Storage: Creating writing submission with data:', submissionData);
    const result = await db.insert(writing_submissions).values(submissionData).returning();
    console.log('Storage: Writing submission created:', result[0]);
    return result[0];
  }

  async getWritingSubmission(id: string): Promise<WritingSubmission | undefined> {
    const result = await db.select().from(writing_submissions).where(eq(writing_submissions.id, id));
    return result[0] || undefined;
  }

  async getStudentWritingSubmissions(studentId: string): Promise<WritingSubmission[]> {
    return await db.select().from(writing_submissions)
      .where(eq(writing_submissions.student_id, studentId))
      .orderBy(desc(writing_submissions.created_at));
  }

  async updateWritingSubmission(id: string, updates: Partial<WritingSubmission>): Promise<WritingSubmission> {
    const result = await db.update(writing_submissions)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(writing_submissions.id, id))
      .returning();
    return result[0];
  }

  // Assignments
  async createAssignment(assignmentInput: any): Promise<any> {
    const assignmentData = {
      id: assignmentInput.id || `assignment_${Date.now()}`,
      assignmentname: assignmentInput.assignmentname || `Quiz - ${assignmentInput.typeofquestion || 'Overview'}`,
      contentid: assignmentInput.contentid,
      question_id: assignmentInput.question_id,
      testtype: assignmentInput.testtype || 'content_quiz',
      typeofquestion: assignmentInput.typeofquestion || 'Overview',
      status: 'active'
    };

    try {
      const result = await db.insert(assignment).values(assignmentData).returning();
      return result[0] || assignmentData;
    } catch (error) {
      console.error('Error creating assignment:', error);
      // Return a simple assignment object if database insert fails
      return {
        ...assignmentData,
        created_at: new Date()
      };
    }
  }

  async getAssignmentById(id: string): Promise<any> {
    const result = await db.select().from(assignment).where(eq(assignment.id, id));
    return result[0] || null;
  }

  async getAllAssignments(): Promise<any[]> {
    return await this.executeWithRetry(async () => {
      const result = await db.select().from(assignment);
      return result;
    });
  }

  async duplicateAssignment(id: string, newType: string): Promise<any> {
    return await this.executeWithRetry(async () => {
      // First get the original assignment
      const originalAssignment = await db.select().from(assignment).where(eq(assignment.id, id));
      if (!originalAssignment[0]) {
        throw new Error('Assignment not found');
      }

      const original = originalAssignment[0];
      const newId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create a duplicate with new type and id
      const newAssignment = {
        ...original,
        id: newId,
        type: newType,
        assignmentname: `${original.assignmentname} (${newType})`,
        created_at: new Date(),
        update: new Date().toISOString()
      };

      const result = await db.insert(assignment).values(newAssignment).returning();
      return result[0];
    });
  }

  // Assignment Student Tries
  async createAssignmentStudentTry(assignmentStudentTryData: any): Promise<any> {
    console.log('Creating assignment_student_try with input:', assignmentStudentTryData);

    const data = {
      assignmentid: assignmentStudentTryData.assignmentid || null,
      contentid: assignmentStudentTryData.contentid || assignmentStudentTryData.contentID || null,
      hocsinh_id: assignmentStudentTryData.hocsinh_id,
      questionids: assignmentStudentTryData.questionids || assignmentStudentTryData.questionIDs || JSON.stringify([]),
      start_time: assignmentStudentTryData.start_time || new Date().toISOString(),
      typeoftaking: assignmentStudentTryData.typeoftaking || 'Overview'
    };

    console.log('Inserting assignment_student_try data:', data);

    try {
      const result = await db.insert(assignment_student_try).values(data).returning();
      console.log('Assignment_student_try created successfully:', result[0]);
      return result[0];
    } catch (error) {
      console.error('Error creating assignment_student_try:', error);
      throw error;
    }
  }

  async getAssignmentStudentTryById(id: string): Promise<any> {
    const result = await db.select().from(assignment_student_try).where(eq(assignment_student_try.id, parseInt(id)));
    return result[0] || null;
  }

  async getAllAssignmentStudentTries(): Promise<any[]> {
    return await this.executeWithRetry(async () => {
      const result = await db.select().from(assignment_student_try);
      return result;
    });
  }

  // Live Class Assignment Methods
  async getLiveClassAssignments(): Promise<any[]> {
    return await this.executeWithRetry(async () => {
      // Get current UTC time
      const now = new Date();

      // Calculate 3 hours ago in UTC (assignments created within last 3 hours)
      const threeHoursAgo = new Date(now.getTime() - (3 * 60 * 60 * 1000));

      // Convert to Vietnam timezone for display
      const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));

      console.log('Current UTC time:', now.toISOString());
      console.log('Vietnam time (display):', vietnamTime.toISOString());
      console.log('Looking for assignments created after UTC:', threeHoursAgo.toISOString());

      // Query assignments that were created within the last 3 hours
      const result = await db.select()
        .from(assignment)
        .where(
          sql`${assignment.created_at} >= ${threeHoursAgo.toISOString()}`
        )
        .orderBy(desc(assignment.created_at));

      console.log('Found live assignments:', result.length);
      if (result.length > 0) {
        console.log('Assignment creation dates:', result.map(a => ({ id: a.id, assignmentname: a.assignmentname, created_at: a.created_at })));
      }
      return result;
    });
  }

  async getAssignmentStudentProgress(assignmentId: string): Promise<any[]> {
    return await this.executeWithRetry(async () => {
      // Get all student tries for this assignment with student details
      const result = await db.select({
        assignment_student_try: assignment_student_try,
        student_tries: student_try,
        user: users
      })
      .from(assignment_student_try)
      .leftJoin(student_try, eq(student_try.assignment_student_try_id, assignment_student_try.id))
      .leftJoin(users, eq(users.id, assignment_student_try.hocsinh_id))
      .where(eq(assignment_student_try.assignmentid, assignmentId))
      .orderBy(assignment_student_try.start_time);

      return result;
    });
  }

  async getStudentQuizProgress(assignmentStudentTryId: string): Promise<any[]> {
    return await this.executeWithRetry(async () => {
      // Get detailed quiz progress for a specific assignment student try
      const result = await db.select()
        .from(student_try)
        .where(eq(student_try.assignment_student_try_id, assignmentStudentTryId.toString()))
        .orderBy(student_try.time_start);

      return result;
    });
  }

  // Student Tries
  async createStudentTry(studentTry: any): Promise<any> {
    return this.executeWithRetry(async () => {
      // Create student_try record with all question response data
      const studentTryData = {
        id: `try_${Date.now()}`,
        assignment_student_try_id: studentTry.assignment_student_try_id?.toString() || null,
        hocsinh_id: studentTry.hocsinh_id,
        question_id: studentTry.question_id || null,
        answer_choice: studentTry.answer_choice || null,
        quiz_result: studentTry.quiz_result || null,
        score: studentTry.score ? parseInt(studentTry.score) : null,
        time_start: studentTry.time_start ? (studentTry.time_start instanceof Date ? studentTry.time_start : new Date(studentTry.time_start)) : null,
        time_end: studentTry.time_end ? (studentTry.time_end instanceof Date ? studentTry.time_end : new Date(studentTry.time_end)) : null,
        currentindex: studentTry.currentindex ? parseInt(studentTry.currentindex) : null,
        showcontent: studentTry.showcontent?.toString() || null,
        writing_answer: studentTry.writing_answer || null,
        update: new Date()
      };

      console.log('Creating student_try with data:', studentTryData);

      const studentTryResult = await db.insert(student_try).values(studentTryData).returning();
      console.log('Student_try created successfully:', studentTryResult[0]);
      return studentTryResult[0];
    });
  }

  async getStudentTryById(id: string): Promise<any> {
    const result = await db.select().from(student_try).where(eq(student_try.id, id));
    return result[0] || null;
  }

  async getAllStudentTries(): Promise<any[]> {
    const result = await db.select().from(student_try);
    return result;
  }

  async updateStudentTry(id: string, updates: any): Promise<any> {
    const result = await db.update(student_try)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(student_try.id, id))
      .returning();
    return result[0];
  }

  // Learning Progress Methods
  async getStudentLearningProgress(studentId: string): Promise<any[]> {
    return await this.executeWithRetry(async () => {
      const result = await db.select()
        .from(schema.learning_progress)
        .where(eq(schema.learning_progress.student_id, studentId));
      return result;
    });
  }

  async createLearningProgress(progress: any): Promise<any> {
    return await this.executeWithRetry(async () => {
      const result = await db.insert(schema.learning_progress)
        .values(progress)
        .returning();
      return result[0];
    });
  }

  async updateLearningProgress(id: string, updates: any): Promise<any> {
    return await this.executeWithRetry(async () => {
      const result = await db.update(schema.learning_progress)
        .set({ ...updates, updated_at: new Date() })
        .where(eq(schema.learning_progress.id, id))
        .returning();
      return result[0];
    });
  }

  async updateContent(id: string, updates: { 
    short_description?: string; 
    short_blurb?: string;
    imageid?: string;
    videoid?: string;
    videoid2?: string;
  }): Promise<Content | undefined> {
    return this.executeWithRetry(async () => {
      const result = await db.update(content)
        .set(updates)
        .where(eq(content.id, id))
        .returning();
      return result[0] || undefined;
    });
  }

  async getContentGroups(): Promise<Array<{ contentgroup: string; url: string; content_count: number }>> {
    return this.executeWithRetry(async () => {
      const result = await db.execute(sql`
        SELECT 
          contentgroup,
          url,
          COUNT(*) as content_count
        FROM content 
        WHERE contentgroup IS NOT NULL AND contentgroup != ''
        GROUP BY contentgroup, url
        ORDER BY content_count DESC
      `);

      return result.rows.map((row: any) => ({
        contentgroup: row.contentgroup,
        url: row.url || '',
        content_count: parseInt(row.content_count)
      }));
    });
  }

  async getContentByGroup(contentgroup: string): Promise<Content[]> {
    return this.executeWithRetry(async () => {
      const result = await db.select()
        .from(content)
        .where(eq(content.contentgroup, contentgroup));
      return result;
    });
  }




  async getStudentTriesLeaderboard(): Promise<any[]> {
    return this.executeWithRetry(async () => {
      const result = await db.execute(sql`
        SELECT 
          st.hocsinh_id,
          COUNT(*) as total_tries,
          SUM(CASE WHEN st.quiz_result = '✅' THEN 1 ELSE 0 END) as correct_answers,
          ROUND(
            (SUM(CASE WHEN st.quiz_result = '✅' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 
            1
          ) as accuracy_percentage,
          COALESCE(u.full_name, CONCAT(u.first_name, ' ', u.last_name), 'Unknown Student') as full_name
        FROM student_try st
        LEFT JOIN users u ON st.hocsinh_id = u.id
        WHERE st.quiz_result IS NOT NULL 
          AND st.quiz_result != '' 
          AND st.quiz_result IN ('✅', '❌')
          AND st.question_id IS NOT NULL
          AND st.question_id != ''
        GROUP BY st.hocsinh_id, u.full_name, u.first_name, u.last_name
        HAVING COUNT(*) > 0
        ORDER BY total_tries DESC, accuracy_percentage DESC
        LIMIT 20
      `);

      return result.rows.map((row: any, index: number) => ({
        rank: index + 1,
        student_id: row.hocsinh_id,
        total_tries: parseInt(row.total_tries),
        correct_answers: parseInt(row.correct_answers),
        accuracy_percentage: parseFloat(row.accuracy_percentage) || 0,
        full_name: row.full_name
      }));
    });
  }

  async getPersonalContent(studentId: string): Promise<any[]> {
    return this.executeWithRetry(async () => {
      const result = await db.execute(sql`
        SELECT 
          cr.id,
          cr.content_id as "contentId",
          c.title,
          COALESCE(t.topic, 'Unknown Topic') as topic,
          cr.personal_note,
          cr.rating as difficulty_rating,
          cr.updated_at
        FROM content_ratings cr
        JOIN content c ON cr.content_id = c.id
        LEFT JOIN topic t ON c.topicid = t.id
        WHERE cr.student_id = ${studentId}
          AND (cr.personal_note IS NOT NULL AND cr.personal_note != '' OR cr.rating IS NOT NULL)
        ORDER BY cr.updated_at DESC
      `);

      return result.rows.map((row: any) => ({
        id: row.id,
        contentId: row.contentId,
        title: row.title || 'Untitled Content',
        topic: row.topic,
        personal_note: row.personal_note,
        difficulty_rating: row.difficulty_rating,
        updated_at: row.updated_at
      }));
    });
  }

  async getContentProgress(studentId: string): Promise<any[]> {
    return this.executeWithRetry(async () => {
      const result = await db.execute(sql`
        SELECT DISTINCT
          c.id,
          c.topicid,
          COALESCE(t.topic, 'Unknown Topic') as topic,
          c.title,
          cr.rating as difficulty_rating,
          (SELECT COUNT(*) FROM question q WHERE q.contentid = c.id) as question_count,
          MAX(st.update) as completed_at,
          c.parentid,
          COUNT(CASE WHEN cr.rating = 'ok' THEN 1 END) as ok_count,
          COUNT(CASE WHEN cr.rating = 'really_bad' THEN 1 END) as really_bad_count
        FROM content c
        LEFT JOIN topic t ON c.topicid = t.id
        LEFT JOIN content_ratings cr ON cr.content_id = c.id AND cr.student_id = ${studentId}
        LEFT JOIN question q ON q.contentid = c.id
        LEFT JOIN student_try st ON st.question_id = q.id AND st.hocsinh_id = ${studentId}
        WHERE c.challengesubject && ARRAY['Art', 'Music', 'Literature', 'Social Studies', 'Science and Technology', 'Media', 'History', 'Special Areas']
        GROUP BY c.id, c.topicid, t.topic, c.title, cr.rating, c.parentid
        ORDER BY c.title
      `);

      return result.rows.map((row: any) => ({
        id: row.id,
        topicid: row.topicid,
        topic: row.topic,
        title: row.title,
        difficulty_rating: row.difficulty_rating,
        question_count: parseInt(row.question_count) || 0,
        completed_at: row.completed_at,
        parentid: row.parentid,
        ok_count: parseInt(row.ok_count) || 0,
        really_bad_count: parseInt(row.really_bad_count) || 0
      }));
    });
  }

  // Cron Jobs
  async getCronJob(jobName: string): Promise<CronJob | undefined> {
    return this.executeWithRetry(async () => {
      const result = await db.select().from(cron_jobs)
        .where(eq(cron_jobs.job_name, jobName));
      return result[0] || undefined;
    });
  }

  async createCronJob(job: InsertCronJob): Promise<CronJob> {
    return this.executeWithRetry(async () => {
      const result = await db.insert(cron_jobs).values(job).returning();
      return result[0];
    });
  }

  async updateCronJob(jobName: string, lastRun: Date, nextRun: Date): Promise<CronJob> {
    return this.executeWithRetry(async () => {
      const result = await db.update(cron_jobs)
        .set({ last_run: lastRun, next_run: nextRun })
        .where(eq(cron_jobs.job_name, jobName))
        .returning();
      return result[0];
    });
  }

  async updateStudentTryContent(): Promise<void> {
    return this.executeWithRetry(async () => {
      // Simple approach: get student tries from last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Get all student tries since yesterday
      const result = await db.execute(sql`
        SELECT DISTINCT
          st.hocsinh_id,
          q.contentid,
          STRING_AGG(st.question_id, ', ' ORDER BY st.question_id) as question_ids
        FROM student_try st
        INNER JOIN question q ON q.id = st.question_id
        WHERE st.time_start > ${yesterday.toISOString()}
        AND q.contentid IS NOT NULL
        GROUP BY st.hocsinh_id, q.contentid
      `);

      console.log(`Processing ${result.rows.length} student-content combinations for question tracking`);

      // Update or create student_try_content records
      for (const row of result.rows) {
        try {
          const existingRecord = await db.execute(sql`
            SELECT * FROM student_try_content 
            WHERE hocsinh_id = ${row.hocsinh_id} AND contentid = ${row.contentid}
          `);

          if (existingRecord.rows.length > 0) {
            // Append new question IDs to existing record
            const currentQuestionIds = existingRecord.rows[0].update || '';
            const newQuestionIds = currentQuestionIds 
              ? `${currentQuestionIds}, ${row.question_ids}`
              : row.question_ids;

            await db.execute(sql`
              UPDATE student_try_content 
              SET update = ${newQuestionIds}, time_end = ${new Date().toISOString()}
              WHERE hocsinh_id = ${row.hocsinh_id} AND contentid = ${row.contentid}
            `);
          } else {
            // Create new record
            await db.execute(sql`
              INSERT INTO student_try_content (id, contentid, hocsinh_id, student_try_id, time_start, time_end, update)
              VALUES (${crypto.randomUUID()}, ${row.contentid}, ${row.hocsinh_id}, ${crypto.randomUUID()}, ${new Date().toISOString()}, ${new Date().toISOString()}, ${row.question_ids})
            `);
          }
        } catch (error) {
          console.error(`Error updating record for student ${row.hocsinh_id}, content ${row.contentid}:`, error);
        }
      }

      console.log(`Updated student try content tracking for ${result.rows.length} records`);
    });
  }

  async createPendingAccessRequest(request: any): Promise<any> {
    return this.executeWithRetry(async () => {
      const [result] = await db.insert(pending_access_requests)
        .values(request)
        .returning();
      return result;
    });
  }

  async createStudentTryContent(record: any): Promise<any> {
    return this.executeWithRetry(async () => {
      const [result] = await db.insert(student_try_content)
        .values(record)
        .returning();
      return result;
    });
  }

  async getStudentTryContentByStudent(studentId: string): Promise<any[]> {
    return this.executeWithRetry(async () => {
      const result = await db.select()
        .from(student_try_content)
        .where(eq(student_try_content.hocsinh_id, studentId))
        .orderBy(desc(student_try_content.time_start))
        .limit(20);
      return result;
    });
  }

  async getRecentStudentTryContent(): Promise<any[]> {
    return this.executeWithRetry(async () => {
      const result = await db.select()
        .from(student_try_content)
        .orderBy(desc(student_try_content.time_start))
        .limit(10);
      return result;
    });
  }

  async getLiveClassActivities(studentIds: string[], startTime: string): Promise<any[]> {
    return this.executeWithRetry(async () => {
      const results = [];

      // Process each student individually to avoid complex query parameter issues
      for (const studentId of studentIds) {
        // Get student info with all necessary fields
        const studentInfo = await db.execute(sql`
          SELECT id, first_name, last_name, full_name, 
                 COALESCE(full_name, first_name || ' ' || last_name) as student_name
          FROM users WHERE id = ${studentId}
        `);

        if (studentInfo.rows.length === 0) continue;

        const student = studentInfo.rows[0] as any;

        // Get content views count
      const contentViews = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM student_try_content stc
        WHERE stc.hocsinh_id = ${studentId} 
          AND stc.time_start >= ${startTime}
      `);

      // Get content ratings count
      const contentRatings = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM content_ratings cr
        WHERE cr.student_id = ${studentId} 
          AND cr.updated_at >= ${startTime}
      `);

        // Get quiz attempts count and accuracy based on quiz_result
        const quizAttempts = await db.execute(sql`
        SELECT COUNT(*) as attempts_count,
               COUNT(CASE WHEN quiz_result = '✅' THEN 1 END) as correct_count
        FROM student_try st
        WHERE st.hocsinh_id = ${studentId} 
          AND st.time_start >= ${startTime}::timestamp
          AND st.quiz_result IS NOT NULL
          AND st.quiz_result != ''
      `);

        const totalQuizzes = parseInt((quizAttempts.rows[0] as any)?.attempts_count) || 0;
        const correctAnswers = parseInt((quizAttempts.rows[0] as any)?.correct_count) || 0;
        const quizAccuracy = totalQuizzes > 0 ? Math.round((correctAnswers / totalQuizzes) * 100) : null;

        results.push({
          student_id: student.id,
          student_name: student.student_name,
          first_name: student.first_name,
          last_name: student.last_name,
          full_name: student.full_name,
          content_viewed: parseInt((contentViews.rows[0] as any)?.count) || 0,
          content_rated: parseInt((contentRatings.rows[0] as any)?.count) || 0,
          quiz_attempts: totalQuizzes,
          quiz_accuracy: quizAccuracy,
          last_activity: null,
          activities: []
        });
      }

      return results;
    });
  }

  // Admin update methods
  async updateUser(userId: string, updateData: Partial<User>): Promise<User | undefined> {
    return this.executeWithRetry(async () => {
      const result = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();
      return result[0];
    });
  }

  async updateTopic(topicId: string, updateData: Partial<Topic>): Promise<Topic | undefined> {
    return this.executeWithRetry(async () => {
      const result = await db
        .update(topics)
        .set(updateData)
        .where(eq(topics.id, topicId))
        .returning();
      return result[0];
    });
  }

  async createTopic(topicData: any): Promise<Topic> {
    return this.executeWithRetry(async () => {
      // Generate ID if not provided
      if (!topicData.id) {
        topicData.id = crypto.randomBytes(4).toString('hex');
      }

      const result = await db
        .insert(topics)
        .values(topicData)
        .returning();
      return result[0];
    });
  }

  async createContent(contentData: any): Promise<Content> {
    return this.executeWithRetry(async () => {
      // Generate ID if not provided
      if (!contentData.id) {
        contentData.id = crypto.randomBytes(4).toString('hex');
      }

      const result = await db
        .insert(content)
        .values(contentData)
        .returning();
      return result[0];
    });
  }

  async createMatching(matchingData: any): Promise<Matching> {
    return this.executeWithRetry(async () => {
      // Generate ID if not provided
      if (!matchingData.id) {
        matchingData.id = crypto.randomBytes(4).toString('hex');
      }

      const result = await db
        .insert(matching)
        .values(matchingData)
        .returning();
      return result[0];
    });
  }

  // Debate Submissions methods
  async createDebateSubmission(submission: InsertDebateSubmission): Promise<DebateSubmission> {
    return this.executeWithRetry(async () => {
      const result = await db
        .insert(debate_submissions)
        .values(submission)
        .returning();
      return result[0];
    });
  }

  async getDebateSubmission(id: string): Promise<DebateSubmission | undefined> {
    return this.executeWithRetry(async () => {
      const result = await db
        .select()
        .from(debate_submissions)
        .where(eq(debate_submissions.id, id))
        .limit(1);
      return result[0];
    });
  }

  async getDebateSubmissionsByStudent(studentId: string): Promise<DebateSubmission[]> {
    return this.executeWithRetry(async () => {
      return await db
        .select()
        .from(debate_submissions)
        .where(eq(debate_submissions.student_id, studentId))
        .orderBy(desc(debate_submissions.submitted_at));
    });
  }

  async getDebateSubmissionsByContent(contentId: string): Promise<DebateSubmission[]> {
    return this.executeWithRetry(async () => {
      return await db
        .select()
        .from(debate_submissions)
        .where(eq(debate_submissions.content_id, contentId))
        .orderBy(desc(debate_submissions.submitted_at));
    });
  }

  async updateDebateSubmission(id: string, updates: Partial<DebateSubmission>): Promise<DebateSubmission> {
    return this.executeWithRetry(async () => {
      const result = await db
        .update(debate_submissions)
        .set({ ...updates, updated_at: new Date() })
        .where(eq(debate_submissions.id, id))
        .returning();
      return result[0];
    });
  }

}

export const storage = new DatabaseStorage();