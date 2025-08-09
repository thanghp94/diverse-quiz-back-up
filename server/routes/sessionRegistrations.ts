import express from 'express';
import { db } from '../db';
import { teams, teamMembers, users, activitySessions, sessionRegistrations } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

const router = express.Router();

// Get registrations for a session with team and division info
router.get('/:sessionId', async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    
    // Get data from activities_jsonb in the main database
    try {
      const [session] = await db.select().from(activitySessions).where(eq(activitySessions.session_id, sessionId));
      const activities = session?.activities_jsonb || {};
      const registrations = (activities as any)?.registrations || [];
      
      // Count by division
      const divisionCounts = registrations.reduce((acc: Record<string, number>, reg: any) => {
        if (reg.division) {
          acc[reg.division] = (acc[reg.division] || 0) + 1;
        }
        return acc;
      }, {});

      res.json({
        registrations,
        divisionCounts
      });
    } catch {
      // Fallback to empty state if query fails
      res.json({
        registrations: [],
        divisionCounts: {}
      });
    }
    
  } catch (error) {
    console.error('Error fetching session registrations:', error);
    res.status(500).json({ error: 'Failed to fetch session registrations' });
  }
});

// Register a team for a session
router.post('/', async (req, res) => {
  try {
    const { session_id, team_id, student_id, division } = req.body;

    // Validate required fields
    if (!session_id || (!team_id && !student_id)) {
      return res.status(400).json({ error: 'Session ID and either team ID or student ID are required' });
    }

    // Check if already registered in both tables
    const existingInTable = await db.select().from(sessionRegistrations)
      .where(and(
        eq(sessionRegistrations.session_id, session_id),
        team_id ? eq(sessionRegistrations.team_id, team_id) : eq(sessionRegistrations.student_id, student_id || '')
      ));

    if (existingInTable.length > 0) {
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
      teamName = team[0]?.team_name || '';
    }

    // Create registration in both the table and activities_jsonb
    const [registration] = await db.insert(sessionRegistrations).values({
      session_id,
      team_id: team_id || null,
      student_id: student_id || null,
      division: teamDivision,
      status: 'registered'
    }).returning();

    // Get current session for attendance update (only save to attendance, not activities_jsonb)
    const [session] = await db.select().from(activitySessions).where(eq(activitySessions.session_id, session_id));
    if (session) {
      // Add team to attendance array only
      const currentAttendance = Array.isArray(session.attendance) ? session.attendance : [];
      if (team_id && teamName) {
        currentAttendance.push({
          team_id: team_id,
          team_name: teamName,
          division: teamDivision,
          status: 'registered',
          registered_at: new Date().toISOString(),
          registration_id: registration.id
        });
      }

      // Check if we now have 2 teams registered - if so, mark them as matched
      const registeredTeams = currentAttendance.filter((team: any) => team.status === 'registered');
      if (registeredTeams.length >= 2) {
        // Mark first 2 teams as matched, exclude others
        registeredTeams.forEach((team: any, index: number) => {
          if (index < 2) {
            team.status = 'matched';
            team.matched_at = new Date().toISOString();
          } else {
            team.status = 'excluded';
            team.excluded_at = new Date().toISOString();
          }
        });

        // Update registration statuses in the database
        for (const team of registeredTeams) {
          if (team.team_id) {
            await db.update(sessionRegistrations)
              .set({ status: team.status })
              .where(and(
                eq(sessionRegistrations.session_id, session_id),
                eq(sessionRegistrations.team_id, team.team_id)
              ));
          }
        }
      }
      
      await db.update(activitySessions)
        .set({
          attendance: currentAttendance,
          updated_at: new Date()
        })
        .where(eq(activitySessions.session_id, session_id));
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

    // Update activities_jsonb and attendance in activity_sessions
    const [session] = await db.select().from(activitySessions)
      .where(eq(activitySessions.session_id, registration.session_id));

    if (session) {
      const currentActivities = session.activities_jsonb || {};
      const registrations = (currentActivities as any)?.registrations || [];
      
      // Remove the registration from activities_jsonb
      const updatedRegistrations = registrations.filter((reg: any) => reg.registration_id !== id);
      
      // Remove from attendance array
      const currentAttendance = Array.isArray(session.attendance) ? session.attendance : [];
      const updatedAttendance = currentAttendance.filter((team: any) => team.team_id !== registration.team_id);
      
      // Update the session
      await db.update(activitySessions)
        .set({
          activities_jsonb: { ...currentActivities, registrations: updatedRegistrations },
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