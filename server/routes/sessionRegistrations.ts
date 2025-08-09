import type { Express } from "express";
import { db } from '../db';
import { teams, activitySessions } from '@shared/schema';
import { eq } from 'drizzle-orm';

export function sessionRegistrationRoutes(app: Express) {
  // Get registrations for a specific session - ONLY from attendance field
  app.get('/api/session-registrations/:sessionId', async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    
    // Get session and its attendance data
    const [session] = await db.select().from(activitySessions)
      .where(eq(activitySessions.session_id, sessionId));

    if (!session) {
      return res.json({ registrations: [], divisionCounts: {} });
    }

    const attendance = Array.isArray(session.attendance) ? session.attendance : [];
    
    // Convert attendance data to frontend format
    const formattedRegistrations = attendance.map((registration: any, index: number) => ({
      type: 'team_registration',
      team_id: registration.team_id,
      division: registration.division,
      timestamp: registration.registered_at,
      student_id: registration.student_id,
      registration_id: registration.registration_id || index + 1, // Use index as fallback
      status: registration.status,
      team_name: registration.team_name,
      confirmed_at: registration.confirmed_at
    }));
    
    // Count by division
    const divisionCounts = formattedRegistrations.reduce((acc: Record<string, number>, reg: any) => {
      if (reg.division) {
        acc[reg.division] = (acc[reg.division] || 0) + 1;
      }
      return acc;
    }, {});

    res.json({
      registrations: formattedRegistrations,
      divisionCounts
    });
    
  } catch (error) {
    console.error('Error fetching session registrations:', error);
    res.status(500).json({ error: 'Failed to fetch session registrations' });
  }
});

  // Register a team for a session - save to attendance field only
  app.post('/api/session-registrations', async (req, res) => {
  try {
    const { session_id, team_id, student_id, division } = req.body;

    // Validate required fields
    if (!session_id || (!team_id && !student_id)) {
      return res.status(400).json({ error: 'Session ID and either team ID or student ID are required' });
    }

    // Get session
    const [session] = await db.select().from(activitySessions)
      .where(eq(activitySessions.session_id, session_id));

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const currentAttendance = Array.isArray(session.attendance) ? session.attendance : [];

    // Check if this team is already registered (allow same student to register multiple teams)
    const existingRegistration = currentAttendance.find((reg: any) => 
      reg.team_id === team_id
    );

    if (existingRegistration) {
      return res.status(409).json({ error: 'This team is already registered for this session' });
    }

    // Get team info if needed
    let teamDivision = division;
    let teamName = '';
    if (team_id) {
      const team = await db
        .select({ team_name: teams.team_name })
        .from(teams)
        .where(eq(teams.team_id, team_id));
      
      if (team.length > 0) {
        teamName = team[0].team_name || `Team ${team_id}`;
        if (!teamDivision) {
          if (teamName?.startsWith('SKT')) teamDivision = 'SKT';
          else if (teamName?.startsWith('JR')) teamDivision = 'JR';
          else if (teamName?.startsWith('SR')) teamDivision = 'SR';
        }
      }
    }

    // Create new registration
    const newRegistration = {
      registration_id: currentAttendance.length + 1,
      team_id: team_id || null,
      student_id: student_id || null,
      division: teamDivision,
      status: 'pending',
      team_name: teamName || `Team ${team_id}`,
      registered_at: new Date().toISOString(),
      confirmed_at: null
    };

    currentAttendance.push(newRegistration);

    // All new registrations start as pending - teachers must manually confirm
    // (No automatic matching logic here)

    // Update session attendance
    await db.update(activitySessions)
      .set({ 
        attendance: currentAttendance,
        updated_at: new Date()
      })
      .where(eq(activitySessions.session_id, session_id));

    res.status(201).json(newRegistration);
  } catch (error) {
    console.error('Error creating session registration:', error);
    res.status(500).json({ error: 'Failed to create registration' });
  }
});

  // Update registration status (for teacher confirmation)
  app.patch('/api/session-registrations/:id', async (req, res) => {
  try {
    const registrationId = parseInt(req.params.id);
    const { status } = req.body;

    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Find the session that contains this registration
    const sessions = await db.select().from(activitySessions);
    let targetSession = null;
    let targetRegistration = null;

    for (const session of sessions) {
      const attendance = Array.isArray(session.attendance) ? session.attendance : [];
      const registration = attendance.find((reg: any) => reg.registration_id === registrationId);
      
      if (registration) {
        targetSession = session;
        targetRegistration = registration;
        break;
      }
    }

    if (!targetSession || !targetRegistration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    const currentAttendance = Array.isArray(targetSession.attendance) ? targetSession.attendance : [];
    
    // Update the specific registration
    const updatedAttendance = currentAttendance.map((reg: any) => {
      if (reg.registration_id === registrationId) {
        return {
          ...reg,
          status: status,
          confirmed_at: status === 'confirmed' ? new Date().toISOString() : reg.confirmed_at
        };
      }
      return reg;
    });

    // Keep teams as confirmed - no automatic matching to other statuses

    // Update session attendance
    await db.update(activitySessions)
      .set({ 
        attendance: updatedAttendance,
        updated_at: new Date()
      })
      .where(eq(activitySessions.session_id, targetSession.session_id));

    const updatedRegistration = updatedAttendance.find((reg: any) => reg.registration_id === registrationId);
    res.json(updatedRegistration);
  } catch (error) {
    console.error('Error updating registration:', error);
    res.status(500).json({ error: 'Failed to update registration' });
  }
});

  // Delete/withdraw registration
  app.delete('/api/session-registrations/:id', async (req, res) => {
  try {
    const registrationId = parseInt(req.params.id);

    // Find the session that contains this registration
    const sessions = await db.select().from(activitySessions);
    let targetSession = null;

    for (const session of sessions) {
      const attendance = Array.isArray(session.attendance) ? session.attendance : [];
      const registration = attendance.find((reg: any) => reg.registration_id === registrationId);
      
      if (registration) {
        targetSession = session;
        break;
      }
    }

    if (!targetSession) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    const currentAttendance = Array.isArray(targetSession.attendance) ? targetSession.attendance : [];
    
    // Remove the registration
    const updatedAttendance = currentAttendance.filter((reg: any) => 
      reg.registration_id !== registrationId
    );

    // After withdrawal, check if remaining confirmed teams should revert to pending
    // If there are less than 2 confirmed teams, change confirmed teams back to pending
    const confirmedTeams = updatedAttendance.filter((reg: any) => reg.status === 'confirmed');
    
    if (confirmedTeams.length < 2) {
      // Change all confirmed teams back to pending since we need 2 teams for a debate
      updatedAttendance.forEach((reg: any) => {
        if (reg.status === 'confirmed') {
          reg.status = 'pending';
          delete reg.confirmed_at; // Remove confirmation timestamp
        }
      });
    }

    // Update session attendance
    await db.update(activitySessions)
      .set({ 
        attendance: updatedAttendance,
        updated_at: new Date()
      })
      .where(eq(activitySessions.session_id, targetSession.session_id));

    res.json({ message: 'Registration withdrawn successfully' });
  } catch (error) {
    console.error('Error withdrawing registration:', error);
    res.status(500).json({ error: 'Failed to withdraw registration' });
  }
});

}