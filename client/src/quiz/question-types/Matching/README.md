# Matching Component Refactoring

This directory contains the refactored Matching component that has been broken down into smaller, more maintainable pieces.

## Structure

```
Matching/
├── index.ts                    # Main exports
├── Matching.tsx               # Main component (orchestrator)
├── README.md                  # This file
├── components/
│   ├── MatchingHeader.tsx     # Header with title and controls
│   ├── DraggableItem.tsx      # Individual draggable items
│   └── DropZone.tsx           # Drop zones for matching
└── hooks/
    └── useMatching.ts         # Custom hook with all matching logic
```

## Components

### Matching.tsx
The main orchestrator component that:
- Uses the `useMatching` hook for all logic
- Renders the header and main content areas
- Maps over items to render `DraggableItem` and `DropZone` components

### MatchingHeader.tsx
Handles the header section including:
- Activity title display
- Close button
- Check Results button
- Next Phase/Activity buttons
- Progress indicators

### DraggableItem.tsx
Renders individual draggable items with:
- Image or text content
- Drag and drop functionality
- Visual feedback for correct/incorrect states
- Responsive styling based on content type

### DropZone.tsx
Renders drop zones for matching with:
- Target content (images or text)
- Matched item display
- Drop indicators and visual feedback
- Support for different matching types

### useMatching.ts
Custom hook that encapsulates all matching logic:
- State management (matches, drag state, results)
- Drag and drop handlers
- Result checking logic
- Text styling utilities
- Image detection utilities

## Benefits of Refactoring

1. **Separation of Concerns**: Logic is separated from presentation
2. **Reusability**: Components can be reused in different contexts
3. **Maintainability**: Easier to modify individual pieces
4. **Testing**: Each component can be tested in isolation
5. **Performance**: Better optimization opportunities
6. **Type Safety**: Improved TypeScript support

## Usage

```tsx
import { Matching } from './components/content-management/activities/quiz/question-types/Matching';

// Use the component as before - the API remains the same
<Matching
  question={question}
  onAnswer={handleAnswer}
  currentQuizPhase={phase}
  onNextPhase={handleNextPhase}
  // ... other props
/>
```

## Migration Notes

- The main `Matching` component API remains unchanged
- All existing functionality is preserved
- TypeScript types have been improved
- Performance optimizations have been added
- The component is now more modular and maintainable
