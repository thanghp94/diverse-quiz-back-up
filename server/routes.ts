import type { Express } from "express";
import { createServer, type Server } from "http";
import { readFileSync } from "fs";
import { join } from "path";
import { storage } from "./storage";
import { wakeUpDatabase, db } from "./db";
import { getSessionMiddleware, isStudentAuthenticated } from "./sessionAuth";
import { setupGoogleAuth } from "./googleAuth";
import { sql } from "drizzle-orm";
import crypto from 'crypto';
import { writing_submissions } from "@shared/schema";

// Session type declarations
declare module 'express-session' {
  export interface SessionData {
    userId: string;
    user: any;
  }
}

// Helper functions for consistent error handling
class ApiResponse {
  static success(res: any, data: any, message?: string) {
    return res.json({ success: true, ...data, ...(message && { message }) });
  }

  static error(res: any, status: number, message: string, details?: any) {
    return res.status(status).json({ 
      success: false, 
      message, 
      ...(details && { details }) 
    });
  }

  static notFound(res: any, resource: string) {
    return this.error(res, 404, `${resource} not found`);
  }

  static unauthorized(res: any, message = 'Not authenticated') {
    return this.error(res, 401, message);
  }

  static badRequest(res: any, message: string) {
    return this.error(res, 400, message);
  }

  static serverError(res: any, message = 'Internal server error', error?: any) {
    console.error('Server error:', error);
    return this.error(res, 500, message);
  }
}

// Session management helper
class SessionManager {
  static async saveSession(req: any, res: any, user: any): Promise<boolean> {
    return new Promise((resolve) => {
      req.session.userId = user.id;
      req.session.user = user;

      req.session.save((err: any) => {
        if (err) {
          console.error('Session save error:', err);
          ApiResponse.serverError(res, 'Session save failed');
          resolve(false);
        } else {
          console.log('Session saved successfully for user:', user.id);
          resolve(true);
        }
      });
    });
  }

  static destroySession(req: any, res: any, callback: () => void) {
    req.session.destroy((err: any) => {
      if (err) {
        console.error('Session destroy error:', err);
        return ApiResponse.serverError(res, 'Logout failed');
      }
      res.clearCookie('connect.sid');
      callback();
    });
  }
}

// Route handlers organized by functionality
class AuthRoutes {
  static async studentLogin(req: any, res: any) {
    try {
      const { identifier } = req.body;

      if (!identifier) {
        return ApiResponse.badRequest(res, 'Student ID or Meraki Email is required');
      }

      const user = await storage.getUserByIdentifier(identifier);
      if (!user) {
        return ApiResponse.unauthorized(res, 'Invalid Student ID or Meraki Email');
      }

      const sessionSaved = await SessionManager.saveSession(req, res, user);
      if (!sessionSaved) return; // Response already sent

      const needsPersonalEmail = !user.email || user.email === user.meraki_email;
      return ApiResponse.success(res, { user, needsPersonalEmail });
    } catch (error) {
      return ApiResponse.serverError(res, 'Login failed', error);
    }
  }

  static async emailLogin(req: any, res: any) {
    try {
      const { email } = req.body;

      if (!email) {
        return ApiResponse.badRequest(res, 'Email is required');
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return ApiResponse.unauthorized(res, 'Email not found. Please use Student ID for first-time login.');
      }

      const sessionSaved = await SessionManager.saveSession(req, res, user);
      if (!sessionSaved) return; // Response already sent

      return ApiResponse.success(res, { user });
    } catch (error) {
      return ApiResponse.serverError(res, 'Login failed', error);
    }
  }

  static async loginWithPassword(req: any, res: any) {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        return ApiResponse.badRequest(res, 'Student ID/Email and password are required');
      }

      if (password !== 'Meraki123') {
        return ApiResponse.unauthorized(res, 'Invalid password. Use default password: Meraki123');
      }

      const student = await storage.getUserByIdentifier(identifier);
      if (!student) {
        return ApiResponse.notFound(res, 'Student ID or Meraki Email');
      }

      const sessionSaved = await SessionManager.saveSession(req, res, student);
      if (!sessionSaved) return; // Response already sent

      const needsEmailSetup = !student.email || student.email === student.meraki_email;
      return ApiResponse.success(res, { 
        user: student, 
        needsEmailSetup 
      }, needsEmailSetup ? 'Please set up your personal email' : 'Login successful');
    } catch (error) {
      return ApiResponse.serverError(res, 'Login failed', error);
    }
  }

  static async getUser(req: any, res: any) {
    try {
      console.log('Auth check - Session ID:', req.sessionID);
      console.log('Auth check - User ID in session:', req.session.userId);

      if (!req.session.userId) {
        return ApiResponse.unauthorized(res);
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return ApiResponse.unauthorized(res, 'User not found');
      }

      console.log('Auth check successful for user:', user.id);
      return res.json(user);
    } catch (error) {
      return ApiResponse.serverError(res, 'Failed to fetch user', error);
    }
  }

  static async setupEmail(req: any, res: any) {
    if (!req.session.userId) {
      return ApiResponse.unauthorized(res, 'Authentication required');
    }

    try {
      const { personalEmail } = req.body;
      const userId = req.session.userId;

      if (!personalEmail) {
        return ApiResponse.badRequest(res, 'Personal email is required');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(personalEmail)) {
        return ApiResponse.badRequest(res, 'Invalid email format');
      }

      const updatedStudent = await storage.updateUserEmail(userId, personalEmail);
      req.session.user = updatedStudent;

      return ApiResponse.success(res, { user: updatedStudent }, 'Personal email saved successfully');
    } catch (error) {
      return ApiResponse.serverError(res, 'Failed to save email', error);
    }
  }

  static async skipEmailSetup(req: any, res: any) {
    if (!req.session.userId) {
      return ApiResponse.unauthorized(res, 'Authentication required');
    }

    try {
      return ApiResponse.success(res, {}, 'Email setup skipped');
    } catch (error) {
      return ApiResponse.serverError(res, 'Failed to skip email setup', error);
    }
  }

  static logout(req: any, res: any) {
    SessionManager.destroySession(req, res, () => {
      ApiResponse.success(res, {}, 'Logged out successfully');
    });
  }

  static testConfig(req: any, res: any) {
    const domain = process.env.REPLIT_DOMAINS?.split(',')[0];
    const clientId = process.env.GOOGLE_CLIENT_ID;

    return res.json({
      domain,
      callbackURL: `https://${domain}/api/auth/google/callback`,
      googleClientId: clientId ? clientId.substring(0, 12) + '...' + clientId.slice(-6) : 'Missing',
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Configured' : 'Missing',
      currentURL: req.protocol + '://' + req.get('host'),
      directOAuthURL: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=https%3A%2F%2F${domain}%2Fapi%2Fauth%2Fgoogle%2Fcallback&scope=profile%20email&response_type=code`,
      timestamp: new Date().toISOString()
    });
  }
}

class ContentRoutes {
  static async getTopics(req: any, res: any) {
    try {
      const topics = await storage.getTopics();
      return res.json(topics);
    } catch (error) {
      return ApiResponse.serverError(res, 'Failed to fetch topics', error);
    }
  }

  static async getBowlChallengeTopics(req: any, res: any) {
    try {
      const topics = await storage.getBowlChallengeTopics();
      return res.json(topics);
    } catch (error) {
      return ApiResponse.serverError(res, 'Failed to fetch bowl challenge topics', error);
    }
  }

  static async getTopicById(req: any, res: any) {
    try {
      const topic = await storage.getTopicById(req.params.id);
      if (!topic) {
        return ApiResponse.notFound(res, 'Topic');
      }
      return res.json(topic);
    } catch (error) {
      return ApiResponse.serverError(res, 'Failed to fetch topic', error);
    }
  }

  static async getContent(req: any, res: any) {
    try {
      const topicId = req.query.topicId as string;
      const content = await storage.getContent(topicId);
      return res.json(content);
    } catch (error) {
      return ApiResponse.serverError(res, 'Failed to fetch content', error);
    }
  }

  static async getContentById(req: any, res: any) {
    try {
      const content = await storage.getContentById(req.params.id);
      if (!content) {
        return ApiResponse.notFound(res, 'Content');
      }
      return res.json(content);
    } catch (error) {
      return ApiResponse.serverError(res, 'Failed to fetch content', error);
    }
  }

  static async updateContent(req: any, res: any) {
    try {
      const { short_description, short_blurb, imageid, videoid, videoid2 } = req.body;
      const updates = { short_description, short_blurb, imageid, videoid, videoid2 };

      // Remove undefined fields
      Object.keys(updates).forEach(key => {
        if (updates[key as keyof typeof updates] === undefined) {
          delete updates[key as keyof typeof updates];
        }
      });

      const updatedContent = await storage.updateContent(req.params.id, updates);
      if (!updatedContent) {
        return ApiResponse.notFound(res, 'Content');
      }
      return res.json(updatedContent);
    } catch (error) {
      return ApiResponse.serverError(res, 'Failed to update content', error);
    }
  }

  static async trackContentAccess(req: any, res: any) {
    try {
      const { student_id, content_id } = req.body;

      console.log(`Content access tracking called: Student ${student_id}, Content ${content_id}`);

      if (!student_id || !content_id) {
        return ApiResponse.badRequest(res, 'student_id and content_id are required');
      }

      // Record in student_try_content table for proper content tracking
      try {
        const now = new Date().toISOString();
        const studentTryContentRecord = {
          id: crypto.randomUUID(),
          contentid: content_id,
          hocsinh_id: student_id,
          student_try_id: crypto.randomUUID(),
          time_start: now,
          time_end: now,
          update: now // Use ISO timestamp instead of custom string
        };

        await db.execute(sql`
          INSERT INTO student_try_content (id, contentid, hocsinh_id, student_try_id, time_start, time_end, update)
          VALUES (${studentTryContentRecord.id}, ${content_id}, ${student_id}, ${studentTryContentRecord.student_try_id}, ${now}, ${now}, ${now})
        `);
        console.log(`Student try content record created for Student ${student_id}, Content ${content_id}`);
      } catch (contentError) {
        console.error('Error creating student_try_content record:', contentError);
      }

      const existingRating = await storage.getContentRating(student_id, content_id);

      if (!existingRating) {
        const accessRecord = await storage.createContentRating({
          id: crypto.randomUUID(),
          student_id,
          content_id,
          rating: 'viewed',
          personal_note: null,
          view_count: 1
        });

        // Emit real-time update via WebSocket
        const io = (global as any).io;
        if (io) {
          const content = await storage.getContentById(content_id);
          io.to('live-monitor').emit('content-activity', {
            type: 'content_view',
            student_id,
            content_id,
            content_title: content?.title || 'Unknown Content',
            timestamp: new Date().toISOString()
          });
        }

        console.log(`Content access recorded: Student ${student_id} viewed content ${content_id}`);
        return ApiResponse.success(res, { record: accessRecord }, 'Content access recorded');
      } else {
        const updatedRating = await storage.incrementContentViewCount(student_id, content_id);
        console.log(`Content view count incremented: Student ${student_id} viewed content ${content_id}`);
        return ApiResponse.success(res, { record: updatedRating }, 'Content view count updated');
      }
    } catch (error) {
      return ApiResponse.serverError(res, 'Failed to track content access', error);
    }
  }
}

class SystemRoutes {
  static async healthCheck(req: any, res: any) {
    try {
      const isDbHealthy = await wakeUpDatabase();
      return res.json({ 
        status: isDbHealthy ? 'healthy' : 'unhealthy',
        database: isDbHealthy ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Health check failed:', error);
      return res.status(503).json({ 
        status: 'unhealthy',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  static async wakeDatabase(req: any, res: any) {
    try {
      console.log('Attempting to wake up database...');
      const success = await wakeUpDatabase();
      return res.json({ 
        success,
        message: success ? 'Database is awake' : 'Failed to wake database',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Wake up failed:', error);
      return res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware for authentication
  app.use(getSessionMiddleware());

  // Set up Google OAuth authentication
  setupGoogleAuth(app);

  // Authentication routes
  app.post('/api/auth/student-login', AuthRoutes.studentLogin);
  app.post('/api/auth/email-login', AuthRoutes.emailLogin);
  app.post('/api/auth/login', AuthRoutes.loginWithPassword);
  app.get('/api/auth/user', AuthRoutes.getUser);
  app.post('/api/auth/setup-email', AuthRoutes.setupEmail);
  app.post('/api/auth/skip-email-setup', AuthRoutes.skipEmailSetup);
  app.post('/api/auth/logout', AuthRoutes.logout);
  app.get('/api/auth/test', AuthRoutes.testConfig);

  // Legacy email setup route
  app.post('/api/auth/set-personal-email', async (req, res) => {
    try {
      const { identifier, personalEmail } = req.body;

      if (!identifier || !personalEmail) {
        return ApiResponse.badRequest(res, 'Both identifier and email are required');
      }

      const user = await storage.getUserByIdentifier(identifier);
      if (!user) {
        return ApiResponse.unauthorized(res, 'Invalid Student ID or Meraki Email');
      }

      const updatedUser = await storage.updateUserEmail(user.id, personalEmail);
      const sessionSaved = await SessionManager.saveSession(req, res, updatedUser);
      if (!sessionSaved) return;

      return ApiResponse.success(res, { user: updatedUser });
    } catch (error) {
      return ApiResponse.serverError(res, 'Failed to save email', error);
    }
  });

  // System routes
  app.get("/api/health", SystemRoutes.healthCheck);
  app.post("/api/wake-db", SystemRoutes.wakeDatabase);
  
  // Version endpoint
  app.get("/api/version", (req, res) => {
    try {
      const packageJsonPath = join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      
      res.json({
        version: packageJson.version,
        name: packageJson.name,
        buildDate: new Date().toISOString(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        gitCommit: process.env.REPLIT_GIT_SHA || '4b7cb0f', // Current git commit
        gitCommitFull: '4b7cb0f484ec2d71227d40c7d7dd3143cc2a4819',
        deploymentTimestamp: new Date().toISOString(),
        status: 'operational'
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to read version information',
        status: 'error',
        gitCommit: '4b7cb0f',
        environment: process.env.NODE_ENV || 'development'
      });
    }
  });

  // Content routes
  app.get("/api/topics", isStudentAuthenticated, ContentRoutes.getTopics);
  app.get("/api/topics/bowl-challenge", ContentRoutes.getBowlChallengeTopics);
  app.get("/api/topics/:id", ContentRoutes.getTopicById);
  app.get("/api/content", isStudentAuthenticated, ContentRoutes.getContent);
  app.get("/api/content/:id", isStudentAuthenticated, ContentRoutes.getContentById);
  app.patch("/api/content/:id", ContentRoutes.updateContent);
  app.post("/api/content-access", ContentRoutes.trackContentAccess);

  // Content Groups API
  app.get("/api/content-groups", async (req, res) => {
    try {
      const contentGroups = await storage.getContentGroups();
      res.json(contentGroups);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch content groups', error);
    }
  });

  app.get("/api/content-groups/:groupName", async (req, res) => {
    try {
      const contentGroup = await storage.getContentByGroup(req.params.groupName);
      res.json(contentGroup);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch content by group', error);
    }
  });

  app.get("/api/content-groups/topic/:topicId", async (req, res) => {
    try {
      const topicId = req.params.topicId;
      const allContent = await storage.getContent(topicId);

      const groupedContent: { [key: string]: any[] } = {};
      const ungroupedContent: any[] = [];

      allContent.forEach(content => {
        if (content.contentgroup && content.contentgroup.trim() !== '') {
          if (!groupedContent[content.contentgroup]) {
            groupedContent[content.contentgroup] = [];
          }
          groupedContent[content.contentgroup].push(content);
        } else {
          ungroupedContent.push(content);
        }
      });

      const response = {
        groups: Object.entries(groupedContent).map(([groupName, content]) => ({
          groupName,
          content,
          count: content.length
        })),
        ungroupedContent
      };

      res.json(response);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch content groups by topic', error);
    }
  });

  // Images API
  app.get("/api/images", async (req, res) => {
    try {
      const images = await storage.getImages();
      res.json(images);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch images', error);
    }
  });

  app.get("/api/images/:id", async (req, res) => {
    try {
      const image = await storage.getImageById(req.params.id);
      if (!image) {
        return ApiResponse.notFound(res, 'Image');
      }
      res.json(image);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch image', error);
    }
  });

  // Questions API
  app.get("/api/questions", async (req, res) => {
    try {
      const { contentId, topicId, level } = req.query;
      console.log(`API: Fetching questions with contentId: ${contentId}, topicId: ${topicId}, level: ${level}`);

      const levelParam = level && level !== 'undefined' ? level as string : undefined;
      const questions = await storage.getQuestions(
        contentId as string, 
        topicId as string, 
        levelParam
      );

      console.log(`API: Returning ${questions.length} questions for level: ${levelParam || 'all'}`);
      res.json(questions);
    } catch (error) {
      ApiResponse.serverError(res, "Failed to fetch questions", error);
    }
  });

  app.get("/api/questions/:id", async (req, res) => {
    try {
      const question = await storage.getQuestionById(req.params.id);
      if (!question) {
        return ApiResponse.notFound(res, 'Question');
      }
      res.json(question);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch question', error);
    }
  });

  // Matching API
  app.get("/api/matching", async (req, res) => {
    try {
      const matching = await storage.getMatchingActivities();
      res.json(matching);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch matching activities', error);
    }
  });

  app.get("/api/matching/:id", async (req, res) => {
    try {
      const matching = await storage.getMatchingById(req.params.id);
      if (!matching) {
        return ApiResponse.notFound(res, 'Matching activity');
      }
      res.json(matching);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch matching activity', error);
    }
  });

  app.get("/api/matching/topic/:topicId", async (req, res) => {
    try {
      const matching = await storage.getMatchingByTopicId(req.params.topicId);
      res.json(matching);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch matching activities by topic', error);
    }
  });

  // Videos API
  app.get("/api/videos", async (req, res) => {
    try {
      const videos = await storage.getVideos();
      res.json(videos);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch videos', error);
    }
  });

  app.get("/api/videos/:id", async (req, res) => {
    try {
      const video = await storage.getVideoById(req.params.id);
      if (!video) {
        return ApiResponse.notFound(res, 'Video');
      }
      res.json(video);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch video', error);
    }
  });

  app.get("/api/content/:contentId/videos", async (req, res) => {
    try {
      const videos = await storage.getVideosByContentId(req.params.contentId);
      res.json(videos);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch videos for content', error);
    }
  });

  // User API
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch users', error);
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return ApiResponse.notFound(res, 'User');
      }
      res.json(user);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch user', error);
    }
  });

  app.get("/api/users/by-email/:email", async (req, res) => {
    try {
      const email = decodeURIComponent(req.params.email);
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return ApiResponse.notFound(res, 'User');
      }
      res.json(user);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch user', error);
    }
  });

  // Matching Attempts API
  app.post("/api/matching-attempts", async (req, res) => {
    try {
      const attempt = await storage.createMatchingAttempt(req.body);
      res.json(attempt);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to create matching attempt', error);
    }
  });

  app.get("/api/matching-attempts/student/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const { matchingId } = req.query;
      const attempts = await storage.getMatchingAttempts(studentId, matchingId as string);
      res.json(attempts);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch matching attempts', error);
    }
  });

  app.get("/api/matching-attempts/:id", async (req, res) => {
    try {
      const attempt = await storage.getMatchingAttemptById(req.params.id);
      if (!attempt) {
        return ApiResponse.notFound(res, 'Matching attempt');
      }
      res.json(attempt);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch matching attempt', error);
    }
  });

  app.patch("/api/matching-attempts/:id", async (req, res) => {
    try {
      const attempt = await storage.updateMatchingAttempt(req.params.id, req.body);
      res.json(attempt);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to update matching attempt', error);
    }
  });

  // Personal Content API
  app.get("/api/personal-content/:studentId", async (req, res) => {
    try {
      const personalContent = await storage.getPersonalContent(req.params.studentId);
      res.json(personalContent);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch personal content', error);
    }
  });

  // Content Ratings API
  app.post("/api/content-ratings", async (req, res) => {
    try {
      const rating = await storage.createContentRating(req.body);
      res.json(rating);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to create content rating', error);
    }
  });

  app.get("/api/content-ratings/:studentId", async (req, res) => {
    try {
      const ratings = await storage.getContentRatingsByStudent(req.params.studentId);
      res.json(ratings);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch student content ratings', error);
    }
  });

  app.get("/api/student-tries-count/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const { contentIds } = req.query;

      if (!contentIds) {
        return res.json({});
      }

      const contentIdArray = typeof contentIds === 'string' ? contentIds.split(',') : Array.isArray(contentIds) ? contentIds : [];
      const allStudentTries = await storage.getAllStudentTries();
      const triesCount: Record<string, number> = {};

      allStudentTries
        .filter((studentTry: any) => 
          studentTry.student_id === studentId && 
          studentTry.question_id && 
          contentIdArray.includes(studentTry.question_id)
        )
        .forEach((studentTry: any) => {
          if (studentTry.question_id) {
            triesCount[studentTry.question_id] = (triesCount[studentTry.question_id] || 0) + 1;
          }
        });

      res.json(triesCount);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch student tries count', error);
    }
  });

  app.get("/api/content-ratings/:studentId/:contentId", async (req, res) => {
    try {
      const rating = await storage.getContentRating(req.params.studentId, req.params.contentId);
      if (rating === null) {
        return ApiResponse.notFound(res, 'Rating');
      }
      res.json(rating);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch content rating', error);
    }
  });

  app.put("/api/content-ratings/:studentId/:contentId", async (req, res) => {
    try {
      const { rating, personal_note } = req.body;
      const result = await storage.updateContentRating(req.params.studentId, req.params.contentId, rating, personal_note);

      if (rating) {
        try {
          await storage.recordDailyActivity(req.params.studentId, 10);
          await storage.updateStudentStreak(req.params.studentId);

          // Emit real-time update via WebSocket
          const io = (global as any).io;
          if (io) {
            const content = await storage.getContentById(req.params.contentId);
            io.to('live-monitor').emit('content-activity', {
              type: 'content_rating',
              student_id: req.params.studentId,
              content_id: req.params.contentId,
              content_title: content?.title || 'Unknown Content',
              rating: rating,
              timestamp: new Date().toISOString()
            });
          }
        } catch (activityError) {
          console.log('Failed to record activity/streak:', activityError);
        }
      }

      res.json(result);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to update content rating', error);
    }
  });

  // Student tries leaderboard
  app.get("/api/student-tries-leaderboard", async (req, res) => {
    try {
      const leaderboard = await storage.getStudentTriesLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch leaderboard', error);
    }
  });

  app.get("/api/content-ratings/stats/:contentId", async (req, res) => {
    try {
      const stats = await storage.getContentRatingStats(req.params.contentId);
      res.json(stats);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch content rating stats', error);
    }
  });

  // Student Streaks API
  app.get("/api/streaks/:studentId", async (req, res) => {
    try {
      const streak = await storage.getStudentStreak(req.params.studentId);
      res.json(streak);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch student streak', error);
    }
  });

  app.post("/api/streaks/:studentId", async (req, res) => {
    try {
      await storage.recordDailyActivity(req.params.studentId, 10);
      const streak = await storage.updateStudentStreak(req.params.studentId);
      res.json(streak);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to update student streak', error);
    }
  });

  // Daily Activities API
  app.post("/api/daily-activities", async (req, res) => {
    try {
      const activity = await storage.recordDailyActivity(req.body.studentId, req.body.points);
      res.json(activity);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to record daily activity', error);
    }
  });

  // Leaderboards API
  app.get("/api/leaderboards", async (req, res) => {
    try {
      const leaderboards = await storage.getLeaderboards();
      res.json(leaderboards);
    } catch (error) {ApiResponse.serverError(res, 'Failed to fetch leaderboards', error);
    }
  });

  // Writing Prompts API
  app.get("/api/writing-prompts", async (req, res) => {
    try {
      const prompts = await storage.getWritingPrompts();
      res.json(prompts);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch writing prompts', error);
    }
  });

  app.get("/api/writing-prompts/category/:category", async (req, res) => {
    try {
      const prompts = await storage.getWritingPromptsByCategory(req.params.category);
      res.json(prompts);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch writing prompts by category', error);
    }
  });

  app.get("/api/writing-prompts/:id", async (req, res) => {
    try {
      const prompt = await storage.getWritingPromptById(req.params.id);
      if (!prompt) {
        return ApiResponse.notFound(res, 'Writing prompt');
      }
      res.json(prompt);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch writing prompt', error);
    }
  });

  // Writing Submissions API (handled later with proper field mapping)

  app.get("/api/writing-submissions/:id", async (req, res) => {
    try {
      const submission = await storage.getWritingSubmission(req.params.id);
      if (!submission) {
        return ApiResponse.notFound(res, 'Writing submission');
      }
      res.json(submission);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch writing submission', error);
    }
  });

  app.get("/api/writing-submissions/student/:studentId", async (req, res) => {
    try {
      const submissions = await storage.getStudentWritingSubmissions(req.params.studentId);
      res.json(submissions);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch student writing submissions', error);
    }
  });

  app.patch("/api/writing-submissions/:id", async (req, res) => {
    try {
      const submission = await storage.updateWritingSubmission(req.params.id, req.body);
      res.json(submission);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to update writing submission', error);
    }
  });

  // Assignment API
  app.get("/api/assignments", async (req, res) => {
    try {
      const assignments = await storage.getAllAssignments();
      res.json(assignments);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch assignments', error);
    }
  });

  app.get("/api/assignments/live-class", async (req, res) => {
    try {
      const liveClassAssignments = await storage.getLiveClassAssignments();
      res.json(liveClassAssignments);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch live class assignments', error);
    }
  });

  app.post("/api/assignments", async (req, res) => {
    try {
      const assignment = await storage.createAssignment(req.body);
      res.json(assignment);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to create assignment', error);
    }
  });

  app.get("/api/assignments/:id", async (req, res) => {
    try {
      const assignment = await storage.getAssignmentById(req.params.id);
      if (!assignment) {
        return ApiResponse.notFound(res, 'Assignment');
      }
      res.json(assignment);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch assignment', error);
    }
  });

  app.post("/api/assignments/:id/duplicate", async (req, res) => {
    try {
      const { type } = req.body;
      const assignment = await storage.duplicateAssignment(req.params.id, type);
      res.json(assignment);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to duplicate assignment', error);
    }
  });

  // Assignment Student Try API
  app.get("/api/assignment-student-tries", async (req, res) => {
    try {
      const assignmentStudentTries = await storage.getAllAssignmentStudentTries();
      res.json(assignmentStudentTries);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch assignment student tries', error);
    }
  });

  app.post("/api/assignment-student-tries", async (req, res) => {
    try {
      const assignmentStudentTry = await storage.createAssignmentStudentTry(req.body);
      res.json(assignmentStudentTry);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to create assignment student try', error);
    }
  });

  app.get("/api/assignment-student-tries/:id", async (req, res) => {
    try {
      const assignmentStudentTry = await storage.getAssignmentStudentTryById(req.params.id);
      if (!assignmentStudentTry) {
        return ApiResponse.notFound(res, 'Assignment student try');
      }
      res.json(assignmentStudentTry);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch assignment student try', error);
    }
  });

  // Student Try API
  app.get("/api/student-tries", async (req, res) => {
    try {
      const tries = await storage.getAllStudentTries();
      res.json(tries);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch student tries', error);
    }
  });

  app.post("/api/student-tries", async (req, res) => {
    try {
      console.log('Creating student try with data:', req.body);
      const studentTry = await storage.createStudentTry(req.body);
      console.log('Student try created:', studentTry);

      // Emit real-time update via WebSocket immediately (synchronous for fastest delivery)
      const io = (global as any).io;
      if (io) {
        try {
          // Get question and content details for enriched WebSocket data
          const question = await storage.getQuestion(studentTry.question_id);
          const content = question ? await storage.getContentById(question.contentid) : null;
          
          const activityData = {
            type: 'quiz_attempt',
            student_id: studentTry.hocsinh_id,
            content_id: question?.contentid || 'unknown',
            content_title: content?.title || 'Unknown Content',
            quiz_result: studentTry.quiz_result,
            score: studentTry.score,
            timestamp: new Date().toISOString(),
            question_id: studentTry.question_id
          };

          console.log('⚡ Emitting immediate quiz-activity WebSocket event:', activityData);
          
          // Emit to all connected clients immediately
          io.emit('quiz-activity', activityData);
          io.to('live-monitor').emit('quiz-activity', activityData);
          io.to('leaderboard').emit('quiz-activity', activityData);
          
          // Also emit a specific leaderboard update event
          io.emit('leaderboard-update', {
            type: 'quiz_activity',
            student_id: studentTry.hocsinh_id,
            timestamp: new Date().toISOString()
          });
          
        } catch (error) {
          console.error('Error emitting WebSocket event:', error);
        }
      }

      res.json(studentTry);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to create student try', error);
    }
  });

  app.get("/api/student-tries/:id", async (req, res) => {
    try {
      const studentTry = await storage.getStudentTryById(req.params.id);
      if (!studentTry) {
        return ApiResponse.notFound(res, 'Student try');
      }
      res.json(studentTry);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch student try', error);
    }
  });

  app.patch("/api/student-tries/:id", async (req, res) => {
    try {
      const studentTry = await storage.updateStudentTry(req.params.id, req.body);
      res.json(studentTry);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to update student try', error);
    }
  });

  // Learning Progress API
  app.get("/api/learning-progress/student/:studentId", async (req, res) => {
    try {
      const progress = await storage.getStudentLearningProgress(req.params.studentId);
      res.json(progress);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch student learning progress', error);
    }
  });

  app.post("/api/learning-progress", async (req, res) => {
    try {
      const progress = await storage.createLearningProgress(req.body);
      res.json(progress);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to create learning progress', error);
    }
  });

  app.patch("/api/learning-progress/:id", async (req, res) => {
    try {
      const progress = await storage.updateLearningProgress(req.params.id, req.body);
      res.json(progress);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to update learning progress', error);
    }
  });

  // Live Class Assignment API
  app.get("/api/live-assignments", async (req, res) => {
    try {
      const liveAssignments = await storage.getLiveClassAssignments();
      res.json(liveAssignments);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch live class assignments', error);
    }
  });

  // Live Class Monitoring API
  app.get("/api/live-class-activities", async (req, res) => {
    try {
      const { studentIds, startTime } = req.query;

      if (!studentIds || !startTime) {
        return ApiResponse.badRequest(res, 'studentIds and startTime are required');
      }

      let studentIdArray: string[];
      if (Array.isArray(studentIds)) {
        studentIdArray = studentIds.map(id => String(id));
      } else {
        studentIdArray = String(studentIds).split(',');
      }

      const activities = await storage.getLiveClassActivities(studentIdArray, startTime as string);
      res.json(activities);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch live class activities', error);
    }
  });

  app.get("/api/assignments/:assignmentId/progress", async (req, res) => {
    try {
      const progress = await storage.getAssignmentStudentProgress(req.params.assignmentId);
      res.json(progress);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch assignment student progress', error);
    }
  });

  app.get("/api/assignment-student-try/:tryId/quiz-progress", async (req, res) => {
    try {
      const quizProgress = await storage.getStudentQuizProgress(req.params.tryId);
      res.json(quizProgress);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch student quiz progress', error);
    }
  });

  // Content Progress API
  app.get("/api/content-progress/:studentId", async (req, res) => {
    try {
      const progress = await storage.getContentProgress(req.params.studentId);
      res.json(progress);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch content progress', error);
    }
  });

  // Cron Job API
  app.post("/api/cron/update-student-tracking", async (req, res) => {
    try {
      await storage.updateStudentTryContent();
      ApiResponse.success(res, {}, 'Student tracking updated successfully');
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to update student tracking', error);
    }
  });

  // Student Try Content Debug API
  app.get("/api/student-try-content/:studentId", async (req, res) => {
    try {
      const studentTryContentRecords = await storage.getStudentTryContentByStudent(req.params.studentId);
      res.json(studentTryContentRecords);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch student try content', error);
    }
  });

  app.get("/api/student-try-content", async (req, res) => {
    try {
      const recentRecords = await storage.getRecentStudentTryContent();
      res.json(recentRecords);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch recent student try content', error);
    }
  });

  // Admin API endpoints
  app.put("/api/users/:id", async (req, res) => {
    try {
      // Check if user is admin (GV0002)
      if (!req.session?.userId || req.session.userId !== 'GV0002') {
        return ApiResponse.unauthorized(res, 'Admin access required');
      }

      const userId = req.params.id;
      const updateData = req.body;

      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return ApiResponse.notFound(res, 'User');
      }

      ApiResponse.success(res, { user: updatedUser }, 'User updated successfully');
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to update user', error);
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      // Check if user is admin (GV0002)
      if (!req.session?.userId || req.session.userId !== 'GV0002') {
        return ApiResponse.unauthorized(res, 'Admin access required');
      }

      const userData = req.body;
      const newUser = await storage.createUser(userData);

      ApiResponse.success(res, { user: newUser }, 'User created successfully');
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to create user', error);
    }
  });

  app.put("/api/topics/:id", async (req, res) => {
    try {
      // Check if user is admin (GV0002)
      if (!req.session?.userId || req.session.userId !== 'GV0002') {
        return ApiResponse.unauthorized(res, 'Admin access required');
      }

      const topicId = req.params.id;
      const updateData = req.body;

      const updatedTopic = await storage.updateTopic(topicId, updateData);
      if (!updatedTopic) {
        return ApiResponse.notFound(res, 'Topic');
      }

      ApiResponse.success(res, { topic: updatedTopic }, 'Topic updated successfully');
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to update topic', error);
    }
  });

  app.post("/api/topics", async (req, res) => {
    try {
      // Check if user is admin (GV0002)
      if (!req.session?.userId || req.session.userId !== 'GV0002') {
        return ApiResponse.unauthorized(res, 'Admin access required');
      }

      const topicData = req.body;
      const newTopic = await storage.createTopic(topicData);

      ApiResponse.success(res, { topic: newTopic }, 'Topic created successfully');
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to create topic', error);
    }
  });

  app.post("/api/content", async (req, res) => {
    try {
      // Check if user is admin (GV0002)
      if (!req.session?.userId || req.session.userId !== 'GV0002') {
        return ApiResponse.unauthorized(res, 'Admin access required');
      }

      const contentData = req.body;
      const newContent = await storage.createContent(contentData);

      ApiResponse.success(res, { content: newContent }, 'Content created successfully');
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to create content', error);
    }
  });

  app.post("/api/matching", async (req, res) => {
    try {
      // Check if user is admin (GV0002)
      if (!req.session?.userId || req.session.userId !== 'GV0002') {
        return ApiResponse.unauthorized(res, 'Admin access required');
      }

      const matchingData = req.body;
      const newMatching = await storage.createMatching(matchingData);

      ApiResponse.success(res, { matching: newMatching }, 'Matching activity created successfully');
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to create matching activity', error);
    }
  });

  // Writing Submissions API
  app.get("/api/writing-submissions/draft/:studentId/:contentId", async (req, res) => {
    try {
      const { studentId, contentId } = req.params;
      const draft = await db.select()
        .from(writing_submissions)
        .where(
          sql`student_id = ${studentId} AND prompt_id = ${contentId} AND status = 'draft'`
        )
        .limit(1);

      if (draft.length > 0) {
        res.json(draft[0]);
      } else {
        return ApiResponse.notFound(res, 'Draft');
      }
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch draft', error);
    }
  });

  app.post("/api/writing-submissions/draft", async (req, res) => {
    try {
      const { student_id, content_id, content_title, outline_data, essay_data, phase, timer_remaining, timer_active } = req.body;

      // Validate required fields
      if (!student_id || !content_id) {
        return ApiResponse.badRequest(res, 'student_id and content_id are required');
      }

      // Check if draft exists
      const existing = await db.select()
        .from(writing_submissions)
        .where(
          sql`student_id = ${student_id} AND prompt_id = ${content_id} AND (status = 'draft' OR submitted_at IS NULL)`
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing draft
        const updated = await db.update(writing_submissions)
          .set({
            title: content_title || 'Academic Essay Draft',
            opening_paragraph: essay_data?.introduction || '',
            body_paragraph_1: essay_data?.body1 || essay_data?.body || '',
            body_paragraph_2: essay_data?.body2 || '',
            body_paragraph_3: essay_data?.body3 || '',
            conclusion_paragraph: essay_data?.conclusion || '',
            full_essay: [essay_data?.introduction, essay_data?.body1 || essay_data?.body, essay_data?.body2, essay_data?.body3, essay_data?.conclusion].filter(Boolean).join('\n\n'),
            updated_at: new Date()
          })
          .where(sql`id = ${existing[0].id}`)
          .returning();

        res.json(updated[0]);
      } else {
        // Create new draft
        const draftData = {
          id: crypto.randomUUID(),
          student_id: student_id,
          prompt_id: content_id,
          title: content_title || 'Academic Essay Draft',
          opening_paragraph: essay_data?.introduction || '',
          body_paragraph_1: essay_data?.body1 || essay_data?.body || '',
          body_paragraph_2: essay_data?.body2 || '',
          body_paragraph_3: essay_data?.body3 || '',
          conclusion_paragraph: essay_data?.conclusion || '',
          full_essay: [essay_data?.introduction, essay_data?.body1 || essay_data?.body, essay_data?.body2, essay_data?.body3, essay_data?.conclusion].filter(Boolean).join('\n\n'),
          status: 'draft',
          created_at: new Date(),
          updated_at: new Date()
        };

        console.log('Creating draft with data:', draftData);

        // Use storage method to ensure proper field mapping
        const created = await storage.createWritingSubmission(draftData);

        console.log('Draft created successfully:', created);
        res.json(created);
      }
    } catch (error) {
      console.error('Draft save error:', error);
      ApiResponse.serverError(res, 'Failed to save draft', error);
    }
  });

  app.delete("/api/writing-submissions/draft/:studentId/:contentId", async (req, res) => {
    try {
      const { studentId, contentId } = req.params;
      await db.delete(writing_submissions)
        .where(
          sql`student_id = ${studentId} AND prompt_id = ${contentId} AND status = 'draft'`
        );

      res.json({ success: true });
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to delete draft', error);
    }
  });

  app.post("/api/writing-submissions", async (req, res) => {
    try {
      const { student_id, content_id, content_title, outline_data, essay_data, time_spent, word_count, submitted_at } = req.body;

      // Validate required fields
      if (!student_id || !content_id) {
        return ApiResponse.badRequest(res, 'student_id and content_id are required');
      }

      // Calculate word count if not provided
      const calculatedWordCount = word_count || [
        essay_data?.introduction || '',
        essay_data?.body1 || '',
        essay_data?.body2 || '',
        essay_data?.body3 || '',
        essay_data?.conclusion || ''
      ].join(' ').trim().split(/\s+/).filter(word => word.length > 0).length;

      // Create full essay text
      const fullEssayParts = [
        essay_data?.introduction,
        essay_data?.body1,
        essay_data?.body2,
        essay_data?.body3,
        essay_data?.conclusion
      ].filter(Boolean);

      const submissionData = {
        id: crypto.randomUUID(),
        student_id: student_id,
        prompt_id: content_id, // This maps content_id to prompt_id correctly
        title: content_title || 'Academic Essay',
        opening_paragraph: essay_data?.introduction || '',
        body_paragraph_1: essay_data?.body1 || '',
        body_paragraph_2: essay_data?.body2 || '',
        body_paragraph_3: essay_data?.body3 || '',
        conclusion_paragraph: essay_data?.conclusion || '',
        full_essay: fullEssayParts.join('\n\n'),
        word_count: calculatedWordCount,
        status: 'submitted',
        created_at: new Date(),
        updated_at: new Date()
      };

      console.log('Creating writing submission with data:', submissionData);

      // Use the storage method instead of direct DB insert to ensure proper field mapping
      const submission = await storage.createWritingSubmission(submissionData);

      console.log('Writing submission created successfully:', submission);
      res.json(submission);
    } catch (error) {
      console.error('Writing submission error:', error);
      ApiResponse.serverError(res, 'Failed to create writing submission', error);
    }
  });

  app.get("/api/writing-submissions/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const submissions = await db.select()
        .from(writing_submissions)
        .where(sql`student_id = ${studentId} AND status = 'submitted'`)
        .orderBy(sql`created_at DESC`);

      res.json(submissions);
    } catch (error) {
      ApiResponse.serverError(res, 'Failed to fetch submissions', error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}