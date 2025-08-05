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

export function setupRoutes(app: Express) {
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
}