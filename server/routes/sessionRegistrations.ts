import express from 'express';
import { db } from '../db';
import { ExternalDbService } from '../externalDb';
import { teams, teamMembers, users } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

const router = express.Router();
const externalDbService = new ExternalDbService();

// Get registrations for a session with team and division info
router.get('/:sessionId', async (req, res) => {
  try {
    await externalDbService.ensureSessionRegistrationsTableExists();
    const sessionId = parseInt(req.params.sessionId);
    
    const result = await externalDbService.getSessionRegistrations(sessionId);
    res.json(result);
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

    // Check if already registered
    const existingRegistration = await externalDbService.checkExistingRegistration(
      session_id, team_id, student_id
    );

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

    // Create registration
    const registration = await externalDbService.createSessionRegistration({
      session_id,
      team_id: team_id || null,
      student_id: student_id || null,
      division: teamDivision,
      status: 'registered'
    });

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

    const updated = await externalDbService.updateSessionRegistration(id, { status });

    if (!updated) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating registration:', error);
    res.status(500).json({ error: 'Failed to update registration' });
  }
});

// Delete registration
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const deleted = await externalDbService.deleteSessionRegistration(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    res.json({ message: 'Registration deleted successfully' });
  } catch (error) {
    console.error('Error deleting registration:', error);
    res.status(500).json({ error: 'Failed to delete registration' });
  }
});

export default router;