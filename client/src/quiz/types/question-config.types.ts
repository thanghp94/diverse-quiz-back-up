/**
 * Question Configuration Types for Enhanced Question Components
 * Provides unified configuration interface for all question types
 */

export interface BaseQuestionConfig {
  // Display options
  showHints?: boolean;
  allowPartialCredit?: boolean;
  randomizeOptions?: boolean;
  showProgress?: boolean;
  
  // Accessibility
  ariaLabels?: {
    question?: string;
    options?: string;
    submit?: string;
    hint?: string;
  };
  
  // Visual styling
  theme?: 'default' | 'compact' | 'card' | 'minimal';
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange';
  
  // Behavior
  autoSubmit?: boolean;
  confirmBeforeSubmit?: boolean;
  showFeedback?: boolean;
  
  // Scoring
  pointValue?: number;
  partialCreditRules?: PartialCreditRule[];
}

export interface PartialCreditRule {
  condition: string; // e.g., "50% correct", "close_match", "partial_answer"
  points: number; // percentage of full points (0-1)
  feedback?: string;
}

// Multiple Choice Configuration
export interface MultipleChoiceConfig extends BaseQuestionConfig {
  type: 'multiple-choice';
  
  // Option display
  optionCount?: 2 | 3 | 4 | 'dynamic'; // 2 for True/False
  optionLayout?: 'vertical' | 'horizontal' | 'grid';
  
  // True/False mode
  truefalseMode?: boolean;
  truefalseLabels?: {
    true: string;
    false: string;
  };
  
  // Randomization
  randomizeOptions?: boolean;
  excludeFromRandomization?: number[]; // indices to keep in place
  
  // Visual enhancements
  showLetters?: boolean; // A, B, C, D
  highlightCorrect?: boolean;
  showExplanation?: boolean;
}

// Fill in Blank Configuration
export interface FillInBlankConfig extends BaseQuestionConfig {
  type: 'fill-in-blank';
  
  // Input types for each blank
  inputTypes?: FillInBlankInputType[];
  
  // Validation
  caseSensitive?: boolean;
  trimWhitespace?: boolean;
  allowSynonyms?: boolean;
  
  // Hints
  hintSystem?: {
    enabled: boolean;
    hintTypes: ('character_count' | 'first_letter' | 'word_length' | 'custom')[];
    maxHints?: number;
    penaltyPerHint?: number; // percentage reduction
  };
  
  // Partial credit
  partialMatching?: {
    enabled: boolean;
    threshold?: number; // similarity threshold (0-1)
    algorithm?: 'levenshtein' | 'fuzzy' | 'contains';
  };
}

export interface FillInBlankInputType {
  type: 'text' | 'number' | 'email' | 'url' | 'date' | 'dropdown' | 'textarea';
  placeholder?: string;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string; // regex pattern
    min?: number; // for number inputs
    max?: number; // for number inputs
  };
  options?: string[]; // for dropdown type
  hint?: string;
}

// Matching Configuration
export interface MatchingConfig extends BaseQuestionConfig {
  type: 'matching';
  
  // Layout
  layout?: 'side-by-side' | 'top-bottom' | 'grid';
  
  // Drag and drop
  dragAndDrop?: {
    enabled: boolean;
    visualFeedback?: boolean;
    snapToGrid?: boolean;
    returnToOrigin?: boolean; // if dropped in invalid area
  };
  
  // Alternative input methods
  alternativeInput?: {
    clickToMatch?: boolean;
    keyboardNavigation?: boolean;
    touchFriendly?: boolean;
  };
  
  // Randomization
  randomizeLeft?: boolean;
  randomizeRight?: boolean;
  
  // Visual enhancements
  showConnections?: boolean;
  animateMatches?: boolean;
  highlightOnHover?: boolean;
}

// Categorize Configuration
export interface CategorizeConfig extends BaseQuestionConfig {
  type: 'categorize';
  
  // Categories
  categoryLayout?: 'horizontal' | 'vertical' | 'grid';
  maxItemsPerCategory?: number;
  
  // Drag and drop
  dragAndDrop?: {
    enabled: boolean;
    multiSelect?: boolean;
    visualFeedback?: boolean;
    snapToCategory?: boolean;
  };
  
  // Validation
  requireAllCategories?: boolean;
  allowEmptyCategories?: boolean;
  
  // Visual
  showCategoryLabels?: boolean;
  highlightCategories?: boolean;
  showItemCount?: boolean;
}

// Union type for all question configurations
export type QuestionConfig = 
  | MultipleChoiceConfig 
  | FillInBlankConfig 
  | MatchingConfig 
  | CategorizeConfig;

// Configuration factory functions
export const createMultipleChoiceConfig = (
  overrides: Partial<MultipleChoiceConfig> = {}
): MultipleChoiceConfig => ({
  type: 'multiple-choice',
  optionCount: 4,
  optionLayout: 'vertical',
  showLetters: true,
  randomizeOptions: false,
  showHints: false,
  allowPartialCredit: false,
  showFeedback: true,
  theme: 'default',
  colorScheme: 'blue',
  ...overrides,
});

export const createTrueFalseConfig = (
  overrides: Partial<MultipleChoiceConfig> = {}
): MultipleChoiceConfig => ({
  type: 'multiple-choice',
  optionCount: 2,
  truefalseMode: true,
  truefalseLabels: {
    true: 'True',
    false: 'False',
  },
  optionLayout: 'horizontal',
  showLetters: false,
  randomizeOptions: false,
  showHints: false,
  allowPartialCredit: false,
  showFeedback: true,
  theme: 'default',
  colorScheme: 'green',
  ...overrides,
});

export const createFillInBlankConfig = (
  overrides: Partial<FillInBlankConfig> = {}
): FillInBlankConfig => ({
  type: 'fill-in-blank',
  caseSensitive: false,
  trimWhitespace: true,
  allowSynonyms: false,
  showHints: false,
  allowPartialCredit: true,
  partialMatching: {
    enabled: true,
    threshold: 0.8,
    algorithm: 'fuzzy',
  },
  theme: 'default',
  colorScheme: 'purple',
  ...overrides,
});

export const createMatchingConfig = (
  overrides: Partial<MatchingConfig> = {}
): MatchingConfig => ({
  type: 'matching',
  layout: 'side-by-side',
  dragAndDrop: {
    enabled: true,
    visualFeedback: true,
    snapToGrid: false,
    returnToOrigin: true,
  },
  alternativeInput: {
    clickToMatch: true,
    keyboardNavigation: true,
    touchFriendly: true,
  },
  randomizeLeft: false,
  randomizeRight: true,
  showConnections: true,
  animateMatches: true,
  showHints: false,
  allowPartialCredit: true,
  theme: 'default',
  colorScheme: 'orange',
  ...overrides,
});

export const createCategorizeConfig = (
  overrides: Partial<CategorizeConfig> = {}
): CategorizeConfig => ({
  type: 'categorize',
  categoryLayout: 'horizontal',
  dragAndDrop: {
    enabled: true,
    multiSelect: false,
    visualFeedback: true,
    snapToCategory: true,
  },
  requireAllCategories: false,
  allowEmptyCategories: true,
  showCategoryLabels: true,
  highlightCategories: true,
  showItemCount: true,
  showHints: false,
  allowPartialCredit: true,
  theme: 'default',
  colorScheme: 'blue',
  ...overrides,
});

// Default configurations for each question type
export const DEFAULT_QUESTION_CONFIGS = {
  'multiple-choice': createMultipleChoiceConfig(),
  'true-false': createTrueFalseConfig(),
  'fill-in-blank': createFillInBlankConfig(),
  'matching': createMatchingConfig(),
  'categorize': createCategorizeConfig(),
} as const;

// Type guards
export const isMultipleChoiceConfig = (config: QuestionConfig): config is MultipleChoiceConfig => {
  return config.type === 'multiple-choice';
};

export const isFillInBlankConfig = (config: QuestionConfig): config is FillInBlankConfig => {
  return config.type === 'fill-in-blank';
};

export const isMatchingConfig = (config: QuestionConfig): config is MatchingConfig => {
  return config.type === 'matching';
};

export const isCategorizeConfig = (config: QuestionConfig): config is CategorizeConfig => {
  return config.type === 'categorize';
};

// Configuration validation
export const validateQuestionConfig = (config: QuestionConfig): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Base validation
  if (!config.type) {
    errors.push('Question type is required');
  }
  
  // Type-specific validation
  switch (config.type) {
    case 'multiple-choice':
      if (config.optionCount && ![2, 3, 4, 'dynamic'].includes(config.optionCount)) {
        errors.push('Invalid option count for multiple choice');
      }
      if (config.truefalseMode && config.optionCount !== 2) {
        errors.push('True/False mode requires exactly 2 options');
      }
      break;
      
    case 'fill-in-blank':
      if (config.partialMatching?.threshold && (config.partialMatching.threshold < 0 || config.partialMatching.threshold > 1)) {
        errors.push('Partial matching threshold must be between 0 and 1');
      }
      break;
      
    case 'matching':
      // Add matching-specific validation
      break;
      
    case 'categorize':
      // Add categorize-specific validation
      break;
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};
