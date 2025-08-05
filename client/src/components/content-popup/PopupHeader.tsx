import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import MarkdownRenderer from "@/components/shared";
import { ArrowLeft, ArrowRight, HelpCircle, Languages, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Content } from "@/hooks/useContent";
import { ContentRatingButtons } from "../ContentRatingButtons";
import { PersonalNotesDropdown } from "../PersonalNotesDropdown";

interface PopupHeaderProps {
  contentListLength: number;
  currentIndex: number;
  handlePrevious: () => void;
  handleNext: () => void;
  startQuiz: (level?: 'Easy' | 'Hard') => void;
  translation: Content['translation'];
  contentId: string;
}

export const PopupHeader = ({
  contentListLength,
  currentIndex,
  handlePrevious,
  handleNext,
  startQuiz,
  translation,
  contentId
}: PopupHeaderProps) => {
  const [isTranslationPopoverOpen, setIsTranslationPopoverOpen] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg border">
          <div className="flex items-center gap-2">
              <Button onClick={handlePrevious} disabled={currentIndex <= 0} size="sm">
                  <ArrowLeft className="h-4 w-4" />
                  Previous
              </Button>
              <Button onClick={handleNext} disabled={contentListLength === 0 || currentIndex >= contentListLength - 1} size="sm">
                  Next
                  <ArrowRight className="h-4 w-4" />
              </Button>
              {contentListLength > 0 && <div className="text-sm text-gray-500">
                  {currentIndex + 1} / {contentListLength}
              </div>}
          </div>

          <div className="flex items-center gap-2">
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                          <HelpCircle className="h-4 w-4" />
                          Quiz
                          <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => {
                        console.log('Easy Quiz clicked');
                        startQuiz('Easy');
                      }}>Easy Quiz</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                         console.log('Hard Quiz clicked');
                         startQuiz('Hard');
                      }}>Hard Quiz</DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
              <Popover open={isTranslationPopoverOpen} onOpenChange={setIsTranslationPopoverOpen}>
                  <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                          <Languages className="h-4 w-4" />
                          Translation
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-80 max-w-xs">
                      <Card className="border-0 shadow-none">
                          <CardHeader>
                              <h3 className="font-semibold text-lg">Translation</h3>
                          </CardHeader>
                          <CardContent className="pt-0">
                              {translation ? <MarkdownRenderer className="text-sm">
                                      {translation}
                                  </MarkdownRenderer> : <div className="text-gray-500 text-sm">No translation available for this content.</div>}
                          </CardContent>
                      </Card>
                  </PopoverContent>
              </Popover>
              
              {/* Added Quiz Rating Buttons in the same flex container */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                  onClick={() => console.log('Easy button clicked')}
                >
                  👍 Easy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                  onClick={() => console.log('Hard button clicked')}
                >
                  👎 Hard
                </Button>
              </div>
          </div>
      </div>

      {/* Content Rating Section */}
      <div className="px-4 flex items-center gap-3">
        <ContentRatingButtons
          contentId={contentId}
          studentId={localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')!).id : 'anonymous'}
        />
        
        {/* Personal Notes Dropdown */}
        <PersonalNotesDropdown
          contentId={contentId}
          studentId={localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')!).id : 'GV0002'}
          compact={true}
        />
      </div>
    </div>
  );
};