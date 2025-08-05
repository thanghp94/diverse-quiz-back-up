import { storage } from "./server/storage";

async function debugMatching38() {
  console.log("🔍 Debugging matching activity 38...");
  
  // Get the matching activity
  const activity = await storage.getMatchingById("38");
  if (!activity) {
    console.log("❌ Activity 38 not found");
    return;
  }
  
  console.log("📋 Activity 38:", {
    topic: activity.topic,
    type: activity.type,
    prompt1: activity.prompt1,
    prompt2: activity.prompt2,
    prompt3: activity.prompt3,
    prompt4: activity.prompt4,
    prompt5: activity.prompt5,
    prompt6: activity.prompt6
  });
  
  // Check each content ID
  const contentIds = [
    activity.prompt1,
    activity.prompt2,
    activity.prompt3,
    activity.prompt4,
    activity.prompt5,
    activity.prompt6
  ].filter(Boolean);
  
  console.log(`📝 Total content IDs: ${contentIds.length}`);
  
  for (const contentId of contentIds) {
    const content = await storage.getContentById(contentId);
    if (content) {
      const image = await storage.getImageById(content.imageid || '') ||
                    (await storage.getImages()).find(img => img.contentid === contentId);
      
      console.log(`✅ Content ${contentId}:`, {
        title: content.title?.substring(0, 40) + '...',
        hasTitle: !!content.title,
        hasShortDesc: !!content.short_description,
        hasImage: !!image?.imagelink,
        imageid: content.imageid
      });
    } else {
      console.log(`❌ Content ${contentId}: NOT FOUND`);
    }
  }
}

debugMatching38().catch(console.error);