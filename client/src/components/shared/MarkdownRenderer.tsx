import React from "react";
import ReactMarkdown from "react-markdown";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

/**
 * MarkdownRenderer
 * Wraps ReactMarkdown with Tailwind `prose` classes for beautiful formatting.
 * Supports translation tooltips when translationDictionary is provided.
 */
export const MarkdownRenderer = ({
  children,
  className = "",
  translationDictionary,
  textColor = "",
  tooltipStyle = "dark", // "dark" for white background with dark text, "light" for dark background with light text
}: {
  children: string;
  className?: string;
  translationDictionary?: Record<string, string> | null;
  textColor?: string;
  tooltipStyle?: "dark" | "light";
}) => {
  // Preprocess content to remove leading/trailing whitespace and newlines
  const cleanedContent = children.trim().replace(/^\n+/, '').replace(/\n+$/, '');
  // Function to add translation tooltips to text nodes
  const addTranslationTooltips = (text: string): React.ReactNode => {
    if (!translationDictionary || Object.keys(translationDictionary).length === 0) {
      return text;
    }

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    // Sort keys by length (longest first) to match longer phrases first
    const sortedKeys = Object.keys(translationDictionary).sort((a, b) => b.length - a.length);

    // Find all matches in the text
    const matches: Array<{ start: number; end: number; key: string; translation: string }> = [];

    sortedKeys.forEach(key => {
      const regex = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        // Check if this match overlaps with existing matches
        const overlaps = matches.some(existing => 
          (match!.index >= existing.start && match!.index < existing.end) ||
          (match!.index + match![0].length > existing.start && match!.index + match![0].length <= existing.end)
        );

        if (!overlaps) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            key: match[0],
            translation: translationDictionary[key]
          });
        }
      }
    });

    // Sort matches by start position
    matches.sort((a, b) => a.start - b.start);

    // Build the elements array with tooltips
    matches.forEach((match, index) => {
      // Add text before this match
      if (match.start > lastIndex) {
        elements.push(text.slice(lastIndex, match.start));
      }

      // Add the tooltip for this match
      elements.push(
        <HoverCard key={`tooltip-${match.start}-${index}`} openDelay={200} closeDelay={100}>
          <HoverCardTrigger asChild>
            <span className={`cursor-help underline decoration-dotted transition-all duration-200 rounded px-0.5 ${
              tooltipStyle === "light" 
                ? "decoration-blue-400 hover:decoration-solid hover:bg-blue-50" 
                : "decoration-yellow-400 hover:decoration-solid hover:bg-yellow-400/20"
            }`}>
              {match.key}
            </span>
          </HoverCardTrigger>
          <HoverCardContent 
            side="top" 
            className={`w-auto max-w-sm text-lg py-1 px-2 rounded-lg shadow-xl z-50 ${
              tooltipStyle === "light" 
                ? "bg-white border-gray-200 text-gray-900" 
                : "bg-gray-800 border-gray-600 text-white"
            }`}
          >
            <div className={`font-semibold text-lg ${
              tooltipStyle === "light" ? "text-gray-900" : "text-white"
            }`}>
              {match.translation}
            </div>
          </HoverCardContent>
        </HoverCard>
      );

      lastIndex = match.end;
    });

    // Add remaining text after last match
    if (lastIndex < text.length) {
      elements.push(text.slice(lastIndex));
    }

    return elements.length > 0 ? elements : [text];
  };

  // Custom components that process text nodes for translation tooltips
  const components = React.useMemo(() => {
    const baseComponents = {
      // Handle paragraphs - remove empty ones and ensure no top margin
      p: ({ children, ...props }: any) => {
        // Check if paragraph is empty or only contains whitespace
        const hasContent = React.Children.toArray(children).some(child => 
          typeof child === 'string' ? child.trim() : true
        );
        
        if (!hasContent) {
          return null; // Don't render empty paragraphs
        }

        return (
          <p {...props} className="m-0 p-0 leading-relaxed">
            {translationDictionary && Object.keys(translationDictionary).length > 0 
              ? React.Children.map(children, (child) => 
                  typeof child === 'string' ? addTranslationTooltips(child) : child
                )
              : children
            }
          </p>
        );
      },
    };

    if (!translationDictionary || Object.keys(translationDictionary).length === 0) {
      return baseComponents;
    }

    return {
      ...baseComponents,
      // Handle text nodes in various markdown elements
      li: ({ children, ...props }: any) => (
        <li {...props} className={`${textColor} mb-1`}>
          {React.Children.map(children, (child) => 
            typeof child === 'string' ? addTranslationTooltips(child) : child
          )}
        </li>
      ),
      h1: ({ children, ...props }: any) => (
        <h1 {...props}>
          {React.Children.map(children, (child) => 
            typeof child === 'string' ? addTranslationTooltips(child) : child
          )}
        </h1>
      ),
      h2: ({ children, ...props }: any) => (
        <h2 {...props}>
          {React.Children.map(children, (child) => 
            typeof child === 'string' ? addTranslationTooltips(child) : child
          )}
        </h2>
      ),
      h3: ({ children, ...props }: any) => (
        <h3 {...props}>
          {React.Children.map(children, (child) => 
            typeof child === 'string' ? addTranslationTooltips(child) : child
          )}
        </h3>
      ),
      strong: ({ children, ...props }: any) => (
        <strong {...props}>
          {React.Children.map(children, (child) => 
            typeof child === 'string' ? addTranslationTooltips(child) : child
          )}
        </strong>
      ),
      em: ({ children, ...props }: any) => (
        <em {...props}>
          {React.Children.map(children, (child) => 
            typeof child === 'string' ? addTranslationTooltips(child) : child
          )}
        </em>
      ),
      // Handle plain text nodes
      text: ({ children, ...props }: any) => (
        <span {...props}>
          {typeof children === 'string' ? addTranslationTooltips(children) : children}
        </span>
      )
    };
  }, [translationDictionary]);

  return (
    <div className={`prose prose-blue dark:prose-invert max-w-none font-sans prose-li:my-0 prose-li:py-0 prose-li:mb-1 prose-li:mt-0 prose-li:leading-relaxed prose-li:pl-0 prose-li:ml-1 prose-p:my-0 prose-p:mb-0 prose-p:mt-0 prose-p:pt-0 prose-p:leading-relaxed prose-ul:my-0 prose-ul:py-0 prose-ul:mb-0 prose-ul:mt-0 prose-ul:pl-3 prose-ul:space-y-1 prose-ol:my-0 prose-ol:py-0 prose-ol:mb-0 prose-ol:mt-0 prose-ol:pl-3 prose-ol:space-y-1 ${className}`} style={{ lineHeight: '1.4', margin: 0, padding: 0 }}>
      <ReactMarkdown components={components}>{cleanedContent}</ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;