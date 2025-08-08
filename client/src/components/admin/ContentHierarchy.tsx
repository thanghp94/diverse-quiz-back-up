import { Topic, Content } from './types';

interface ContentItem {
  id: string;
  type: 'content';
  title: string;
  summary: string;
  parentid?: string;
  topicid: string;
  contentgroup?: string;
  order: string;
}

interface GroupCard {
  id: string;
  type: 'groupcard';
  title: string;
  summary: string;
  parentid?: string;
  topicid: string;
  order: string;
  content: ContentItem[];
  children: any[];
}

interface TopicHierarchy {
  id: string;
  type: 'topic';
  title: string;
  summary: string | undefined;
  parentid?: string;
  showstudent?: boolean;
  children: TopicHierarchy[];
  content: (ContentItem | GroupCard)[];
}

export const buildContentHierarchy = (
  topics: Topic[] | undefined,
  content: any[] | undefined,
  selectedCollectionFilter: string,
  selectedCollectionContent: any[]
): TopicHierarchy[] => {
  if (!topics || !content) return [];
  
  const allTopics = topics as Topic[];
  let allContent = content as any[];
  
  // Filter content by collection if selected
  if (selectedCollectionFilter !== 'all' && selectedCollectionContent.length > 0) {
    // Separate topics and content from collection data
    const collectionTopics = selectedCollectionContent.filter((item: any) => item.type === 'topic');
    const collectionContent = selectedCollectionContent.filter((item: any) => item.type === 'content');
    
    const collectionContentIds = new Set(collectionContent.map((item: any) => item.id));
    const collectionTopicIds = new Set(collectionTopics.map((item: any) => item.id));
    
    // Filter content to only show items in the selected collection
    if (collectionContent.length > 0) {
      allContent = allContent.filter(c => collectionContentIds.has(c.id));
    } else {
      // If collection only has topics but no specific content, show no content
      // This allows showing just the topic hierarchy for topic-only collections
      allContent = [];
    }
    
    console.log('Collection filtering:', {
      selectedCollectionFilter,
      collectionTopics: collectionTopics.length,
      collectionContent: collectionContent.length,
      collectionTopicIds: Array.from(collectionTopicIds),
      filteredContent: allContent.length
    });
  }
  
  // Get root topics (no parentid), filtered by collection if selected
  let rootTopics = allTopics.filter(t => !t.parentid);
  
  if (selectedCollectionFilter !== 'all' && selectedCollectionContent.length > 0) {
    // Get topics directly from collection
    const collectionTopics = selectedCollectionContent.filter((item: any) => item.type === 'topic');
    const collectionTopicIds = new Set(collectionTopics.map((item: any) => item.id));
    
    // Also include topics that have content in the collection
    const topicsWithCollectionContent = new Set(allContent.map(c => c.topicid));
    
    const relevantTopicIds = new Set([
      ...Array.from(collectionTopicIds),
      ...Array.from(topicsWithCollectionContent)
    ]);
    
    rootTopics = rootTopics.filter(t => relevantTopicIds.has(t.id));
  }
  
  // Get group cards (content items where prompt = "groupcard")
  const groupCards = allContent.filter(c => c.prompt === 'groupcard');
  
  // Get content that belongs to group cards (to exclude from regular content)
  const contentInGroups = new Set(
    allContent
      .filter(c => c.contentgroup)
      .map(c => c.id)
  );
  
  const buildHierarchy = (parentId?: string): TopicHierarchy[] => {
    const children = allTopics.filter(t => t.parentid === parentId);
    
    return children.map(child => {
      // Get regular content for this topic (excluding group cards and content already in groups)
      const topicContent = allContent
        .filter(c => 
          c.topicid === child.id && 
          c.prompt !== 'groupcard' && 
          !contentInGroups.has(c.id)
        )
        .sort((a, b) => {
          const orderA = parseInt(a.order || '0') || 0;
          const orderB = parseInt(b.order || '0') || 0;
          return orderA - orderB;
        })
        .map(c => ({
          id: c.id,
          type: 'content' as const,
          title: c.title,
          summary: c.short_blurb,
          parentid: c.parentid,
          topicid: c.topicid,
          order: c.order
        }));

      // Get group cards for this topic
      const topicGroupCards = groupCards
        .filter(gc => gc.topicid === child.id)
        .sort((a, b) => {
          const orderA = parseInt(a.order || '0') || 0;
          const orderB = parseInt(b.order || '0') || 0;
          return orderA - orderB;
        })
        .map(gc => {
          // Find content that belongs to this group card
          const groupContent = allContent
            .filter(c => c.contentgroup === gc.id)
            .sort((a, b) => {
              const orderA = parseInt(a.order || '0') || 0;
              const orderB = parseInt(b.order || '0') || 0;
              return orderA - orderB;
            })
            .map(c => ({
              id: c.id,
              type: 'content' as const,
              title: c.title,
              summary: c.short_blurb,
              parentid: c.parentid,
              topicid: c.topicid,
              contentgroup: c.contentgroup,
              order: c.order
            }));

          return {
            id: gc.id,
            type: 'groupcard' as const,
            title: gc.title,
            summary: gc.short_description,
            parentid: gc.parentid,
            topicid: gc.topicid,
            order: gc.order,
            content: groupContent,
            children: []
          };
        });

      // Combine and sort all content items (regular content + group cards) by order
      const allContentItems = [...topicContent, ...topicGroupCards]
        .sort((a, b) => {
          const orderA = parseInt(a.order || '0') || 0;
          const orderB = parseInt(b.order || '0') || 0;
          return orderA - orderB;
        });

      return {
        id: child.id,
        type: 'topic' as const,
        title: child.topic,
        summary: child.short_summary,
        parentid: child.parentid,
        showstudent: child.showstudent,
        children: buildHierarchy(child.id),
        content: allContentItems
      };
    });
  };
  
  return rootTopics.map(root => {
    // Get regular content for root topic (excluding group cards and content already in groups)
    const rootContent = allContent
      .filter(c => 
        c.topicid === root.id && 
        c.prompt !== 'groupcard' && 
        !contentInGroups.has(c.id)
      )
      .sort((a, b) => {
        const orderA = parseInt(a.order || '0') || 0;
        const orderB = parseInt(b.order || '0') || 0;
        return orderA - orderB;
      })
      .map(c => ({
        id: c.id,
        type: 'content' as const,
        title: c.title,
        summary: c.short_blurb,
        parentid: c.parentid,
        topicid: c.topicid,
        order: c.order
      }));

    // Get group cards for root topic
    const rootGroupCards = groupCards
      .filter(gc => gc.topicid === root.id)
      .sort((a, b) => {
        const orderA = parseInt(a.order || '0') || 0;
        const orderB = parseInt(b.order || '0') || 0;
        return orderA - orderB;
      })
      .map(gc => {
        // Find content that belongs to this group card
        const groupContent = allContent
          .filter(c => c.contentgroup === gc.id)
          .sort((a, b) => {
            const orderA = parseInt(a.order || '0') || 0;
            const orderB = parseInt(b.order || '0') || 0;
            return orderA - orderB;
          })
          .map(c => ({
            id: c.id,
            type: 'content' as const,
            title: c.title,
            summary: c.short_blurb,
            parentid: c.parentid,
            topicid: c.topicid,
            contentgroup: c.contentgroup,
            order: c.order
          }));

        return {
          id: gc.id,
          type: 'groupcard' as const,
          title: gc.title,
          summary: gc.short_description,
          parentid: gc.parentid,
          topicid: gc.topicid,
          order: gc.order,
          content: groupContent,
          children: []
        };
      });

    // Combine and sort all content items (regular content + group cards) by order
    const allRootContentItems = [...rootContent, ...rootGroupCards]
      .sort((a, b) => {
        const orderA = parseInt(a.order || '0') || 0;
        const orderB = parseInt(b.order || '0') || 0;
        return orderA - orderB;
      });

    return {
      id: root.id,
      type: 'topic' as const,
      title: root.topic,
      summary: root.short_summary,
      parentid: root.parentid,
      showstudent: root.showstudent,
      children: buildHierarchy(root.id),
      content: allRootContentItems
    };
  });
};