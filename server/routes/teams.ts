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
        id: teams.id,
        name: teams.name,
        created_at: teams.created_at,
        updated_at: teams.updated_at,
        member_id: teamMembers.id,
        member_user_id: teamMembers.user_id,
        member_created_at: teamMembers.created_at,
        user_first_name: users.first_name,
        user_last_name: users.last_name,
        user_full_name: users.full_name,
      })
      .from(teams)
      .leftJoin(teamMembers, eq(teams.id, teamMembers.team_id))
      .leftJoin(users, eq(teamMembers.user_id, users.id))
      .orderBy(teams.created_at);

    // Group members by team
    const teamsMap = new Map();
    teamsWithMembers.forEach(row => {
      if (!teamsMap.has(row.id)) {
        teamsMap.set(row.id, {
          id: row.id,
          name: row.name,
          created_at: row.created_at,
          updated_at: row.updated_at,
          members: []
        });
      }
      
      if (row.member_user_id) {
        teamsMap.get(row.id).members.push({
          id: row.member_id,
          userId: row.member_user_id,
          createdAt: row.member_created_at,
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
    const { name } = req.body;
    
    const teamData = {
      id: nanoid(),
      name: name || null,
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
    const teamId = req.params.teamId;
    const { name } = req.body;
    
    const updateData: any = { updated_at: new Date() };
    if (name !== undefined) updateData.name = name;

    const [updatedTeam] = await db
      .update(teams)
      .set(updateData)
      .where(eq(teams.id, teamId))
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
    const teamId = req.params.teamId;
    const { userId } = req.body;

    // Check if team exists
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId));

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
      id: nanoid(),
      team_id: teamId,
      user_id: userId,
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
    const teamId = req.params.teamId;
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
    const teamId = req.params.teamId;

    // Delete all team members first (cascade should handle this, but being explicit)
    await db
      .delete(teamMembers)
      .where(eq(teamMembers.team_id, teamId));

    // Delete the team
    const deletedTeam = await db
      .delete(teams)
      .where(eq(teams.id, teamId))
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