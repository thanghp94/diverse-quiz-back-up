#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import mappings from old paths to new paths
const importMappings = {
  // Individual components
  '@/components/content-management/activities/quiz/TopicQuizRunner': '@/quiz/components/individual/TopicQuizRunner',
  '@/components/content-management/activities/quiz/QuizView': '@/quiz/components/individual/QuizView',
  '@/components/content-management/activities/quiz/QuizResults': '@/quiz/components/individual/QuizResults',
  '@/components/content-management/activities/quiz/QuizApp': '@/quiz/components/individual/QuizApp',
  
  // Orchestration components
  '@/features/quiz/components/QuizOrchestrator': '@/quiz/components/orchestration/QuizOrchestrator',
  '@/features/quiz/components/QuizHome': '@/quiz/components/orchestration/QuizHome',
  
  // Shared components
  '@/features/quiz/components/QuizInProgress': '@/quiz/components/shared/QuizInProgress',
  '@/components/content-management/interactions/dialogs/QuizDialog': '@/quiz/components/shared/QuizDialog',
  
  // Hooks
  '@/features/quiz/hooks/useQuizLogic': '@/quiz/hooks/useQuizLogic',
  '@/hooks/useQuiz': '@/quiz/hooks/useQuiz',
  
  // Core data
  '@/features/quiz/data/sampleQuizzes': '@/quiz/core/sampleQuizzes',
  
  // Question types
  '@/components/content-management/activities/quiz/question-types/MultipleChoice': '@/quiz/question-types/MultipleChoice',
  '@/components/content-management/activities/quiz/question-types/FillInBlank': '@/quiz/question-types/FillInBlank',
  '@/components/content-management/activities/quiz/question-types/Categorize': '@/quiz/question-types/Categorize',
  '@/components/content-management/activities/quiz/question-types/Matching': '@/quiz/question-types/Matching',
  '@/components/content-management/activities/quiz/question-types/Matching/Matching': '@/quiz/question-types/Matching',
  
  // Types
  '@/features/quiz/types': '@/quiz/types',
  
  // Relative path mappings for files within the quiz directory
  '../../../features/quiz/components/QuizOrchestrator': '@/quiz/components/orchestration/QuizOrchestrator',
  '../../../features/quiz/hooks/useQuizLogic': '@/quiz/hooks/useQuizLogic',
  '../../../features/quiz/data/sampleQuizzes': '@/quiz/core/sampleQuizzes',
  '../../interactions/dialogs/QuizDialog': '@/quiz/components/shared/QuizDialog',
  '../../activities/quiz/TopicQuizRunner': '@/quiz/components/individual/TopicQuizRunner',
  '../../activities/quiz/QuizView': '@/quiz/components/individual/QuizView',
  '../../activities/quiz/QuizResults': '@/quiz/components/individual/QuizResults',
  '../../activities/quiz/QuizApp': '@/quiz/components/individual/QuizApp',
  '../../activities/quiz/question-types/Matching/Matching': '@/quiz/question-types/Matching',
  '../../activities/quiz/question-types/MultipleChoice': '@/quiz/question-types/MultipleChoice',
  '../../activities/quiz/question-types/FillInBlank': '@/quiz/question-types/FillInBlank',
  '../../activities/quiz/question-types/Categorize': '@/quiz/question-types/Categorize',
  './question-types/MultipleChoice': '@/quiz/question-types/MultipleChoice',
  './question-types/FillInBlank': '@/quiz/question-types/FillInBlank',
  './question-types/Categorize': '@/quiz/question-types/Categorize',
  './question-types/Matching': '@/quiz/question-types/Matching',
  
  // Additional relative imports within quiz components
  '../hooks/useQuizLogic': '@/quiz/hooks/useQuizLogic',
  '../types': '@/quiz/types',
  './QuizInProgress': '@/quiz/components/shared/QuizInProgress',
};

// Special handling for import transformations that need more complex logic
const specialImportTransformations = [
  {
    // Transform default import of Matching to named import
    pattern: /import\s+Matching\s+from\s+['"`]@\/quiz\/question-types\/Matching['"`]/g,
    replacement: 'import { Matching } from "@/quiz/question-types/Matching"'
  }
];

function updateImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Apply special transformations first
    for (const transformation of specialImportTransformations) {
      if (transformation.pattern.test(content)) {
        content = content.replace(transformation.pattern, transformation.replacement);
        updated = true;
        console.log(`Applied special transformation in ${filePath}: ${transformation.replacement}`);
      }
    }
    
    // Update import statements
    for (const [oldPath, newPath] of Object.entries(importMappings)) {
      const importRegex = new RegExp(`(['"\`])${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(['"\`])`, 'g');
      if (importRegex.test(content)) {
        content = content.replace(importRegex, `$1${newPath}$2`);
        updated = true;
        console.log(`Updated import in ${filePath}: ${oldPath} -> ${newPath}`);
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
    return false;
  }
}

function findTsxTsFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Main execution
console.log('🔄 Starting quiz import path updates...');

const clientSrcDir = path.join(__dirname, 'client', 'src');
const allFiles = findTsxTsFiles(clientSrcDir);

let updatedCount = 0;
let totalFiles = 0;

for (const file of allFiles) {
  totalFiles++;
  if (updateImportsInFile(file)) {
    updatedCount++;
  }
}

console.log(`\n✅ Import update complete!`);
console.log(`📊 Files processed: ${totalFiles}`);
console.log(`🔧 Files updated: ${updatedCount}`);
console.log(`\n🎯 Next steps:`);
console.log(`1. Run: npm run build`);
console.log(`2. Run: npm run test`);
console.log(`3. Check for any remaining import errors`);
