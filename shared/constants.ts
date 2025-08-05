
export const PAGINATION = {
  ITEMS_PER_PAGE: 10,
  MAX_PAGES_SHOWN: 5
} as const;

export const GRADING = {
  BASE_SCORE: 70,
  WORD_COUNT_BONUS: {
    HIGH: 10,    // 300+ words
    MEDIUM: 5    // 200+ words
  },
  STRUCTURE_BONUS: 10,
  BODY_PARAGRAPHS_BONUS: 5,
  MIN_SCORE: 0,
  MAX_SCORE: 100
} as const;

export const ESSAY_REQUIREMENTS = {
  MIN_WORDS_ESSAY: 100,
  MIN_WORDS_STORY: 50,
  RECOMMENDED_WORDS: 300
} as const;

export const ADMIN_USER_ID = 'GV0002' as const;

export const TIMER_DEFAULTS = {
  OUTLINE_MINUTES: 15,
  ESSAY_MINUTES: 45
} as const;
