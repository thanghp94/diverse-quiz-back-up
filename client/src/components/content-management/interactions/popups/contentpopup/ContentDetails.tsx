import { useState } from "react";
import { MarkdownRenderer } from "@/components/shared";
import type { Content } from "@shared/schema";

interface ContentDetailsProps {
  content: Content;
  isSecondBlurbOpen: boolean;
  setIsSecondBlurbOpen: (open: boolean) => void;
}

export const ContentDetails = ({
  content,
  isSecondBlurbOpen,
  setIsSecondBlurbOpen,
}: ContentDetailsProps) => {
  // Type guard for translation dictionary
  const isValidTranslationDictionary = (dict: unknown): dict is Record<string, string> => {
    return dict !== null &&
      typeof dict === "object" &&
      !Array.isArray(dict) &&
      Object.values(dict as Record<string, unknown>).every(
        (val) => typeof val === "string"
      );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-blue-600 text-center">{content.title}</h2>
        <p className="whitespace-pre-line text-[16px] text-[#131b2a]">
          {content.short_description || "Detailed content view."}
        </p>
      </div>

      {/* Short Blurb directly under title */}
      {content.short_blurb && (
        <div className="mb-2">
          <MarkdownRenderer
            className="text-base leading-relaxed"
            translationDictionary={
              isValidTranslationDictionary(content.translation_dictionary)
                ? content.translation_dictionary
                : null
            }
            tooltipStyle="dark"
          >
            {content.short_blurb}
          </MarkdownRenderer>
        </div>
      )}

      {/* Second Short Blurb as collapsible card */}
      {content.second_short_blurb && (
        <div className="border border-gray-200 rounded-lg">
          <button
            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg"
            onClick={() => setIsSecondBlurbOpen(!isSecondBlurbOpen)}
          >
            <h3 className="font-semibold text-lg">Additional Information</h3>
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${
                isSecondBlurbOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isSecondBlurbOpen && (
            <div className="px-3 pb-2 border-t border-gray-100">
              <MarkdownRenderer
                className="text-base leading-relaxed"
                translationDictionary={
                  isValidTranslationDictionary(content.translation_dictionary)
                    ? content.translation_dictionary
                    : null
                }
              >
                {content.second_short_blurb}
              </MarkdownRenderer>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
