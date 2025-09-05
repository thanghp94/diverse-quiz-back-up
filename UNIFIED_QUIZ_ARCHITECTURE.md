# Unified Quiz Architecture & Implementation Plan

## Overview

This document outlines the comprehensive architecture for unifying all quiz components into a single, extensible system that supports individual quizzes, live Quizizz-style sessions, and assignment creation while maintaining backward compatibility with existing features.

## Current State Analysis

### Existing Components (All Preserved)
- ✅ **TopicQuizRunner.tsx** - Topic-specific quiz launcher
- ✅ **QuizOrchestrator.tsx** - Basic quiz orchestration
- ✅ **QuizInProgress.tsx** - Question renderer
- ✅ **QuizView.tsx** - Database-heavy quiz component
- ✅ **Question Types**: MultipleChoice, Matching, FillInBlank, Categorize
- ✅ **Database Integration**: assignment_student_try, student_try tracking

### Current File Structure Issues
```
Current Scattered Structure:
├── client/src/components/content-management/activities/quiz/
│   ├── TopicQuizRunner.tsx
│   ├── QuizView.tsx
│   ├── QuizApp.tsx
│   ├── QuizResults.tsx
│   └── question-types/
│       ├── MultipleChoice.tsx
│       ├── FillInBlank.tsx
│       ├── Categorize.tsx
│       └── Matching/
├── client/src/features/quiz/
│   ├── components/
│   │   ├── QuizOrchestrator.tsx
│   │   ├── QuizInProgress.tsx
│   │   └── QuizHome.tsx
│   ├── hooks/
│   │   └── useQuizLogic.ts
│   └── types.ts
├── client/src/components/content-management/interactions/dialogs/
│   └── QuizDialog.tsx
└── Various other locations with quiz-related utilities
```

### Current Issues Addressed
- 🔴 **Duplicate Logic** → Unified through adapter pattern
- 🔴 **Inconsistent APIs** → Normalized through config-driven approach
- 🔴 **Scattered State** → Centralized state management
- 🔴 **Hard-coded Dependencies** → Flexible source/adapter system
- 🔴 **Scattered File Structure** → Centralized quiz directory

## File Consolidation Plan

### Target Centralized Structure
```
client/src/quiz/                           # New centralized quiz directory
├── core/
│   ├── QuizEngine.tsx                     # Main orchestrator (unified entry point)
│   ├── QuizRenderer.tsx                   # Question display logic
│   ├── QuizTracker.tsx                    # Analytics & database tracking
│   └── adapters/
│       ├── QuizEngineAdapter.tsx          # Backward compatibility layer
│       ├── TopicQuizAdapter.tsx           # Topic-specific logic
│       ├── AssignmentAdapter.tsx          # Assignment-specific logic
│       └── LiveQuizAdapter.tsx            # Live session logic
├── components/
│   ├── individual/
│   │   ├── TopicQuizRunner.tsx            # Moved from content-management/activities/quiz/
│   │   ├── QuizView.tsx                   # Moved from content-management/activities/quiz/
│   │   ├── QuizResults.tsx                # Moved from content-management/activities/quiz/
│   │   └── QuizDialog.tsx                 # Moved from content-management/interactions/dialogs/
│   ├── orchestration/
│   │   ├── QuizOrchestrator.tsx           # Moved from features/quiz/components/
│   │   ├── QuizInProgress.tsx             # Moved from features/quiz/components/
│   │   └── QuizHome.tsx                   # Moved from features/quiz/components/
│   └── shared/
│       ├── QuestionDisplay.tsx            # Common question display logic
│       ├── ProgressBar.tsx                # Quiz progress indicator
│       ├── Timer.tsx                      # Question/quiz timer
│       └── ScoreDisplay.tsx               # Score visualization
├── live/
│   ├── LiveQuizOrchestrator.tsx           # Live quiz management
│   ├── TeacherLiveView.tsx                # Teacher control panel
│   ├── StudentLiveView.tsx                # Student live interface
│   ├── LiveLeaderboard.tsx                # Real-time leaderboard
│   ├── ParticipantsList.tsx               # Live participants display
│   ├── AnswerDistribution.tsx             # Real-time answer stats
│   └── components/
│       ├── WaitingScreen.tsx              # Between questions screen
│       ├── QuestionResults.tsx            # Individual question results
│       └── SessionControls.tsx            # Teacher session controls
├── question-types/
│   ├── MultipleChoice/
│   │   ├── MultipleChoice.tsx             # Moved from content-management/activities/quiz/question-types/
│   │   ├── OptionButton.tsx               # Individual option component
│   │   └── useMultipleChoice.ts           # Question-specific logic
│   ├── Matching/
│   │   ├── Matching.tsx                   # Already in good structure ✅
│   │   ├── DraggableItem.tsx              # Keep existing structure
│   │   ├── DropZone.tsx                   # Keep existing structure
│   │   └── hooks/
│   │       └── useMatching.ts             # Keep existing structure
│   ├── FillInBlank/
│   │   ├── FillInBlank.tsx                # Moved from content-management/activities/quiz/question-types/
│   │   ├── BlankInput.tsx                 # Individual blank input
│   │   ├── TextInput.tsx                  # Text input type
│   │   ├── NumberInput.tsx                # Number input type
│   │   ├── DropdownInput.tsx              # Dropdown input type
│   │   └── DateInput.tsx                  # Date input type
│   ├── Categorize/
│   │   ├── Categorize.tsx                 # Moved from content-management/activities/quiz/question-types/
│   │   ├── CategoryContainer.tsx          # Category drop zone
│   │   └── CategoryItem.tsx               # Draggable category item
│   └── registry.ts                        # Question type registry
├── hooks/
│   ├── useQuizEngine.ts                   # Unified state management
│   ├── useQuizTracking.ts                 # Database operations
│   ├── useQuizData.ts                     # Data fetching
│   ├── useLiveQuizSession.ts              # WebSocket management
│   ├── useLeaderboard.ts                  # Leaderboard state
│   └── useQuizLogic.ts                    # Moved from features/quiz/hooks/
├── types/
│   ├── quiz.types.ts                      # Core quiz types
│   ├── question.types.ts                  # Question-specific types
│   ├── live.types.ts                      # Live session types
│   └── index.ts                           # Type exports
├── utils/
│   ├── scoring.ts                         # Scoring algorithms
│   ├── validation.ts                      # Answer validation
│   ├── formatting.ts                      # Data formatting utilities
│   └── constants.ts                       # Quiz constants
└── index.ts                               # Main exports
```

## Unified Architecture

### Migration File Movement Plan

#### Phase 1: Create New Structure
1. **Create centralized directory**: `client/src/quiz/`
2. **Set up folder structure** as outlined above
3. **Create index files** for clean imports

#### Phase 2: Move Files Systematically
```bash
# Individual Quiz Components
mv client/src/components/content-management/activities/quiz/TopicQuizRunner.tsx → client/src/quiz/components/individual/
mv client/src/components/content-management/activities/quiz/QuizView.tsx → client/src/quiz/components/individual/
mv client/src/components/content-management/activities/quiz/QuizResults.tsx → client/src/quiz/components/individual/
mv client/src/components/content-management/interactions/dialogs/QuizDialog.tsx → client/src/quiz/components/individual/

# Orchestration Components  
mv client/src/features/quiz/components/QuizOrchestrator.tsx → client/src/quiz/components/orchestration/
mv client/src/features/quiz/components/QuizInProgress.tsx → client/src/quiz/components/orchestration/
mv client/src/features/quiz/components/QuizHome.tsx → client/src/quiz/components/orchestration/

# Question Types
mv client/src/components/content-management/activities/quiz/question-types/MultipleChoice.tsx → client/src/quiz/question-types/MultipleChoice/
mv client/src/components/content-management/activities/quiz/question-types/FillInBlank.tsx → client/src/quiz/question-types/FillInBlank/
mv client/src/components/content-management/activities/quiz/question-types/Categorize.tsx → client/src/quiz/question-types/Categorize/
# Note: Matching/ folder already well-structured, move entire folder
mv client/src/components/content-management/activities/quiz/question-types/Matching/ → client/src/quiz/question-types/

# Hooks and Logic
mv client/src/features/quiz/hooks/useQuizLogic.ts → client/src/quiz/hooks/
mv client/src/features/quiz/types.ts → client/src/quiz/types/quiz.types.ts
```

#### Phase 3: Update Import Statements
```typescript
// Before (scattered imports)
import TopicQuizRunner from '@/components/content-management/activities/quiz/TopicQuizRunner';
import QuizOrchestrator from '@/features/quiz/components/QuizOrchestrator';
import { useQuizLogic } from '@/features/quiz/hooks/useQuizLogic';

// After (centralized imports)
import { TopicQuizRunner, QuizOrchestrator, useQuizLogic } from '@/quiz';
// or more specific
import { TopicQuizRunner } from '@/quiz/components/individual';
import { QuizOrchestrator } from '@/quiz/components/orchestration';
import { useQuizLogic } from '@/quiz/hooks';
```

#### Phase 4: Create Clean Export Structure
```typescript
// client/src/quiz/index.ts
export * from './components';
export * from './hooks';
export * from './types';
export * from './utils';

// client/src/quiz/components/index.ts
export * from './individual';
export * from './orchestration';
export * from './shared';

// client/src/quiz/components/individual/index.ts
export { default as TopicQuizRunner } from './TopicQuizRunner';
export { default as QuizView } from './QuizView';
export { default as QuizResults } from './QuizResults';
export { default as QuizDialog } from './QuizDialog';
```

### Benefits of Centralized Structure

#### 1. **Improved Developer Experience**
- ✅ Single location for all quiz-related code
- ✅ Clear separation of concerns
- ✅ Easy to find and modify quiz components
- ✅ Consistent import paths

#### 2. **Better Code Organization**
- ✅ Logical grouping by functionality
- ✅ Shared components easily accessible
- ✅ Question types properly categorized
- ✅ Hooks and utilities centralized

#### 3. **Enhanced Maintainability**
- ✅ Easier to refactor and update
- ✅ Clear dependencies between components
- ✅ Simplified testing structure
- ✅ Better code reusability

#### 4. **Scalability**
- ✅ Easy to add new question types
- ✅ Simple to extend live quiz features
- ✅ Clear structure for new quiz modes
- ✅ Organized for team development

## Configuration System

### QuizEngine Configuration
```typescript
interface QuizEngineConfig {
  // Quiz Mode
  mode: 'individual' | 'live' | 'assignment';
  
  // Question Selection
  questionSelection: {
    strategy: 'all' | 'unattempted' | 'failed' | 'random' | 'adaptive';
    maxQuestions?: number;
    excludeAttempted?: boolean;
    retryFailedOnly?: boolean;
  };
  
  // Display Options
  displayOptions: {
    optionsPerQuestion?: number; // 2, 3, 4, or dynamic
    showHints?: boolean;
    allowPartialCredit?: boolean;
    randomizeOptions?: boolean;
    showProgress?: boolean;
  };
  
  // Quiz Behavior
  behavior: {
    allowReview?: boolean;
    timeLimit?: number;
    maxAttempts?: number;
    pauseable?: boolean;
  };
  
  // Live Session (when mode === 'live')
  liveSession?: {
    sessionId: string;
    teacherId: string;
    isHost: boolean;
    realTimeSync: boolean;
    showLeaderboard: boolean;
    questionTimer?: number;
  };
}
```

### Usage Examples
```typescript
// Individual Topic Quiz (Current TopicQuizRunner)
<QuizEngine
  source={{ type: 'topic', topicId: '123', level: 'Easy' }}
  config={{
    mode: 'individual',
    questionSelection: { strategy: 'unattempted', maxQuestions: 10 },
    displayOptions: { optionsPerQuestion: 2 } // True/False style
  }}
/>

// Live Quizizz-Style Session
<QuizEngine
  source={{ type: 'topic', topicId: '123' }}
  config={{
    mode: 'live',
    liveSession: {
      sessionId: 'live-123',
      teacherId: 'teacher-456',
      isHost: false,
      showLeaderboard: true,
      questionTimer: 30
    }
  }}
/>

// Assignment Quiz
<QuizEngine
  source={{ type: 'assignment', assignmentId: '789' }}
  config={{
    mode: 'assignment',
    behavior: { timeLimit: 3600, allowReview: true }
  }}
/>
```

## Live Quiz Features (Quizizz-Style)

### Real-Time Components
- **LiveQuizOrchestrator**: Manages live session flow
- **TeacherLiveView**: Control panel with participant stats
- **StudentLiveView**: Student interface with real-time updates
- **LiveLeaderboard**: Speed-based scoring with live updates
- **AnswerDistribution**: Real-time answer visualization

### WebSocket Integration
- Real-time question synchronization
- Live answer submission and scoring
- Dynamic leaderboard updates
- Teacher session control
- Participant management

### Scoring System
- Base points for correct answers (1000 pts)
- Speed bonus (up to 500 pts based on response time)
- Streak multipliers
- Real-time leaderboard ranking

## Implementation Plan (Safe Development)

### Phase 0: File Consolidation (Week 0.5)
**Goal**: Centralize all quiz files without breaking functionality

#### Tasks:
1. **Create New Directory Structure**
   ```bash
   mkdir -p client/src/quiz/{core,components/{individual,orchestration,shared},live,question-types,hooks,types,utils}
   ```

2. **Move Files Systematically**
   - Move individual quiz components to `quiz/components/individual/`
   - Move orchestration components to `quiz/components/orchestration/`
   - Move question types to `quiz/question-types/`
   - Move hooks to `quiz/hooks/`
   - Move types to `quiz/types/`

3. **Update Import Statements**
   - Create automated script to update all import paths
   - Update all components that import quiz-related files
   - Test each moved component individually

4. **Create Clean Export Structure**
   - Set up index.ts files for clean imports
   - Establish consistent export patterns
   - Enable `@/quiz` import alias

#### Success Criteria:
- ✅ All quiz files moved to centralized location
- ✅ All import statements updated correctly
- ✅ No broken imports or missing dependencies
- ✅ Existing functionality works unchanged
- ✅ Clean import structure established

### Phase 1: Backward Compatibility Layer (Week 1)
**Goal**: Create unified system without breaking existing functionality

#### Tasks:
1. **Create QuizEngineAdapter**
   - Accept all existing prop patterns
   - Normalize different interfaces
   - Route to appropriate handlers

2. **Replace Components Gradually**
   ```typescript
   // TopicQuizRunner.tsx - BEFORE
   <QuizView questionIds={questionIds} onQuizFinish={handleFinish} />
   
   // TopicQuizRunner.tsx - AFTER (same external API)
   <QuizEngineAdapter questionIds={questionIds} onQuizFinish={handleFinish} />
   ```

3. **Maintain Database Compatibility**
   - Keep existing assignment_student_try creation
   - Preserve student_try tracking
   - Maintain current API endpoints

#### Success Criteria:
- ✅ All existing quiz functionality works unchanged
- ✅ No breaking changes to external APIs
- ✅ Database operations remain identical
- ✅ Can rollback to original components if needed

### Phase 2: Unified State Management (Week 2)
**Goal**: Consolidate state logic while maintaining component compatibility

#### Tasks:
1. **Create useUnifiedQuizState Hook**
   - Merge logic from useQuizLogic, TopicQuizRunner, QuizView
   - Handle all existing data fetching patterns
   - Provide consistent state interface

2. **Update Components to Use Unified Hook**
   - QuizInProgress uses unified state
   - QuizOrchestrator uses unified state
   - Maintain existing prop interfaces

3. **Centralize Database Operations**
   - Create useQuizTracking hook
   - Consolidate assignment_student_try logic
   - Unify analytics tracking

#### Success Criteria:
- ✅ Single source of truth for quiz state
- ✅ Consistent data fetching across components
- ✅ Reduced code duplication
- ✅ Existing functionality preserved

### Phase 3: Enhanced Question Types (Week 3)
**Goal**: Standardize question components with configuration support

#### Tasks:
1. **Enhance MultipleChoice Component**
   - Add support for 2-option mode (True/False)
   - Configuration-driven option count
   - Randomization support

2. **Enhance FillInBlank Component**
   - Multi-input type support (text, number, dropdown, date)
   - Hint system integration
   - Partial credit scoring

3. **Standardize All Question Types**
   - Consistent prop interfaces
   - Configuration support
   - Enhanced accessibility

#### Success Criteria:
- ✅ All question types support configuration
- ✅ New features (2-option, multi-input) work
- ✅ Existing question behavior unchanged
- ✅ Better accessibility and UX

### Phase 4: Live Quiz System (Week 4)
**Goal**: Add Quizizz-style live quiz functionality

#### Tasks:
1. **WebSocket Infrastructure**
   - Set up WebSocket server for live sessions
   - Implement session management
   - Real-time message handling

2. **Live Quiz Components**
   - LiveQuizOrchestrator for session management
   - TeacherLiveView with control panel
   - StudentLiveView with real-time updates
   - LiveLeaderboard with speed-based scoring

3. **Integration with Existing System**
   - Live sessions use same QuizEngine
   - Assignment creation from live sessions
   - Database integration for live results

#### Success Criteria:
- ✅ Teachers can create and control live sessions
- ✅ Students can join and participate in real-time
- ✅ Live leaderboard with speed-based scoring
- ✅ Automatic assignment creation from live sessions

### Phase 5: Advanced Features (Week 5)
**Goal**: Add advanced capabilities and optimizations

#### Tasks:
1. **Advanced Question Selection**
   - Unattempted questions filtering
   - Failed questions retry system
   - Adaptive difficulty selection

2. **Performance Optimizations**
   - Component memoization
   - Lazy loading of question types
   - WebSocket connection pooling

3. **Analytics Enhancement**
   - Detailed performance tracking
   - Learning path recommendations
   - Teacher insights dashboard

#### Success Criteria:
- ✅ Smart question selection algorithms
- ✅ Improved performance and loading times
- ✅ Rich analytics and insights
- ✅ Scalable for large numbers of users

## File Migration Script

### Automated Migration Tool
```bash
#!/bin/bash
# migrate-quiz-files.sh

echo "Starting Quiz File Migration..."

# Create new directory structure
mkdir -p client/src/quiz/{core,components/{individual,orchestration,shared},live,question-types,hooks,types,utils}

# Move individual components
echo "Moving individual quiz components..."
mv client/src/components/content-management/activities/quiz/TopicQuizRunner.tsx client/src/quiz/components/individual/
mv client/src/components/content-management/activities/quiz/QuizView.tsx client/src/quiz/components/individual/
mv client/src/components/content-management/activities/quiz/QuizResults.tsx client/src/quiz/components/individual/
mv client/src/components/content-management/activities/quiz/QuizApp.tsx client/src/quiz/components/individual/
mv client/src/components/content-management/interactions/dialogs/QuizDialog.tsx client/src/quiz/components/individual/

# Move orchestration components
echo "Moving orchestration components..."
mv client/src/features/quiz/components/QuizOrchestrator.tsx client/src/quiz/components/orchestration/
mv client/src/features/quiz/components/QuizInProgress.tsx client/src/quiz/components/orchestration/
mv client/src/features/quiz/components/QuizHome.tsx client/src/quiz/components/orchestration/

# Move question types
echo "Moving question types..."
mv client/src/components/content-management/activities/quiz/question-types/MultipleChoice.tsx client/src/quiz/question-types/MultipleChoice/
mv client/src/components/content-management/activities/quiz/question-types/FillInBlank.tsx client/src/quiz/question-types/FillInBlank/
mv client/src/components/content-management/activities/quiz/question-types/Categorize.tsx client/src/quiz/question-types/Categorize/
mv client/src/components/content-management/activities/quiz/question-types/Matching/ client/src/quiz/question-types/

# Move hooks and types
echo "Moving hooks and types..."
mv client/src/features/quiz/hooks/useQuizLogic.ts client/src/quiz/hooks/
mv client/src/features/quiz/types.ts client/src/quiz/types/quiz.types.ts

# Create index files
echo "Creating index files..."
cat > client/src/quiz/index.ts << 'EOF'
// Main quiz exports
export * from './components';
export * from './hooks';
export * from './types';
export * from './utils';
EOF

cat > client/src/quiz/components/index.ts << 'EOF'
export * from './individual';
export * from './orchestration';
export * from './shared';
EOF

cat > client/src/quiz/components/individual/index.ts << 'EOF'
export { default as TopicQuizRunner } from './TopicQuizRunner';
export { default as QuizView } from './QuizView';
export { default as QuizResults } from './QuizResults';
export { default as QuizApp } from './QuizApp';
export { default as QuizDialog } from './QuizDialog';
EOF

cat > client/src/quiz/components/orchestration/index.ts << 'EOF'
export { default as QuizOrchestrator } from './QuizOrchestrator';
export { default as QuizInProgress } from './QuizInProgress';
export { default as QuizHome } from './QuizHome';
EOF

echo "Quiz file migration completed!"
echo "Next: Run update-imports.sh to fix import statements"
```

### Advanced Import Update Strategies

#### 1. **TypeScript/VSCode Automated Refactoring**
```typescript
// Use VSCode's built-in refactoring capabilities
// 1. Right-click on file in explorer
// 2. Select "Move to..." or use F2 to rename
// 3. VSCode automatically updates all imports

// Or use TypeScript Language Server API
import { LanguageService } from 'typescript';

const updateImportsWithTS = (oldPath: string, newPath: string) => {
  // TypeScript will automatically update imports when files are moved
  // through the language service
};
```

#### 2. **Node.js Import Update Script with AST Parsing**
```javascript
// update-imports-advanced.js
const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const glob = require('glob');

const importMappings = {
  '@/components/content-management/activities/quiz/TopicQuizRunner': '@/quiz/components/individual/TopicQuizRunner',
  '@/components/content-management/activities/quiz/QuizView': '@/quiz/components/individual/QuizView',
  '@/components/content-management/activities/quiz/QuizResults': '@/quiz/components/individual/QuizResults',
  '@/features/quiz/components/QuizOrchestrator': '@/quiz/components/orchestration/QuizOrchestrator',
  '@/features/quiz/components/QuizInProgress': '@/quiz/components/orchestration/QuizInProgress',
  '@/features/quiz/hooks/useQuizLogic': '@/quiz/hooks/useQuizLogic',
  '@/components/content-management/activities/quiz/question-types/MultipleChoice': '@/quiz/question-types/MultipleChoice',
  '@/components/content-management/activities/quiz/question-types/FillInBlank': '@/quiz/question-types/FillInBlank',
  '@/components/content-management/activities/quiz/question-types/Categorize': '@/quiz/question-types/Categorize',
  '@/components/content-management/activities/quiz/question-types/Matching': '@/quiz/question-types/Matching'
};

function updateImportsInFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    });

    traverse(ast, {
      ImportDeclaration(path) {
        const importPath = path.node.source.value;
        if (importMappings[importPath]) {
          path.node.source.value = importMappings[importPath];
          hasChanges = true;
          console.log(`Updated: ${importPath} → ${importMappings[importPath]} in ${filePath}`);
        }
      },
      
      // Handle dynamic imports
      CallExpression(path) {
        if (path.node.callee.type === 'Import' && path.node.arguments[0]) {
          const importPath = path.node.arguments[0].value;
          if (importMappings[importPath]) {
            path.node.arguments[0].value = importMappings[importPath];
            hasChanges = true;
            console.log(`Updated dynamic import: ${importPath} → ${importMappings[importPath]} in ${filePath}`);
          }
        }
      }
    });

    if (hasChanges) {
      const output = generate(ast, {}, code);
      fs.writeFileSync(filePath, output.code);
      console.log(`✅ Updated imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Find all TypeScript/JavaScript files
const files = glob.sync('client/src/**/*.{ts,tsx,js,jsx}', {
  ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
});

console.log(`Found ${files.length} files to process...`);

files.forEach(updateImportsInFile);

console.log('Import update completed!');
```

#### 3. **VSCode Extension for Bulk Import Updates**
```json
// .vscode/settings.json
{
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "javascript.updateImportsOnFileMove.enabled": "always"
}
```

#### 4. **Webpack/Vite Alias Configuration**
```typescript
// vite.config.ts - Add alias during transition
export default defineConfig({
  resolve: {
    alias: {
      '@/quiz': path.resolve(__dirname, './client/src/quiz'),
      // Keep old aliases temporarily for backward compatibility
      '@/components/content-management/activities/quiz': path.resolve(__dirname, './client/src/quiz/components/individual'),
      '@/features/quiz': path.resolve(__dirname, './client/src/quiz'),
    }
  }
});
```

#### 5. **Comprehensive Migration Script with Validation**
```bash
#!/bin/bash
# comprehensive-migration.sh

set -e  # Exit on any error

echo "🚀 Starting Comprehensive Quiz File Migration..."

# Step 1: Create backup
echo "📦 Creating backup..."
mkdir -p backup/$(date +%Y%m%d_%H%M%S)
cp -r client/src/components/content-management/activities/quiz/ backup/$(date +%Y%m%d_%H%M%S)/quiz-activities/
cp -r client/src/features/quiz/ backup/$(date +%Y%m%d_%H%M%S)/quiz-features/
cp -r client/src/components/content-management/interactions/dialogs/QuizDialog.tsx backup/$(date +%Y%m%d_%H%M%S)/

# Step 2: Create new directory structure
echo "📁 Creating new directory structure..."
mkdir -p client/src/quiz/{core,components/{individual,orchestration,shared},live,question-types,hooks,types,utils}

# Step 3: Move files with git to preserve history
echo "📦 Moving files with git history preservation..."
git mv client/src/components/content-management/activities/quiz/TopicQuizRunner.tsx client/src/quiz/components/individual/ 2>/dev/null || mv client/src/components/content-management/activities/quiz/TopicQuizRunner.tsx client/src/quiz/components/individual/
git mv client/src/components/content-management/activities/quiz/QuizView.tsx client/src/quiz/components/individual/ 2>/dev/null || mv client/src/components/content-management/activities/quiz/QuizView.tsx client/src/quiz/components/individual/
git mv client/src/components/content-management/activities/quiz/QuizResults.tsx client/src/quiz/components/individual/ 2>/dev/null || mv client/src/components/content-management/activities/quiz/QuizResults.tsx client/src/quiz/components/individual/
git mv client/src/components/content-management/activities/quiz/QuizApp.tsx client/src/quiz/components/individual/ 2>/dev/null || mv client/src/components/content-management/activities/quiz/QuizApp.tsx client/src/quiz/components/individual/
git mv client/src/components/content-management/interactions/dialogs/QuizDialog.tsx client/src/quiz/components/individual/ 2>/dev/null || mv client/src/components/content-management/interactions/dialogs/QuizDialog.tsx client/src/quiz/components/individual/

git mv client/src/features/quiz/components/QuizOrchestrator.tsx client/src/quiz/components/orchestration/ 2>/dev/null || mv client/src/features/quiz/components/QuizOrchestrator.tsx client/src/quiz/components/orchestration/
git mv client/src/features/quiz/components/QuizInProgress.tsx client/src/quiz/components/orchestration/ 2>/dev/null || mv client/src/features/quiz/components/QuizInProgress.tsx client/src/quiz/components/orchestration/
git mv client/src/features/quiz/components/QuizHome.tsx client/src/quiz/components/orchestration/ 2>/dev/null || mv client/src/features/quiz/components/QuizHome.tsx client/src/quiz/components/orchestration/

# Move question types
mkdir -p client/src/quiz/question-types/{MultipleChoice,FillInBlank,Categorize}
git mv client/src/components/content-management/activities/quiz/question-types/MultipleChoice.tsx client/src/quiz/question-types/MultipleChoice/ 2>/dev/null || mv client/src/components/content-management/activities/quiz/question-types/MultipleChoice.tsx client/src/quiz/question-types/MultipleChoice/
git mv client/src/components/content-management/activities/quiz/question-types/FillInBlank.tsx client/src/quiz/question-types/FillInBlank/ 2>/dev/null || mv client/src/components/content-management/activities/quiz/question-types/FillInBlank.tsx client/src/quiz/question-types/FillInBlank/
git mv client/src/components/content-management/activities/quiz/question-types/Categorize.tsx client/src/quiz/question-types/Categorize/ 2>/dev/null || mv client/src/components/content-management/activities/quiz/question-types/Categorize.tsx client/src/quiz/question-types/Categorize/
git mv client/src/components/content-management/activities/quiz/question-types/Matching/ client/src/quiz/question-types/ 2>/dev/null || mv client/src/components/content-management/activities/quiz/question-types/Matching/ client/src/quiz/question-types/

# Move hooks and types
git mv client/src/features/quiz/hooks/useQuizLogic.ts client/src/quiz/hooks/ 2>/dev/null || mv client/src/features/quiz/hooks/useQuizLogic.ts client/src/quiz/hooks/
git mv client/src/features/quiz/types.ts client/src/quiz/types/quiz.types.ts 2>/dev/null || mv client/src/features/quiz/types.ts client/src/quiz/types/quiz.types.ts

# Step 4: Update imports using Node.js script
echo "🔄 Updating import statements..."
node update-imports-advanced.js

# Step 5: Create index files
echo "📝 Creating index files..."
cat > client/src/quiz/index.ts << 'EOF'
// Main quiz exports
export * from './components';
export * from './hooks';
export * from './types';
export * from './utils';
EOF

cat > client/src/quiz/components/index.ts << 'EOF'
export * from './individual';
export * from './orchestration';
export * from './shared';
EOF

cat > client/src/quiz/components/individual/index.ts << 'EOF'
export { default as TopicQuizRunner } from './TopicQuizRunner';
export { default as QuizView } from './QuizView';
export { default as QuizResults } from './QuizResults';
export { default as QuizApp } from './QuizApp';
export { default as QuizDialog } from './QuizDialog';
EOF

cat > client/src/quiz/components/orchestration/index.ts << 'EOF'
export { default as QuizOrchestrator } from './QuizOrchestrator';
export { default as QuizInProgress } from './QuizInProgress';
export { default as QuizHome } from './QuizHome';
EOF

cat > client/src/quiz/hooks/index.ts << 'EOF'
export { default as useQuizLogic } from './useQuizLogic';
EOF

cat > client/src/quiz/types/index.ts << 'EOF'
export * from './quiz.types';
EOF

# Step 6: Update Vite config for new alias
echo "⚙️ Updating Vite configuration..."
cat >> vite.config.ts << 'EOF'

// Added for quiz migration
resolve: {
  alias: {
    '@/quiz': path.resolve(__dirname, './client/src/quiz'),
  }
}
EOF

# Step 7: Validate the migration
echo "✅ Validating migration..."
npm run build
if [ $? -eq 0 ]; then
  echo "✅ Build successful! Migration completed."
else
  echo "❌ Build failed. Check the errors above."
  exit 1
fi

# Step 8: Run tests
echo "🧪 Running tests..."
npm run test
if [ $? -eq 0 ]; then
  echo "✅ All tests passed!"
else
  echo "⚠️ Some tests failed. Please review."
fi

echo "🎉 Quiz file migration completed successfully!"
echo "📁 All quiz files are now in: client/src/quiz/"
echo "📦 Backup created in: backup/$(date +%Y%m%d_%H%M%S)/"
```

#### 6. **IDE-Specific Solutions**

**For VSCode:**
```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Update Quiz Imports",
      "type": "shell",
      "command": "node",
      "args": ["update-imports-advanced.js"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    }
  ]
}
```

**For WebStorm/IntelliJ:**
- Use "Refactor → Move" (F6)
- Enable "Search for references" and "Search in comments and strings"
- WebStorm will automatically update all imports

#### 7. **Rollback Strategy**
```bash
#!/bin/bash
# rollback-migration.sh

echo "🔄 Rolling back quiz migration..."

# Restore from backup
LATEST_BACKUP=$(ls -t backup/ | head -n1)
echo "Restoring from backup: $LATEST_BACKUP"

# Remove new structure
rm -rf client/src/quiz/

# Restore original files
cp -r backup/$LATEST_BACKUP/quiz-activities/ client/src/components/content-management/activities/quiz/
cp -r backup/$LATEST_BACKUP/quiz-features/ client/src/features/quiz/
cp backup/$LATEST_BACKUP/QuizDialog.tsx client/src/components/content-management/interactions/dialogs/

# Restore original imports (reverse the mappings)
node rollback-imports.js

echo "✅ Rollback completed!"
```

### Benefits of Advanced Import Management:

#### 1. **Accuracy & Safety**
- ✅ AST parsing ensures syntactically correct updates
- ✅ Preserves code formatting and comments
- ✅ Handles both static and dynamic imports
- ✅ Validates changes before applying

#### 2. **Efficiency**
- ✅ Processes hundreds of files in seconds
- ✅ Automatic detection of import patterns
- ✅ Batch processing with progress tracking
- ✅ Git history preservation

#### 3. **Reliability**
- ✅ Comprehensive backup strategy
- ✅ Build validation after migration
- ✅ Test execution verification
- ✅ Easy rollback mechanism

#### 4. **IDE Integration**
- ✅ Works with VSCode, WebStorm, and other IDEs
- ✅ Leverages built-in refactoring tools
- ✅ Maintains IntelliSense and auto-completion
- ✅ Preserves type checking

## Risk Mitigation Strategies

### 1. File Migration Safety
```bash
# Create backup before migration
cp -r client/src/components/content-management/activities/quiz/ backup/quiz-components-backup/
cp -r client/src/features/quiz/ backup/quiz-features-backup/

# Test after each major move
npm run build
npm run test
```

### 2. Backward Compatibility
```typescript
// Keep legacy components as fallbacks
const QuizView_Legacy = QuizView;
const QuizView = (props) => {
  const useNewEngine = useFeatureFlag('unifiedQuizEngine');
  return useNewEngine ? <QuizEngineAdapter {...props} /> : <QuizView_Legacy {...props} />;
};
```

### 3. Feature Flags
```typescript
const useFeatureFlags = () => ({
  centralizedQuizStructure: process.env.NODE_ENV === 'development',
  unifiedQuizEngine: process.env.NODE_ENV === 'development',
  liveQuizzes: true,
  unattemptedQuestions: true,
  twoOptionQuizzes: true
});
```

### 4. Gradual Rollout
```typescript
// Test with specific topics first
const shouldUseNewEngine = (topicId) => {
  const testTopics = ['math-101', 'science-basics'];
  return testTopics.includes(topicId);
};
```

### 5. Monitoring & Rollback
- Comprehensive error logging
- Performance monitoring
- Quick rollback mechanisms
- A/B testing capabilities

## Database Schema Extensions

### Live Quiz Sessions
```sql
CREATE TABLE live_quiz_sessions (
  id VARCHAR(255) PRIMARY KEY,
  teacher_id VARCHAR(255) NOT NULL,
  topic_id VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  status ENUM('waiting', 'active', 'completed') DEFAULT 'waiting',
  current_question_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP NULL,
  ended_at TIMESTAMP NULL
);

CREATE TABLE live_quiz_participants (
  session_id VARCHAR(255),
  student_id VARCHAR(255),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  score INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  total_answers INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  PRIMARY KEY (session_id, student_id)
);

CREATE TABLE live_quiz_answers (
  id VARCHAR(255) PRIMARY KEY,
  session_id VARCHAR(255),
  question_id VARCHAR(255),
  student_id VARCHAR(255),
  answer TEXT,
  is_correct BOOLEAN,
  response_time INT, -- milliseconds
  score_earned INT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Extensions

### Live Quiz Endpoints
```typescript
// Create live session
POST /api/live-quiz/sessions
{
  "teacherId": "teacher-123",
  "topicId": "math-101",
  "title": "Math Quiz Live Session"
}

// Join session
POST /api/live-quiz/sessions/:sessionId/join
{
  "studentId": "student-456"
}

// Start question
POST /api/live-quiz/sessions/:sessionId/questions/:questionId/start

// Submit answer
POST /api/live-quiz/sessions/:sessionId/answers
{
  "questionId": "q-789",
  "studentId": "student-456",
  "answer": "option-a",
  "responseTime": 5000
}

// Get leaderboard
GET /api/live-quiz/sessions/:sessionId/leaderboard
```

## Testing Strategy

### Unit Tests
- Individual component testing
- Hook testing with mock data
- Question type component testing
- Utility function testing

### Integration Tests
- QuizEngine with different configurations
- Database operations
- WebSocket communication
- API endpoint testing

### End-to-End Tests
- Complete quiz flows
- Live session scenarios
- Assignment creation
- Cross-browser compatibility

## Performance Considerations

### Frontend Optimizations
- React.memo for question components
- useMemo for expensive calculations
- Lazy loading of question types
- Virtual scrolling for large leaderboards

### Backend Optimizations
- WebSocket connection pooling
- Database query optimization
- Caching for frequently accessed data
- Rate limiting for API endpoints

### Scalability
- Horizontal scaling for WebSocket servers
- Database sharding for large datasets
- CDN for static assets
- Load balancing for high traffic

## Maintenance & Documentation

### Code Documentation
- Comprehensive TypeScript interfaces
- JSDoc comments for all public APIs
- Architecture decision records (ADRs)
- Component usage examples

### Developer Experience
- Clear migration guides
- Development setup instructions
- Debugging tools and utilities
- Performance monitoring dashboards

## Success Metrics

### Technical Metrics
- Zero breaking changes during migration
- 100% backward compatibility maintained
- <100ms response time for quiz operations
- 99.9% uptime for live sessions

### User Experience Metrics
- Improved quiz loading times
- Higher engagement in live sessions
- Reduced teacher setup time
- Increased student participation

### Business Metrics
- Increased quiz completion rates
- Higher student satisfaction scores
- Reduced support tickets
- Improved learning outcomes

## Conclusion

This unified architecture provides a comprehensive solution that:

1. **Preserves all existing functionality** while adding powerful new features
2. **Enables safe, gradual migration** with zero downtime
3. **Supports multiple quiz modes** (individual, live, assignment) through a single system
4. **Provides Quizizz-style live features** with real-time leaderboards and teacher controls
5. **Maintains backward compatibility** with all current database schemas and APIs
6. **Offers infinite extensibility** through configuration-driven architecture

The phased implementation approach ensures minimal risk while delivering maximum value, allowing the system to evolve from scattered components into a unified, powerful quiz platform.
