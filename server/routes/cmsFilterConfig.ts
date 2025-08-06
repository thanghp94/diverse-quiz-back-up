import type { Express } from "express";
import { db } from '../db.js';
import { cmsFilterConfig } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export function cmsFilterConfigRoutes(app: Express) {

// Get all filter configurations
app.get('/api/cms-filter-config', async (req, res) => {
  try {
    const configs = await db.select().from(cmsFilterConfig).orderBy(cmsFilterConfig.level, cmsFilterConfig.name);
    res.json(configs);
  } catch (error) {
    console.error('Error fetching filter configs:', error);
    res.status(500).json({ error: 'Failed to fetch filter configurations' });
  }
});

// Get filter configurations by level
app.get('/api/cms-filter-config/level/:level', async (req, res) => {
  try {
    const level = parseInt(req.params.level);
    const configs = await db
      .select()
      .from(cmsFilterConfig)
      .where(and(eq(cmsFilterConfig.level, level), eq(cmsFilterConfig.is_active, true)))
      .orderBy(cmsFilterConfig.name);
    res.json(configs);
  } catch (error) {
    console.error('Error fetching filter configs by level:', error);
    res.status(500).json({ error: 'Failed to fetch filter configurations' });
  }
});

// Create new filter configuration
app.post('/api/cms-filter-config', async (req, res) => {
  try {
    const {
      name,
      level,
      parent_level,
      filter_type,
      column_name,
      column_value,
      filter_logic = 'equals',
      is_active = true
    } = req.body;

    const id = nanoid();

    await db.insert(cmsFilterConfig).values({
      id,
      name,
      level,
      parent_level,
      filter_type,
      column_name,
      column_value,
      filter_logic,
      is_active
    });

    const newConfig = await db
      .select()
      .from(cmsFilterConfig)
      .where(eq(cmsFilterConfig.id, id))
      .limit(1);

    res.status(201).json(newConfig[0]);
  } catch (error) {
    console.error('Error creating filter config:', error);
    res.status(500).json({ error: 'Failed to create filter configuration' });
  }
});

// Update filter configuration
app.put('/api/cms-filter-config/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    await db
      .update(cmsFilterConfig)
      .set(updateData)
      .where(eq(cmsFilterConfig.id, id));

    const updatedConfig = await db
      .select()
      .from(cmsFilterConfig)
      .where(eq(cmsFilterConfig.id, id))
      .limit(1);

    if (updatedConfig.length === 0) {
      return res.status(404).json({ error: 'Filter configuration not found' });
    }

    res.json(updatedConfig[0]);
  } catch (error) {
    console.error('Error updating filter config:', error);
    res.status(500).json({ error: 'Failed to update filter configuration' });
  }
});

// Delete filter configuration
app.delete('/api/cms-filter-config/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.delete(cmsFilterConfig).where(eq(cmsFilterConfig.id, id));

    res.json({ success: true, message: 'Filter configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting filter config:', error);
    res.status(500).json({ error: 'Failed to delete filter configuration' });
  }
});

// Toggle filter configuration active status
app.patch('/api/cms-filter-config/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    const current = await db
      .select()
      .from(cmsFilterConfig)
      .where(eq(cmsFilterConfig.id, id))
      .limit(1);

    if (current.length === 0) {
      return res.status(404).json({ error: 'Filter configuration not found' });
    }

    await db
      .update(cmsFilterConfig)
      .set({ is_active: !current[0].is_active })
      .where(eq(cmsFilterConfig.id, id));

    const updated = await db
      .select()
      .from(cmsFilterConfig)
      .where(eq(cmsFilterConfig.id, id))
      .limit(1);

    res.json(updated[0]);
  } catch (error) {
    console.error('Error toggling filter config:', error);
    res.status(500).json({ error: 'Failed to toggle filter configuration' });
  }
});

}