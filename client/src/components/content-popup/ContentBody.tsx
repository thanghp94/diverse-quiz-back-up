import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { MarkdownRenderer } from "@/components/shared";
import { Content } from "@/hooks/useContent";

// Helper function to validate translation dictionary
const isValidTranslationDictionary = (dict: any): dict is Record<string, string> => {
  return dict && typeof dict === 'object' && Object.keys(dict).length > 0;
};

interface ContentBodyProps {
  content: Content;
}

export const ContentBody = ({ content }: ContentBodyProps) => {
  return (
    <div className="space-y-2">
      {content.short_blurb && <Card>
        <CardHeader className="pb-2">
            <h3 className="font-semibold text-xl break-words">Content</h3>
        </CardHeader>
        <CardContent className="pb-2 pt-0">
            <MarkdownRenderer 
              className="text-base leading-relaxed"
              translationDictionary={isValidTranslationDictionary(content.translation_dictionary) ? content.translation_dictionary : null}
              tooltipStyle="light"
            >
                {content.short_blurb}
            </MarkdownRenderer>
        </CardContent>
      </Card>}

      {(content.translation || content.vocabulary) && <Card>
          <CardHeader>
              <h3 className="font-semibold text-xl break-words">Language Support</h3>
          </CardHeader>
          <CardContent className="pb-4">
              {content.translation && <div className="mb-4">
                  <h4 className="font-medium text-base text-gray-600 mb-2">Translation:</h4>
                  <MarkdownRenderer 
                    className="text-base leading-relaxed"
                    translationDictionary={isValidTranslationDictionary(content.translation_dictionary) ? content.translation_dictionary : null}
                    tooltipStyle="light"
                  >
                      {content.translation}
                  </MarkdownRenderer>
              </div>}
              
              {content.vocabulary && <div>
                  <h4 className="font-medium text-base text-gray-600 mb-2">Vocabulary:</h4>
                  <MarkdownRenderer 
                    className="text-base leading-relaxed"
                    translationDictionary={isValidTranslationDictionary(content.translation_dictionary) ? content.translation_dictionary : null}
                    tooltipStyle="light"
                  >
                      {content.vocabulary}
                  </MarkdownRenderer>
              </div>}
          </CardContent>
      </Card>}

      {content.url && (
        <div className="mt-2">
          <a href={content.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline break-all">
            {content.url}
          </a>
        </div>
      )}
    </div>
  );
};