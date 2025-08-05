import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { registerRoutes } from "./routes";
import serveStatic from "serve-static";
import { setupVite, serveStatic as viteServeStatic, log } from "./vite";
import { wakeUpDatabase } from "./db";
import { cronScheduler } from "./cron-scheduler";

const app = express();
const server = createServer(app);

// Set up Socket.IO server for real-time monitoring
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Make io available globally for routes
(global as any).io = io;

// Handle WebSocket connections for live monitoring
io.on('connection', (socket) => {
  console.log('Client connected to live monitor:', socket.id);

  socket.on('join-monitor', (data) => {
    console.log('Client joined monitor room:', data);
    socket.join('live-monitor');
    socket.emit('connection-confirmed', { message: 'Joined live monitor room', timestamp: new Date().toISOString() });
  });

  socket.on('join-leaderboard', () => {
    console.log('Client joined leaderboard room');
    socket.join('leaderboard');
    socket.emit('connection-confirmed', { message: 'Joined leaderboard room', timestamp: new Date().toISOString() });
  });

  socket.on('disconnect', (reason) => {
    console.log('Client disconnected from live monitor:', socket.id);
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Wake up database on startup (non-blocking)
  console.log('Waking up database...');
  wakeUpDatabase().then(success => {
    if (success) {
      console.log('Database connection established successfully');
    } else {
      console.log('Database connection failed, but server will continue running');
    }
  }).catch(error => {
    console.error('Database wake up failed, but continuing server startup:', error);
  });

  const serverRoutes = await registerRoutes(app);
  // Setup Socket.IO for real-time updates
  // Store the io instance globally for use in routes
  //(global as any).io = io;

  //io.on('connection', (socket) => {
  //  console.log('Client connected to live monitor:', socket.id);

  //  socket.on('join-monitor', (data) => {
  //    console.log('Client joined monitor room:', data);
  //    socket.join('live-monitor');
  //  });

  //  socket.on('disconnect', () => {
  //    console.log('Client disconnected from live monitor:', socket.id);
  //  });
  //});

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    if (!res.headersSent) {
      res.status(status).json({ message });
    }
    console.error('Server error:', err);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, serverRoutes);
  } else {
    viteServeStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);

    // Start the daily student tracking cron job
    cronScheduler.startDailyStudentTracking();
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, stopping cron jobs...');
    cronScheduler.stopAll();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, stopping cron jobs...');
    cronScheduler.stopAll();
    process.exit(0);
  });
})();