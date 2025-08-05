#!/usr/bin/env tsx

/**
 * Comprehensive import optimization script
 * Fixes all import statements for reorganized components
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const importMappings = {
  // Content components
  'ContentDifficultyIndicator': '@/components/content',
  'ContentEditor': '@/components/content',
  'ContentGroupCard': '@/components/content',
  'ContentGroupCards': '@/components/content',
  'ContentList': '@/components/content',
  'ContentPopup': '@/components/content',
  'ContentProgressPanel': '@/components/content',
  'ContentRatingButtons': '@/components/content',
  'ContentSection': '@/components/content',
  'ContentSidebar': '@/components/content',
  'ContentThumbnail': '@/components/content',
  'ContentThumbnailGallery': '@/components/content',
  'GroupedContentCard': '@/components/content',
  'EnhancedContentProgressPanel': '@/components/content',
  'SimpleContentProgressPanel': '@/components/content',

  // Live class components
  'LiveClassMonitor': '@/components/live-class',
  'LiveClassPanel': '@/components/live-class',

  // Matching components
  'MatchingActivityPopup': '@/components/matching',
  'MatchingActivityTracker': '@/components/matching',
  'MatchingListPopup': '@/components/matching',
  'ParentTopicMatchingButton': '@/components/matching',
  'SubtopicMatchingButton': '@/components/matching',

  // Personal components
  'PersonalContentPanel': '@/components/personal',
  'PersonalNoteDialog': '@/components/personal',
  'PersonalNotesDropdown': '@/components/personal',

  // Shared components
  'Header': '@/components/shared',
  'SharedNav': '@/components/shared',
  'MarkdownRenderer': '@/components/shared',
  'AssignmentPanel': '@/components/shared',
  'LeaderboardPanel': '@/components/shared',
  'StreakDisplay': '@/components/shared',
  'HomePage': '@/components/shared',
  'ObjectUploader': '@/components/shared',
  'CenteredObjectUploader': '@/components/shared',
  'SocketTest': '@/components/shared',

  // Topics components
  'TopicCard': '@/components/topics',
  'TopicListItem': '@/components/topics',
  'TopicMatchingPopup': '@/components/topics',
  'TopicQuizRunner': '@/components/topics',

  // Writing system components
  'AcademicEssayPopup': '@/components/writing-system',
  'CreativeWritingPopup': '@/components/writing-system',
  'StructuredEssayWriter': '@/components/writing-system',
  'WritingContentPopup': '@/components/writing-system',
  'WritingJournal': '@/components/writing-system',
  'WritingOutlinePopup': '@/components/writing-system',
  'WritingSubmissionPopup': '@/components/writing-system',
  'WritingTopicSelection': '@/components/writing-system',
};

async function fixImports() {
  console.log('🔧 Starting import optimization...');
  
  const files = await glob('client/src/**/*.{ts,tsx}');
  let totalFiles = 0;
  let totalReplacements = 0;

  for (const file of files) {
    try {
      let content = readFileSync(file, 'utf8');
      let fileChanged = false;
      let fileReplacements = 0;

      // Fix each component import
      for (const [component, newPath] of Object.entries(importMappings)) {
        // Match various import patterns
        const patterns = [
          new RegExp(`import\\s+${component}\\s+from\\s+['"']@/components/${component}['"]`, 'g'),
          new RegExp(`import\\s+{\\s*${component}\\s*}\\s+from\\s+['"']@/components/${component}['"]`, 'g'),
          new RegExp(`from\\s+['"']@/components/${component}['"]`, 'g'),
        ];

        for (const pattern of patterns) {
          if (pattern.test(content)) {
            // Determine if it should be named or default import based on the mapping
            const isNamedExport = ['ContentDifficultyIndicator', 'ContentEditor', 'ContentGroupCard'].includes(component);
            
            if (isNamedExport) {
              content = content.replace(
                new RegExp(`import\\s+${component}\\s+from\\s+['"']@/components/${component}['"]`, 'g'),
                `import { ${component} } from '${newPath}'`
              );
            } else {
              content = content.replace(
                new RegExp(`from\\s+['"']@/components/${component}['"]`, 'g'),
                `from '${newPath}'`
              );
            }
            
            fileChanged = true;
            fileReplacements++;
          }
        }
      }

      if (fileChanged) {
        writeFileSync(file, content);
        totalFiles++;
        totalReplacements += fileReplacements;
        console.log(`✅ Fixed ${fileReplacements} imports in ${file}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
    }
  }

  console.log(`\n🎉 Import optimization complete!`);
  console.log(`📊 Files updated: ${totalFiles}`);
  console.log(`🔄 Total replacements: ${totalReplacements}`);
}

fixImports().catch(console.error);