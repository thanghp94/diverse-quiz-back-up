import { Router } from 'express';
import { db } from '../db.js';
import { teams, teamMembers, users } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const router = Router();

// Get all teams with members
router.get('/', async (req, res) => {
  try {
    const teamsWithMembers = await db
      .select({
        id: teams.team_id,
        name: teams.team_name,
        code: teams.team_code,
        year: teams.year,
        round: teams.round,
        active: teams.active,
        created_at: teams.created_at,
        member_user_id: teamMembers.user_id,
        member_year: teamMembers.year,
        member_round: teamMembers.round,
        user_first_name: users.first_name,
        user_last_name: users.last_name,
        user_full_name: users.full_name,
      })
      .from(teams)
      .leftJoin(teamMembers, eq(teams.team_id, teamMembers.team_id))
      .leftJoin(users, eq(teamMembers.user_id, users.id))
      .orderBy(teams.created_at);

    // Group members by team
    const teamsMap = new Map();
    teamsWithMembers.forEach(row => {
      if (!teamsMap.has(row.id)) {
        teamsMap.set(row.id, {
          id: row.id,
          name: row.name,
          code: row.code,
          year: row.year,
          round: row.round,
          active: row.active,
          created_at: row.created_at,
          members: []
        });
      }
      
      if (row.member_user_id) {
        teamsMap.get(row.id).members.push({
          id: row.member_user_id,
          userId: row.member_user_id,
          year: row.member_year,
          round: row.member_round,
          first_name: row.user_first_name,
          last_name: row.user_last_name,
          full_name: row.user_full_name
        });
      }
    });

    const result = Array.from(teamsMap.values());
    res.json(result);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ message: 'Failed to fetch teams' });
  }
});

// Create new team
router.post('/', async (req, res) => {
  try {
    const { name, year, round } = req.body;
    
    // Generate team code from name or use timestamp
    const teamCode = name ? name.toLowerCase().replace(/[^a-z0-9]/g, '-') : `team-${Date.now()}`;
    
    const teamData = {
      team_code: teamCode,
      team_name: name || null,
      year: year || new Date().getFullYear().toString(),
      round: round || 'general',
    };
    
    const [newTeam] = await db
      .insert(teams)
      .values(teamData)
      .returning();

    res.status(201).json(newTeam);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ message: 'Failed to create team' });
  }
});

// Update team
router.put('/:teamId', async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const { name, year, round } = req.body;
    
    const updateData: any = {};
    if (name !== undefined) updateData.team_name = name;
    if (year !== undefined) updateData.year = year;
    if (round !== undefined) updateData.round = round;

    const [updatedTeam] = await db
      .update(teams)
      .set(updateData)
      .where(eq(teams.team_id, teamId))
      .returning();

    if (!updatedTeam) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json(updatedTeam);
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ message: 'Failed to update team' });
  }
});

// Add student to team
router.post('/:teamId/members', async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const { userId } = req.body;

    // Check if team exists
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.team_id, teamId));

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already in this team
    const [existingMember] = await db
      .select()
      .from(teamMembers)
      .where(sql`${teamMembers.team_id} = ${teamId} AND ${teamMembers.user_id} = ${userId}`);

    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member of this team' });
    }

    const memberData = {
      team_id: teamId,
      user_id: userId,
      year: team.year,
      round: team.round,
    };
    
    const [newMember] = await db
      .insert(teamMembers)
      .values(memberData)
      .returning();

    res.status(201).json(newMember);
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({ message: 'Failed to add team member' });
  }
});

// Remove student from team
router.delete('/:teamId/members/:userId', async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const userId = req.params.userId;

    const deletedMember = await db
      .delete(teamMembers)
      .where(sql`${teamMembers.team_id} = ${teamId} AND ${teamMembers.user_id} = ${userId}`)
      .returning();

    if (deletedMember.length === 0) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    res.json({ message: 'Team member removed successfully' });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({ message: 'Failed to remove team member' });
  }
});

// Delete team and all its members
router.delete('/:teamId', async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);

    // Delete all team members first (cascade should handle this, but being explicit)
    await db
      .delete(teamMembers)
      .where(eq(teamMembers.team_id, teamId));

    // Delete the team
    const deletedTeam = await db
      .delete(teams)
      .where(eq(teams.team_id, teamId))
      .returning();

    if (deletedTeam.length === 0) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ message: 'Failed to delete team' });
  }
});

export default router;