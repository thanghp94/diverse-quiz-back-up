import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express, RequestHandler } from "express";

export function getSessionMiddleware() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: "postgresql://neondb_owner:npg_ONSLUx5f2pMo@ep-rapid-dew-ad58cvd6.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require",
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: process.env.SESSION_SECRET || 'development-session-secret-not-for-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
    },
  });
}

export const isStudentAuthenticated: RequestHandler = (req, res, next) => {
  const session = req.session as any;
  if (session?.userId && session?.user) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
};