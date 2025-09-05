// Core Components
export { GroupCard } from './core/cards/GroupCard';
export { RegularContentCard as ContentCard } from './core/cards/ContentCard';
export { SubtopicContentCard as SubtopicCard } from './core/cards/SubtopicCard';
export { GroupExpansion } from './core/cards/GroupExpansion';
export { SubtopicGroupCard } from './core/cards/SubtopicGroupCard';
export { default as TopicCard } from './core/cards/TopicCard';

export { TopicsGrid } from './core/displays/TopicsGrid';
export { TopicListItem } from './core/displays/TopicListItem';
export { ContentThumbnailGallery } from './core/displays/ContentThumbnailGallery';
export { TopicGroupedContentDisplay as GroupContentDisplay } from './core/displays/GroupContentDisplay';
export { TopicGroupedContentDisplay as GroupContentCard } from './core/displays/GroupContentCard';
export { ChallengeSubjectGrid } from './core/displays/ChallengeSubjectGrid';

export { DesktopContentLayout as DesktopLayout } from './core/layouts/DesktopLayout';
export { MobileContentLayout as MobileLayout } from './core/layouts/MobileLayout';

export { ContentEditor } from './core/editors/ContentEditor';

// Interactions
export { ContentVideoDialog } from './interactions/dialogs/ContentVideoDialog';
export { PersonalNoteDialog } from './interactions/dialogs/PersonalNoteDialog';
export { ActionMenuDialog } from './interactions/dialogs/ActionMenuDialog';
export { QuizDialog } from '@/quiz/components/shared';
export { VideoDialog } from './interactions/dialogs/VideoDialog';

export { ContentActionButtons } from './interactions/actions/ContentActionButtons';
export { ResponsiveActionButtons } from './interactions/actions/ResponsiveActionButtons';

export { default as ContentPopup } from './interactions/popups/ContentPopup';
export { MatchingActivityPopup } from './interactions/popups/MatchingActivityPopup';
export { default as MatchingListPopup } from './interactions/popups/MatchingListPopup';

export { SimpleContentProgressPanel } from './interactions/progress/SimpleContentProgressPanel';

// Activities - Quiz components now imported from @/quiz module
export { QuizApp, QuizView, QuizResults, TopicQuizRunner } from '@/quiz/components/individual';
export { MultipleChoice, FillInBlank, Categorize, Matching } from '@/quiz/question-types';

export { MatchingActivityTracker } from './activities/matching/MatchingActivityTracker';
export { ParentTopicMatchingButton } from './activities/matching/buttons/ParentTopicMatchingButton';
export { SubtopicMatchingButton } from './activities/matching/buttons/SubtopicMatchingButton';

export { NoteButton as PersonalNoteButton, PersonalNoteContent } from './activities/personal/PersonalNoteButton';
export { PersonalContentPanel } from './activities/personal/PersonalContentPanel';
export { PersonalNotesDropdown } from './activities/personal/PersonalNotesDropdown';

// Hooks
export { useContentCardLogic } from './hooks/useContentCardLogic';

// Utils
export { getCardClassName } from './utils/contentCardUtils';
