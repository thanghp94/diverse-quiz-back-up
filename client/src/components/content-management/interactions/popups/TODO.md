# ContentPopup Refactor Plan

## Overview
Refactor the large `ContentPopup.tsx` component into smaller, more manageable subcomponents to improve maintainability, readability, and reusability.

## Current Issues
- Large component with multiple responsibilities (content display, media handling, quiz integration, modals)
- Complex state management for multiple modals
- Inline event handlers and complex JSX
- Mixed concerns (UI rendering and business logic)

## Refactor Steps

### 1. Extract ContentMedia Component
- **File**: `client/src/components/content-management/interactions/popups/ContentMedia.tsx`
- **Purpose**: Handle image display, video embedding, and modal management
- **Props**: content, videoData, video2Data, videoEmbedUrl, video2EmbedUrl
- **State**: isImageModalOpen, isVideoModalOpen, modalVideoUrl

### 2. Extract ContentControls Component
- **File**: `client/src/components/content-management/interactions/popups/ContentControls.tsx`
- **Purpose**: Navigation buttons, quiz start buttons, rating buttons
- **Props**: currentIndex, contentList, onContentChange, startQuiz, contentId

### 3. Extract ContentDetails Component
- **File**: `client/src/components/content-management/interactions/popups/ContentDetails.tsx`
- **Purpose**: Title, description, short blurbs, collapsible sections
- **Props**: content, isSecondBlurbOpen, setIsSecondBlurbOpen

### 4. Extract ContentEditorSection Component
- **File**: `client/src/components/content-management/interactions/popups/ContentEditorSection.tsx`
- **Purpose**: Admin-only content editor with collapsible interface
- **Props**: content, onContentChange, user

### 5. Update Main ContentPopup Component
- **File**: `client/src/components/content-management/interactions/popups/ContentPopup.tsx`
- **Purpose**: Main layout and composition of subcomponents
- **Changes**: Remove extracted code, use new subcomponents, simplify state management

## Implementation Order
1. ✅ Create TODO.md file
2. ⏳ Create ContentMedia component
3. ⏳ Create ContentControls component
4. ⏳ Create ContentDetails component
5. ⏳ Create ContentEditorSection component
6. ⏳ Update main ContentPopup component
7. ⏳ Test and verify functionality
8. ⏳ Clean up and optimize

## Benefits After Refactor
- Smaller, focused components
- Better separation of concerns
- Easier testing and maintenance
- Improved code reusability
- Reduced complexity in main component
