
export interface Question {
  id: number | string;
  type: 'multiple-choice' | 'matching' | 'fill-blank' | 'categorize';
  question: string;
  options?: string[];
  correct?: string | number;
  pairs?: { left: string; right: string; leftContentId?: string; rightContentId?: string; leftType?: string; }[];
  blanks?: { text: string; answers: string[] }[];
  categories?: { name: string; items: string[] }[];
  items?: string[];
}
