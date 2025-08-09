import type { Express } from "express";
import { authRoutes } from "./auth";
import { userRoutes } from "./users";
import { topicRoutes } from "./topics";
import { contentRoutes } from "./content";
import { questionRoutes } from "./questions";
import { matchingRoutes } from "./matching";
import { assignmentRoutes } from "./assignments";
import { streakRoutes } from "./streaks";
import { imageRoutes } from "./images";
import { videoRoutes } from "./videos";
import { writingRoutes } from "./writing";
import { debateRoutes } from "./debate";
import { liveClassRoutes } from "./liveClass";
import { collectionRoutes } from "./collections";
import { cmsFilterConfigRoutes } from "./cmsFilterConfig";
import { debateSessionRoutes } from "./debateSession";
import teamsRoutes from './teams.js';
import sessionRegistrationsRoutes from './sessionRegistrations.js';

export function setupRoutes(app: Express) {
  // Health check endpoint for Docker
  app.get('/api/health', (req, res) => {
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Setup all route modules
  authRoutes(app);
  userRoutes(app);
  topicRoutes(app);
  contentRoutes(app);
  questionRoutes(app);
  matchingRoutes(app);
  assignmentRoutes(app);
  streakRoutes(app);
  imageRoutes(app);
  videoRoutes(app);
  writingRoutes(app);
  debateRoutes(app);
  liveClassRoutes(app);
  collectionRoutes(app);
  cmsFilterConfigRoutes(app);
  // Register teams routes before debate session routes to ensure proper precedence
  app.use('/api/teams', teamsRoutes);
  app.use('/api/session-registrations', sessionRegistrationsRoutes);
  debateSessionRoutes(app);
}
