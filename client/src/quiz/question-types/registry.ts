/**
 * Question Type Registry System
 * Provides dynamic loading and configuration validation for question types
 */

import { QuestionConfig, validateQuestionConfig } from '@/quiz/types/question-config.types';
import { Question } from '@/quiz/types';

// Question type component interface
export interface QuestionTypeComponent {
  component: React.ComponentType<any>;
  config: QuestionConfig;
  validate?: (question: Question) => { valid: boolean; errors: string[] };
}

// Registry storage
const questionTypeRegistry = new Map<string, QuestionTypeComponent>();

/**
 * Register a question type component
 */
export const registerQuestionType = (
  type: string,
  component: React.ComponentType<any>,
  defaultConfig: QuestionConfig,
  validator?: (question: Question) => { valid: boolean; errors: string[] }
) => {
  questionTypeRegistry.set(type, {
    component,
    config: defaultConfig,
    validate: validator,
  });
};

/**
 * Get a registered question type
 */
export const getQuestionType = (type: string): QuestionTypeComponent | undefined => {
  return questionTypeRegistry.get(type);
};

/**
 * Get all registered question types
 */
export const getAllQuestionTypes = (): Map<string, QuestionTypeComponent> => {
  return new Map(questionTypeRegistry);
};

/**
 * Check if a question type is registered
 */
export const isQuestionTypeRegistered = (type: string): boolean => {
  return questionTypeRegistry.has(type);
};

/**
 * Validate a question against its type requirements
 */
export const validateQuestion = (question: Question, config?: Partial<QuestionConfig>) => {
  const questionType = getQuestionType(question.type);
  
  if (!questionType) {
    return {
      valid: false,
      errors: [`Question type "${question.type}" is not registered`],
    };
  }
  
  // Validate configuration if provided
  if (config) {
    const mergedConfig = { ...questionType.config, ...config };
    const configValidation = validateQuestionConfig(mergedConfig);
    
    if (!configValidation.valid) {
      return configValidation;
    }
  }
  
  // Run type-specific validation if available
  if (questionType.validate) {
    return questionType.validate(question);
  }
  
  return { valid: true, errors: [] };
};

/**
 * Dynamic component loader with error handling
 */
export const loadQuestionComponent = async (type: string) => {
  try {
    switch (type) {
      case 'multiple-choice':
        const MultipleChoiceModule = await import('./MultipleChoice/MultipleChoice');
        return MultipleChoiceModule.default;
      
      case 'fill-in-blank':
        const FillInBlankModule = await import('./FillInBlank/FillInBlank');
        return FillInBlankModule.default;
      
      case 'matching':
        const { default: Matching } = await import('./Matching/Matching');
        return Matching;
      
      case 'categorize':
        const { default: Categorize } = await import('./Categorize');
        return Categorize;
      
      default:
        throw new Error(`Unknown question type: ${type}`);
    }
  } catch (error) {
    console.error(`Failed to load question component for type "${type}":`, error);
    throw error;
  }
};

/**
 * Get component with fallback
 */
export const getQuestionComponent = async (type: string) => {
  const registeredType = getQuestionType(type);
  
  if (registeredType) {
    return registeredType.component;
  }
  
  // Try dynamic loading as fallback
  try {
    return await loadQuestionComponent(type);
  } catch (error) {
    console.error(`Failed to get component for question type "${type}":`, error);
    return null;
  }
};

/**
 * Initialize default question types
 */
export const initializeDefaultQuestionTypes = async () => {
  try {
    // Load and register MultipleChoice
    const MultipleChoiceModule = await import('./MultipleChoice/MultipleChoice');
    const { createMultipleChoiceConfig } = await import('@/quiz/types/question-config.types');
    
    registerQuestionType(
      'multiple-choice',
      MultipleChoiceModule.default,
      createMultipleChoiceConfig(),
      (question) => {
        const errors: string[] = [];
        
        if (!question.options || question.options.length < 2) {
          errors.push('Multiple choice questions must have at least 2 options');
        }
        
        if (question.correct === undefined || question.correct < 0 || 
            question.correct >= (question.options?.length || 0)) {
          errors.push('Multiple choice questions must have a valid correct answer index');
        }
        
        return { valid: errors.length === 0, errors };
      }
    );
    
    // Load and register FillInBlank
    const FillInBlankModule = await import('./FillInBlank/FillInBlank');
    const { createFillInBlankConfig } = await import('@/quiz/types/question-config.types');
    
    registerQuestionType(
      'fill-in-blank',
      FillInBlankModule.default,
      createFillInBlankConfig(),
      (question) => {
        const errors: string[] = [];
        
        if (!question.blanks || question.blanks.length === 0) {
          errors.push('Fill-in-blank questions must have at least one blank');
        }
        
        question.blanks?.forEach((blank: any, index: number) => {
          if (!blank.answers || blank.answers.length === 0) {
            errors.push(`Blank ${index + 1} must have at least one correct answer`);
          }
        });
        
        return { valid: errors.length === 0, errors };
      }
    );
    
    // Load and register Matching
    const { default: Matching } = await import('./Matching/Matching');
    const { createMatchingConfig } = await import('@/quiz/types/question-config.types');
    
    registerQuestionType(
      'matching',
      Matching,
      createMatchingConfig(),
      (question) => {
        const errors: string[] = [];
        
        if (!question.pairs || question.pairs.length < 2) {
          errors.push('Matching questions must have at least 2 pairs');
        }
        
        return { valid: errors.length === 0, errors };
      }
    );
    
    // Load and register Categorize
    const { default: Categorize } = await import('./Categorize');
    const { createCategorizeConfig } = await import('@/quiz/types/question-config.types');
    
    registerQuestionType(
      'categorize',
      Categorize,
      createCategorizeConfig(),
      (question) => {
        const errors: string[] = [];
        
        if (!question.categories || question.categories.length < 2) {
          errors.push('Categorize questions must have at least 2 categories');
        }
        
        if (!question.items || question.items.length < 2) {
          errors.push('Categorize questions must have at least 2 items to categorize');
        }
        
        return { valid: errors.length === 0, errors };
      }
    );
    
    console.log('✅ Default question types registered successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize default question types:', error);
    throw error;
  }
};

/**
 * Plugin-style registration for custom question types
 */
export interface QuestionTypePlugin {
  type: string;
  name: string;
  description: string;
  component: React.ComponentType<any>;
  defaultConfig: QuestionConfig;
  validator?: (question: Question) => { valid: boolean; errors: string[] };
  icon?: string;
  category?: string;
}

const pluginRegistry = new Map<string, QuestionTypePlugin>();

/**
 * Register a question type plugin
 */
export const registerQuestionTypePlugin = (plugin: QuestionTypePlugin) => {
  pluginRegistry.set(plugin.type, plugin);
  
  // Also register in the main registry
  registerQuestionType(
    plugin.type,
    plugin.component,
    plugin.defaultConfig,
    plugin.validator
  );
  
  console.log(`✅ Question type plugin "${plugin.name}" registered`);
};

/**
 * Get all registered plugins
 */
export const getAllPlugins = (): QuestionTypePlugin[] => {
  return Array.from(pluginRegistry.values());
};

/**
 * Get plugin by type
 */
export const getPlugin = (type: string): QuestionTypePlugin | undefined => {
  return pluginRegistry.get(type);
};

/**
 * Registry statistics
 */
export const getRegistryStats = () => {
  return {
    totalTypes: questionTypeRegistry.size,
    totalPlugins: pluginRegistry.size,
    registeredTypes: Array.from(questionTypeRegistry.keys()),
    pluginTypes: Array.from(pluginRegistry.keys()),
  };
};

/**
 * Clear registry (useful for testing)
 */
export const clearRegistry = () => {
  questionTypeRegistry.clear();
  pluginRegistry.clear();
};

// Auto-initialize on module load
let initialized = false;

export const ensureInitialized = async () => {
  if (!initialized) {
    await initializeDefaultQuestionTypes();
    initialized = true;
  }
};

// Export registry for advanced usage
export { questionTypeRegistry };
