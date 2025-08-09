import { Router } from 'express';
import { db } from '../db.js';
import { teams, teamMembers, users, insertTeamSchema, insertTeamMemberSchema } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const router = Router();

// Get all teams with members
router.get('/', async (req, res) => {
  try {
    const teamsWithMembers = await db
      .select({
        team_id: teams.team_id,
        team_code: teams.team_code,
        team_name: teams.team_name,
        year: teams.year,
        round: teams.round,
        active: teams.active,
        others_info: teams.others_info,
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
      if (!teamsMap.has(row.team_id)) {
        teamsMap.set(row.team_id, {
          team_id: row.team_id,
          team_code: row.team_code,
          team_name: row.team_name,
          year: row.year,
          round: row.round,
          active: row.active,
          others_info: row.others_info,
          created_at: row.created_at,
          members: []
        });
      }
      
      if (row.member_user_id) {
        teamsMap.get(row.team_id).members.push({
          user_id: row.member_user_id,
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

// Create new team (generates ID first, name can be updated later)
router.post('/', async (req, res) => {
  try {
    const { team_name, year = "2024", round = "1" } = req.body;
    
    // Generate unique team code
    const team_code = nanoid(8).toUpperCase();
    
    const teamData = {
      team_code,
      team_name: team_name || null,
      year,
      round,
      active: true,
      others_info: {}
    };

    const validatedData = insertTeamSchema.parse(teamData);
    
    const [newTeam] = await db
      .insert(teams)
      .values(validatedData)
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
    const { team_name, year, round, active, others_info } = req.body;
    
    const updateData: any = {};
    if (team_name !== undefined) updateData.team_name = team_name;
    if (year !== undefined) updateData.year = year;
    if (round !== undefined) updateData.round = round;
    if (active !== undefined) updateData.active = active;
    if (others_info !== undefined) updateData.others_info = others_info;

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
    const { user_id, year = "2024", round = "1" } = req.body;

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
      .where(eq(users.id, user_id));

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already in this team
    const [existingMember] = await db
      .select()
      .from(teamMembers)
      .where(sql`${teamMembers.team_id} = ${teamId} AND ${teamMembers.user_id} = ${user_id}`);

    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member of this team' });
    }

    const memberData = {
      team_id: teamId,
      user_id,
      year,
      round
    };

    const validatedData = insertTeamMemberSchema.parse(memberData);
    
    const [newMember] = await db
      .insert(teamMembers)
      .values(validatedData)
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

    // Delete all team members first
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