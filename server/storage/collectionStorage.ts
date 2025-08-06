import { collections, collection_content, topics, content, type Collection, type CollectionContent } from "@shared/schema";
import { eq, sql, asc, desc, and, or } from "drizzle-orm";
import { db } from "../db";
import { nanoid } from "nanoid";

export class CollectionStorage {
  async getCollections(): Promise<Collection[]> {
    try {
      return await db.select().from(collections).where(eq(collections.is_active, true));
    } catch (error) {
      console.error('Error fetching collections:', error);
      throw error;
    }
  }

  async getCollectionByRoute(pageRoute: string): Promise<Collection | undefined> {
    try {
      const result = await db.select().from(collections)
        .where(and(eq(collections.page_route, pageRoute), eq(collections.is_active, true)));
      return result[0];
    } catch (error) {
      console.error('Error fetching collection by route:', error);
      throw error;
    }
  }

  async getCollectionById(id: string): Promise<Collection | undefined> {
    try {
      const result = await db.select().from(collections).where(eq(collections.id, id));
      return result[0];
    } catch (error) {
      console.error('Error fetching collection by ID:', error);
      throw error;
    }
  }

  async createCollection(collectionData: any): Promise<Collection> {
    try {
      const newCollection = {
        id: nanoid(),
        ...collectionData
      };
      const result = await db.insert(collections).values(newCollection).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  }

  async updateCollection(collectionId: string, updateData: Partial<Collection>): Promise<Collection | undefined> {
    try {
      const result = await db.update(collections)
        .set({ ...updateData, updated_at: new Date() })
        .where(eq(collections.id, collectionId))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating collection:', error);
      throw error;
    }
  }

  async deleteCollection(collectionId: string): Promise<boolean> {
    try {
      // Soft delete by setting is_active to false
      await db.update(collections)
        .set({ is_active: false, updated_at: new Date() })
        .where(eq(collections.id, collectionId));
      return true;
    } catch (error) {
      console.error('Error deleting collection:', error);
      throw error;
    }
  }

  async getCollectionContent(collectionId: string): Promise<any[]> {
    try {
      // Get all collection content mappings
      const contentMappings = await db.select().from(collection_content)
        .where(eq(collection_content.collection_id, collectionId))
        .orderBy(asc(collection_content.display_order));

      const results = [];

      for (const mapping of contentMappings) {
        let item = null;

        if (mapping.topic_id) {
          // Fetch topic
          const topicResult = await db.select().from(topics).where(eq(topics.id, mapping.topic_id));
          if (topicResult[0]) {
            item = {
              ...topicResult[0],
              type: 'topic',
              display_order: mapping.display_order,
              is_featured: mapping.is_featured,
              mapping_id: mapping.id
            };
          }
        } else if (mapping.content_id) {
          // Fetch content
          const contentResult = await db.select().from(content).where(eq(content.id, mapping.content_id));
          if (contentResult[0]) {
            const contentItem = contentResult[0];
            item = {
              ...contentItem,
              type: contentItem.prompt === 'groupcard' ? 'groupcard' : 'content',
              display_order: mapping.display_order,
              is_featured: mapping.is_featured,
              mapping_id: mapping.id
            };
          }
        } else if (mapping.groupcard_id) {
          // Fetch groupcard (content with prompt = 'groupcard')
          const groupcardResult = await db.select().from(content).where(eq(content.id, mapping.groupcard_id));
          if (groupcardResult[0]) {
            item = {
              ...groupcardResult[0],
              type: 'groupcard',
              display_order: mapping.display_order,
              is_featured: mapping.is_featured,
              mapping_id: mapping.id
            };
          }
        }

        if (item) {
          results.push(item);
        }
      }

      return results;
    } catch (error) {
      console.error('Error fetching collection content:', error);
      throw error;
    }
  }

  async addContentToCollection(collectionId: string, contentData: {
    content_id?: string;
    topic_id?: string;
    groupcard_id?: string;
    display_order?: number;
    is_featured?: boolean;
  }): Promise<CollectionContent> {
    try {
      const newMapping = {
        id: nanoid(),
        collection_id: collectionId,
        ...contentData
      };
      const result = await db.insert(collection_content).values(newMapping).returning();
      return result[0];
    } catch (error) {
      console.error('Error adding content to collection:', error);
      throw error;
    }
  }

  async removeContentFromCollection(mappingId: string): Promise<boolean> {
    try {
      await db.delete(collection_content).where(eq(collection_content.id, mappingId));
      return true;
    } catch (error) {
      console.error('Error removing content from collection:', error);
      throw error;
    }
  }

  async reorderCollectionContent(items: Array<{ id: string; position: number }>): Promise<{ success: boolean; message: string }> {
    try {
      for (const item of items) {
        await db.update(collection_content)
          .set({ display_order: item.position })
          .where(eq(collection_content.id, item.id));
      }
      
      return { success: true, message: 'Collection content reordered successfully' };
    } catch (error) {
      console.error('Error reordering collection content:', error);
      throw error;
    }
  }

  async getContentByCollectionFilters(collection: Collection): Promise<any[]> {
    try {
      const { filter_criteria, sort_field, sort_order, display_type } = collection;
      
      let results: any[] = [];

      if (display_type === 'alphabetical' || display_type === 'by_subject') {
        // Fetch topics based on filter criteria
        const conditions = [];
        
        if (filter_criteria) {
          const filters = filter_criteria as any;
          
          if (filters.showstudent !== undefined) {
            conditions.push(eq(topics.showstudent, filters.showstudent));
          }
          if (filters.challengesubject) {
            conditions.push(eq(topics.challengesubject, filters.challengesubject));
          }
          if (filters.parentid === null) {
            conditions.push(sql`${topics.parentid} IS NULL`);
          } else if (filters.parentid) {
            conditions.push(eq(topics.parentid, filters.parentid));
          }
        }

        // Apply sorting
        const sortDirection = sort_order === 'desc' ? desc : asc;
        let orderBy;
        if (sort_field === 'topic') {
          orderBy = sortDirection(topics.topic);
        } else if (sort_field === 'challengesubject') {
          orderBy = sortDirection(topics.challengesubject);
        } else {
          orderBy = sortDirection(topics.topic);
        }

        const topicResults = conditions.length > 0 
          ? await db.select().from(topics).where(and(...conditions)).orderBy(orderBy)
          : await db.select().from(topics).orderBy(orderBy);
          
        results = topicResults.map(topic => ({ ...topic, type: 'topic' }));

        // If by_subject, group by challengesubject
        if (display_type === 'by_subject') {
          const grouped = results.reduce((acc: Record<string, any[]>, item) => {
            const subject = item.challengesubject || 'Other';
            if (!acc[subject]) acc[subject] = [];
            acc[subject].push(item);
            return acc;
          }, {});
          
          results = Object.entries(grouped).map(([subject, items]) => ({
            subject,
            items,
            type: 'subject_group'
          }));
        }
      }

      return results;
    } catch (error) {
      console.error('Error fetching content by collection filters:', error);
      throw error;
    }
  }
}