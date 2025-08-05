import { storage } from "./server/storage";

async function analyzeMissingContent() {
  console.log("🔍 Analyzing missing content across all matching activities...");
  
  const matchingActivities = await storage.getMatchingActivities();
  const allContent = await storage.getContent();
  
  let totalContentIds = 0;
  let foundContentIds = 0;
  let activitiesWithIssues = 0;
  
  for (const activity of matchingActivities.slice(0, 10)) { // Check first 10 activities
    const contentIds = [
      activity.prompt1,
      activity.prompt2,
      activity.prompt3,
      activity.prompt4,
      activity.prompt5,
      activity.prompt6
    ].filter(Boolean);
    
    const foundIds = [];
    const missingIds = [];
    
    for (const contentId of contentIds) {
      const found = allContent.find(c => c.id === contentId);
      if (found) {
        foundIds.push(contentId);
      } else {
        missingIds.push(contentId);
      }
    }
    
    totalContentIds += contentIds.length;
    foundContentIds += foundIds.length;
    
    if (missingIds.length > 0) {
      activitiesWithIssues++;
      console.log(`❌ Activity ${activity.id} (${activity.topic}): ${foundIds.length}/${contentIds.length} content found`);
    } else {
      console.log(`✅ Activity ${activity.id} (${activity.topic}): ${foundIds.length}/${contentIds.length} content found`);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`Total content IDs referenced: ${totalContentIds}`);
  console.log(`Content IDs found: ${foundContentIds}`);
  console.log(`Missing content IDs: ${totalContentIds - foundContentIds}`);
  console.log(`Activities with missing content: ${activitiesWithIssues}/${matchingActivities.slice(0, 10).length}`);
  console.log(`Success rate: ${Math.round((foundContentIds / totalContentIds) * 100)}%`);
}

analyzeMissingContent().catch(console.error);