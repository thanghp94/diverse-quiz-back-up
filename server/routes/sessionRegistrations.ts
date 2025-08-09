import express from 'express';
import { db } from '../db';
import { teams, sessionRegistrations, activitySessions } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const router = express.Router();

// Get registrations for a specific session - ONLY from session_registrations table
router.get('/:sessionId', async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    
    // Get all registrations from the session_registrations table
    const registrations = await db
      .select({
        id: sessionRegistrations.id,
        session_id: sessionRegistrations.session_id,
        team_id: sessionRegistrations.team_id,
        student_id: sessionRegistrations.student_id,
        division: sessionRegistrations.division,
        status: sessionRegistrations.status,
        registered_at: sessionRegistrations.registered_at,
        confirmed_at: sessionRegistrations.confirmed_at,
        team_name: teams.team_name
      })
      .from(sessionRegistrations)
      .leftJoin(teams, eq(sessionRegistrations.team_id, teams.team_id))
      .where(eq(sessionRegistrations.session_id, sessionId));

    // Convert to frontend format
    const formattedRegistrations = registrations.map(reg => ({
      type: 'team_registration',
      team_id: reg.team_id,
      division: reg.division,
      timestamp: reg.registered_at,
      student_id: reg.student_id,
      registration_id: reg.id, // This is the key field that was missing!
      status: reg.status,
      team_name: reg.team_name || `Team ${reg.team_id}`,
      confirmed_at: reg.confirmed_at
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

// Register a team for a session - ONLY session_registrations table
router.post('/', async (req, res) => {
  try {
    const { session_id, team_id, student_id, division } = req.body;

    // Validate required fields
    if (!session_id || (!team_id && !student_id)) {
      return res.status(400).json({ error: 'Session ID and either team ID or student ID are required' });
    }

    // Check if already registered
    const existingRegistration = await db.select().from(sessionRegistrations)
      .where(and(
        eq(sessionRegistrations.session_id, session_id),
        team_id ? eq(sessionRegistrations.team_id, team_id) : eq(sessionRegistrations.student_id, student_id || '')
      ));

    if (existingRegistration.length > 0) {
      return res.status(409).json({ error: 'Already registered for this session' });
    }

    // If registering by team, get division from team name
    let teamDivision = division;
    if (team_id && !teamDivision) {
      const team = await db
        .select({ team_name: teams.team_name })
        .from(teams)
        .where(eq(teams.team_id, team_id));
      
      if (team.length > 0) {
        const teamName = team[0].team_name;
        if (teamName?.startsWith('SKT')) teamDivision = 'SKT';
        else if (teamName?.startsWith('JR')) teamDivision = 'JR';
        else if (teamName?.startsWith('SR')) teamDivision = 'SR';
      }
    }

    // Get team name for attendance
    let teamName = '';
    if (team_id) {
      const team = await db
        .select({ team_name: teams.team_name })
        .from(teams)
        .where(eq(teams.team_id, team_id));
      teamName = team[0]?.team_name || `Team ${team_id}`;
    }

    // Create registration
    const [registration] = await db.insert(sessionRegistrations).values({
      session_id,
      team_id: team_id || null,
      student_id: student_id || null,
      division: teamDivision,
      status: 'registered'
    }).returning();

    // Check if we now have 2 teams registered - if so, mark them as matched
    const allRegistrations = await db.select().from(sessionRegistrations)
      .where(eq(sessionRegistrations.session_id, session_id));

    const registeredTeams = allRegistrations.filter(reg => reg.status === 'registered');
    if (registeredTeams.length >= 2) {
      // Mark first 2 teams as matched
      for (let i = 0; i < Math.min(2, registeredTeams.length); i++) {
        await db.update(sessionRegistrations)
          .set({ status: 'matched' })
          .where(eq(sessionRegistrations.id, registeredTeams[i].id));
      }
      
      // Mark others as excluded if more than 2
      for (let i = 2; i < registeredTeams.length; i++) {
        await db.update(sessionRegistrations)
          .set({ status: 'excluded' })
          .where(eq(sessionRegistrations.id, registeredTeams[i].id));
      }
    }

    // Also add to attendance array in activity_sessions for synchronization
    const [session] = await db.select().from(activitySessions)
      .where(eq(activitySessions.session_id, session_id));

    if (session) {
      const currentAttendance = Array.isArray(session.attendance) ? session.attendance : [];
      
      // Add new registration to attendance
      if (team_id && teamName) {
        currentAttendance.push({
          team_id: team_id,
          team_name: teamName,
          division: teamDivision,
          status: registration.status,
          registered_at: registration.registered_at,
          registration_id: registration.id
        });

        await db.update(activitySessions)
          .set({ 
            attendance: currentAttendance,
            updated_at: new Date()
          })
          .where(eq(activitySessions.session_id, session_id));
      }
    }

    res.status(201).json(registration);
  } catch (error) {
    console.error('Error creating session registration:', error);
    res.status(500).json({ error: 'Failed to create registration' });
  }
});

// Update registration status (for teacher confirmation)
router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!['registered', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Update the registration in session_registrations table
    const [updated] = await db.update(sessionRegistrations)
      .set({ 
        status, 
        confirmed_at: status === 'confirmed' ? new Date() : null 
      })
      .where(eq(sessionRegistrations.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    // Also update the attendance array in activity_sessions
    const [session] = await db.select().from(activitySessions)
      .where(eq(activitySessions.session_id, updated.session_id));

    if (session && Array.isArray(session.attendance)) {
      const updatedAttendance = session.attendance.map((team: any) => {
        if (team.registration_id === id) {
          return {
            ...team,
            status: status,
            confirmed_at: status === 'confirmed' ? new Date().toISOString() : team.confirmed_at
          };
        }
        return team;
      });

      await db.update(activitySessions)
        .set({ 
          attendance: updatedAttendance,
          updated_at: new Date()
        })
        .where(eq(activitySessions.session_id, updated.session_id));
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating registration:', error);
    res.status(500).json({ error: 'Failed to update registration' });
  }
});

// Delete/withdraw registration
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Get the registration first to get session_id and team_id
    const [registration] = await db.select().from(sessionRegistrations)
      .where(eq(sessionRegistrations.id, id));

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    // Delete from session_registrations table
    await db.delete(sessionRegistrations)
      .where(eq(sessionRegistrations.id, id));

    // Also remove from attendance array in activity_sessions
    const [session] = await db.select().from(activitySessions)
      .where(eq(activitySessions.session_id, registration.session_id));

    if (session && Array.isArray(session.attendance)) {
      const updatedAttendance = session.attendance.filter((team: any) => 
        team.registration_id !== id
      );

      await db.update(activitySessions)
        .set({ 
          attendance: updatedAttendance,
          updated_at: new Date()
        })
        .where(eq(activitySessions.session_id, registration.session_id));
    }

    res.json({ message: 'Registration withdrawn successfully' });
  } catch (error) {
    console.error('Error withdrawing registration:', error);
    res.status(500).json({ error: 'Failed to withdraw registration' });
  }
});

export default router;