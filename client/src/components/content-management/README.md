# Content Management System

This directory contains a unified content management system that consolidates previously scattered components from `topics/`, `content/`, `quiz/`, `matching/`, and `personal/` directories.

## Directory Structure

```
content-management/
├── core/                    # Core content components
│   ├── cards/              # Content card components
│   │   ├── GroupCard.tsx           # Group card with image gallery
│   │   ├── ContentCard.tsx         # Regular content card (RegularContentCard)
│   │   ├── SubtopicCard.tsx        # Subtopic content card
│   │   └── GroupExpansion.tsx      # Group expansion component
│   ├── displays/           # Display and layout components
│   │   ├── TopicsGrid.tsx          # Grid layout for topics
│   │   ├── TopicListItem.tsx       # Individual topic list items
│   │   ├── ContentThumbnailGallery.tsx # Image gallery component
│   │   └── GroupContentDisplay.tsx # Group content display logic
│   ├── layouts/            # Layout components
│   │   ├── DesktopLayout.tsx       # Desktop-specific layouts
│   │   └── MobileLayout.tsx        # Mobile-specific layouts
│   └── editors/            # Content editing components
│       └── ContentEditor.tsx       # Content editor for admins
├── interactions/           # User interaction components
│   ├── dialogs/           # Modal dialogs
│   │   ├── ContentVideoDialog.tsx  # Video playback dialog
│   │   ├── PersonalNoteDialog.tsx  # Personal notes dialog
│   │   └── ActionMenuDialog.tsx    # Action menu dialog
│   ├── actions/           # Action buttons and controls
│   │   ├── ContentActionButtons.tsx # Content action buttons
│   │   └── ResponsiveActionButtons.tsx # Responsive action buttons
│   ├── popups/            # Popup components
│   │   ├── ContentPopup.tsx        # Main content popup
│   │   └── MatchingActivityPopup.tsx # Matching activity popup
│   └── progress/          # Progress tracking components
│       └── SimpleContentProgressPanel.tsx # Progress panel
├── activities/            # Learning activities
│   ├── quiz/             # Quiz-related components
│   │   ├── QuizApp.tsx            # Main quiz application
│   │   ├── QuizView.tsx           # Quiz view component
│   │   ├── QuizResults.tsx        # Quiz results display
│   │   └── question-types/        # Different question types
│   │       ├── MultipleChoice.tsx
│   │       ├── FillInBlank.tsx
│   │       ├── Categorize.tsx
│   │       └── Matching.tsx
│   ├── matching/         # Matching activities
│   │   ├── MatchingActivityTracker.tsx # Activity tracking
│   │   └── buttons/              # Matching buttons
│   │       ├── ParentTopicMatchingButton.tsx
│   │       └── SubtopicMatchingButton.tsx
│   └── personal/         # Personal learning features
│       └── PersonalNoteButton.tsx # Personal notes functionality
├── hooks/                # Custom hooks
│   └── useContentCardLogic.ts     # Content card logic hook
├── utils/                # Utility functions
│   └── contentCardUtils.ts        # Content card utilities
├── states/               # State management (future use)
└── index.ts             # Main exports file
```

## Key Components

### Core Components

- **GroupCard**: Displays group cards with image galleries, titles, and descriptions
- **ContentCard**: Regular content cards for individual content items
- **SubtopicCard**: Cards for subtopic content with expansion capabilities
- **TopicsGrid**: Grid layout for displaying multiple topics
- **ContentThumbnailGallery**: Image gallery component for group cards

### Interaction Components

- **ContentPopup**: Main content viewing popup with media support
- **ContentVideoDialog**: Video playback in modal dialogs
- **PersonalNoteDialog**: Personal note-taking functionality
- **ContentActionButtons**: Action buttons for content interactions

### Activity Components

- **Quiz System**: Complete quiz functionality with multiple question types
- **Matching Activities**: Matching games and activities
- **Personal Notes**: Personal learning notes and annotations

## Usage

Import components from the main index file:

```typescript
import {
  GroupCard,
  ContentCard,
  TopicsGrid,
  ContentPopup,
  QuizApp,
  PersonalNoteButton
} from '@/components/content-management';
```

## Migration Notes

This structure consolidates components from:
- `client/src/components/topics/` → `core/` and `interactions/`
- `client/src/components/content/` → `core/` and `interactions/`
- `client/src/components/quiz/` → `activities/quiz/`
- `client/src/components/matching/` → `activities/matching/`
- `client/src/components/personal/` → `activities/personal/`

## Benefits

1. **Unified Structure**: All content-related components in one place
2. **Logical Organization**: Components grouped by functionality
3. **Reduced Redundancy**: Eliminates duplicate components
4. **Better Maintainability**: Easier to find and update components
5. **Cleaner Imports**: Single import source for content management
6. **Scalability**: Easy to add new content management features

## Future Enhancements

- State management in `states/` directory
- Additional activity types
- Enhanced interaction components
- Performance optimizations
- Component composition patterns
