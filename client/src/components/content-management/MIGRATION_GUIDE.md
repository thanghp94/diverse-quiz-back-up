# Migration Guide: Content Management System

This guide helps you update import paths from the old scattered structure to the new unified content-management system.

## Import Path Changes

### Core Components

**Old Imports:**
```typescript
import { GroupCard } from '@/components/topics/content-card/GroupCard';
import { RegularContentCard } from '@/components/topics/content-card/RegularContentCard';
import { SubtopicContentCard } from '@/components/topics/SubtopicContentCard';
import { TopicsGrid } from '@/components/topics/TopicsGrid';
import { TopicListItem } from '@/components/topics/TopicListItem';
import { ContentThumbnailGallery } from '@/components/content/ContentThumbnailGallery';
import { ContentEditor } from '@/components/content/ContentEditor';
```

**New Imports:**
```typescript
import {
  GroupCard,
  ContentCard,           // was RegularContentCard
  SubtopicCard,         // was SubtopicContentCard
  TopicsGrid,
  TopicListItem,
  ContentThumbnailGallery,
  ContentEditor
} from '@/components/content-management';
```

### Interaction Components

**Old Imports:**
```typescript
import { ContentVideoDialog } from '@/components/topics/content-card/ContentVideoDialog';
import { PersonalNoteDialog } from '@/components/topics/content-card/PersonalNoteDialog';
import { ActionMenuDialog } from '@/components/topics/ActionMenuDialog';
import { ContentActionButtons } from '@/components/topics/ContentActionButtons';
import { ContentPopup } from '@/components/content/ContentPopup';
```

**New Imports:**
```typescript
import {
  ContentVideoDialog,
  PersonalNoteDialog,
  ActionMenuDialog,
  ContentActionButtons,
  ContentPopup
} from '@/components/content-management';
```

### Activity Components

**Old Imports:**
```typescript
import { QuizApp } from '@/components/quiz/QuizApp';
import { QuizView } from '@/components/quiz/QuizView';
import { MultipleChoice } from '@/components/quiz/MultipleChoice';
import { MatchingActivityTracker } from '@/components/matching/MatchingActivityTracker';
import { PersonalNoteButton } from '@/components/personal/PersonalNoteButton';
```

**New Imports:**
```typescript
import {
  QuizApp,
  QuizView,
  MultipleChoice,
  MatchingActivityTracker,
  PersonalNoteButton
} from '@/components/content-management';
```

### Hooks and Utils

**Old Imports:**
```typescript
import { useContentCardLogic } from '@/components/topics/hooks/useContentCardLogic';
import { getCardClassName } from '@/components/topics/utils/contentCardUtils';
```

**New Imports:**
```typescript
import {
  useContentCardLogic,
  getCardClassName
} from '@/components/content-management';
```

## Component Name Changes

Some components have been renamed for consistency:

| Old Name | New Name | Reason |
|----------|----------|---------|
| `RegularContentCard` | `ContentCard` | Simpler, more intuitive name |
| `SubtopicContentCard` | `SubtopicCard` | Shorter, consistent naming |
| `TopicGroupedContentDisplay` | `GroupContentDisplay` | Cleaner name |
| `DesktopContentLayout` | `DesktopLayout` | Shorter name |
| `MobileContentLayout` | `MobileLayout` | Shorter name |

## Files to Update

Search for these import patterns in your codebase and update them:

### Search Patterns:
```bash
# Find old topic imports
grep -r "from.*@/components/topics" client/src/

# Find old content imports  
grep -r "from.*@/components/content" client/src/

# Find old quiz imports
grep -r "from.*@/components/quiz" client/src/

# Find old matching imports
grep -r "from.*@/components/matching" client/src/

# Find old personal imports
grep -r "from.*@/components/personal" client/src/
```

### Common Files to Check:
- `client/src/pages/Topics.tsx`
- `client/src/pages/Content.tsx`
- `client/src/components/topics/TopicListItem.tsx`
- `client/src/components/topics/SubtopicContentCard.tsx`
- Any files importing from the old structure

## Step-by-Step Migration

1. **Identify Usage**: Find all files importing from old paths
2. **Update Imports**: Replace with new unified imports
3. **Update Component Names**: Change renamed components
4. **Test**: Ensure all imports resolve correctly
5. **Clean Up**: Remove old files once migration is complete

## Example Migration

**Before:**
```typescript
import { GroupCard } from '@/components/topics/content-card/GroupCard';
import { RegularContentCard } from '@/components/topics/content-card/RegularContentCard';
import { ContentPopup } from '@/components/content/ContentPopup';
import { QuizApp } from '@/components/quiz/QuizApp';

function MyComponent() {
  return (
    <div>
      <GroupCard {...props} />
      <RegularContentCard {...props} />
      <ContentPopup {...props} />
      <QuizApp {...props} />
    </div>
  );
}
```

**After:**
```typescript
import {
  GroupCard,
  ContentCard,
  ContentPopup,
  QuizApp
} from '@/components/content-management';

function MyComponent() {
  return (
    <div>
      <GroupCard {...props} />
      <ContentCard {...props} />
      <ContentPopup {...props} />
      <QuizApp {...props} />
    </div>
  );
}
```

## Benefits After Migration

1. **Cleaner Imports**: Single import source for all content components
2. **Better Organization**: Logical grouping of related components
3. **Reduced Redundancy**: No more duplicate components
4. **Easier Maintenance**: All content management in one place
5. **Better Discoverability**: Clear structure for finding components

## Troubleshooting

### Common Issues:

1. **Export Not Found**: Check if component name changed (see table above)
2. **Module Not Found**: Ensure you're importing from `@/components/content-management`
3. **Type Errors**: Some prop interfaces may have been updated

### Getting Help:

- Check the main `README.md` for component documentation
- Look at the `index.ts` file for available exports
- Review component files for prop interfaces
