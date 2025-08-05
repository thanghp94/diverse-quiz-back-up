import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express } from "express";
import { storage } from "./storage";

export function setupGoogleAuth(app: Express) {
  const domain = process.env.REPLIT_DOMAINS?.split(',')[0];
  const callbackURL = `https://${domain}/api/auth/google/callback`;
  
  console.log('Google OAuth Setup:', {
    clientID: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing',
    domain,
    callbackURL
  });

  // Skip OAuth setup if credentials are not provided
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log('Google OAuth credentials not configured - skipping OAuth setup');
    return;
  }

  // Configure Google OAuth strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL,
    passReqToCallback: false
  },
  async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      console.log('Google OAuth profile received:', {
        id: profile.id,
        email: profile.emails?.[0]?.value,
        name: profile.displayName
      });

      // Accept any Google user, validation happens after login
      const email = profile.emails?.[0]?.value;
      const name = profile.displayName;
      
      if (!email) {
        console.error('No email found in Google profile');
        return done(null, false, { message: 'No email found from Google' });
      }

      // Create a temporary user object with Google profile data
      const googleUser = {
        id: `google_${profile.id}`,
        email: email,
        firstName: profile.name?.givenName || '',
        lastName: profile.name?.familyName || '',
        fullName: name || '',
        isGoogleUser: true,
        googleId: profile.id,
        profileImage: profile.photos?.[0]?.value || null
      };

      console.log('Google user created successfully:', googleUser.email);
      return done(null, googleUser);
    } catch (error) {
      console.error('Google OAuth strategy error:', error);
      return done(error, false);
    }
  }));

  // Serialize/deserialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error('Passport deserialize error:', error);
      done(null, false);
    }
  });

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth routes
  app.get('/api/auth/google', (req, res, next) => {
    console.log('Starting Google OAuth authentication...', {
      userAgent: req.get('User-Agent'),
      origin: req.get('Origin'),
      referer: req.get('Referer')
    });
    
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      failureMessage: true,
      successRedirect: undefined,
      failureRedirect: '/?error=oauth_init_failed'
    })(req, res, next);
  });

  app.get('/api/auth/google/callback', (req, res, next) => {
    console.log('Google OAuth callback received');
    passport.authenticate('google', { 
      failureRedirect: '/?error=google_auth_failed',
      failureMessage: true 
    }, (err, user, info) => {
      if (err) {
        console.error('Google OAuth error:', err);
        return res.redirect('/?error=oauth_error');
      }
      if (!user) {
        console.log('Google OAuth failed:', info);
        return res.redirect('/?error=oauth_failed');
      }
      
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error('Login error:', loginErr);
          return res.redirect('/?error=login_failed');
        }
        
        console.log('Google OAuth successful:', user);
        // Store Google user in session for validation
        (req.session as any).googleUser = user;
        (req.session as any).needsValidation = true;
        
        // Redirect to validation page
        res.redirect('/validate-access');
      });
    })(req, res, next);
  });
}