import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { MarkdownRenderer } from "@/components/shared";
import { useUnifiedQuizState, useQuizTracking, useQuizData } from "@/quiz/hooks";

interface QuizViewProps {
    questionIds: string[];
    onQuizFinish: () => void;
    assignmentStudentTryId: string;
    studentTryId?: string;
    contentId?: string;
    topicId?: string;
}

const QuizView = ({ questionIds, onQuizFinish, assignmentStudentTryId, studentTryId, contentId, topicId }: QuizViewProps) => {
    // Convert props to unified configuration
    const unifiedConfig = {
        source: {
            type: 'questions' as const,
            questionIds,
        },
        mode: 'assignment' as const,
        database: {
            assignmentStudentTryId,
            studentTryId,
            trackProgress: true,
        },
        callbacks: {
            onQuizFinish,
            onQuestionAnswer: (answer: any, isCorrect: boolean) => {
                // This will be handled by the tracking hook
            },
        },
    };

    // Use unified state management
    const {
        currentQuestionIndex,
        currentQuestion,
        isLoading,
        selectedAnswer,
        isCorrect,
        showFeedback,
        correctAnswersCount,
        incorrectAnswersCount,
        timeStart,
        showContent,
        didShowContent,
        linkedContent,
        isContentLoading,
        handleAnswerSelect,
        handleShowContent,
        handleNext: unifiedHandleNext,
    } = useUnifiedQuizState(unifiedConfig);

    // Use unified tracking for database operations
    const tracking = useQuizTracking({
        assignmentStudentTryId,
        studentTryId,
        contentId,
        topicId,
        trackProgress: true,
    });

    // Handle next question with database tracking
    const handleNext = async () => {
        if (!currentQuestion || selectedAnswer === null || isCorrect === null) return;
        
        const timeEnd = new Date().toISOString();

        // Record question response using unified tracking
        await tracking.recordQuestionResponse(
            currentQuestion.id,
            selectedAnswer,
            (currentQuestion as any).correct_choice,
            isCorrect,
            timeStart,
            timeEnd,
            currentQuestionIndex,
            didShowContent
        );

        // Use the unified state's handleNext function to properly advance
        unifiedHandleNext();
    };

    const handleContentRating = async (rating: string) => {
        await tracking.saveContentRating(rating);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="text-lg font-semibold">Loading Quiz...</div>
                    <div className="text-gray-600 mt-2">Preparing your questions...</div>
                </div>
            </div>
        );
    }

    if (!currentQuestion) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center text-red-500">
                    <div className="text-lg font-semibold">No questions available</div>
                    <div className="text-gray-600 mt-2">Unable to load quiz questions.</div>
                </div>
            </div>
        );
    }

    const choices = [currentQuestion.cau_tra_loi_1, currentQuestion.cau_tra_loi_2, currentQuestion.cau_tra_loi_3, currentQuestion.cau_tra_loi_4].filter((c): c is string => c !== null && c !== '');

    const totalQuestions = questionIds.length;
    const correctPercentage = totalQuestions > 0 ? Math.round((correctAnswersCount / totalQuestions) * 100) : 0;
    const incorrectPercentage = totalQuestions > 0 ? Math.round((incorrectAnswersCount / totalQuestions) * 100) : 0;

    return (
        <div className="w-full h-full overflow-hidden">
            <Card className="border-gray-200 shadow-lg h-full w-full">
                <CardHeader className="pb-6">
                    <div className="flex flex-col gap-4">
                        {/* Question Title */}
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Question {currentQuestionIndex + 1}/{questionIds.length}
                            </CardTitle>

                            {/* Progress Bar - Always visible */}
                            <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                                <div className="text-xs text-gray-600 font-medium mb-1">Progress</div>
                                <div className="flex items-center gap-2">
                                    <div className="w-16 bg-gray-200 rounded-full h-1.5 flex overflow-hidden">
                                        <div 
                                            className="bg-green-500 h-1.5 transition-all duration-300"
                                            style={{ width: `${(correctAnswersCount / totalQuestions) * 100}%` }}
                                        />
                                        <div 
                                            className="bg-red-500 h-1.5 transition-all duration-300"
                                            style={{ width: `${(incorrectAnswersCount / totalQuestions) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-green-600 font-bold text-xs">{correctPercentage}%</span>
                                    <span className="text-gray-400 text-xs">|</span>
                                    <span className="text-red-600 font-bold text-xs">{incorrectPercentage}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Question Number System - Responsive and compact */}
                        <div className="flex flex-wrap gap-1 justify-center">
                            {Array.from({ length: questionIds.length }, (_, index) => {
                                const questionNumber = index + 1;
                                const isAnswered = index < currentQuestionIndex || (index === currentQuestionIndex && showFeedback);
                                const isCurrent = index === currentQuestionIndex;
                                const wasCorrect = index < currentQuestionIndex && sessionStorage.getItem('quizResults') ? 
                                    JSON.parse(sessionStorage.getItem('quizResults') || '[]')[index] : false;

                                return (
                                    <div
                                        key={index}
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                            isAnswered && !isCurrent
                                                ? wasCorrect 
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-red-500 text-white'
                                                : isCurrent 
                                                ? 'bg-blue-500 text-white ring-2 ring-blue-300 scale-110'
                                                : 'bg-gray-200 text-gray-600'
                                        }`}
                                    >
                                        {questionNumber}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <CardDescription className="text-2xl font-semibold text-blue-600 pt-2 leading-relaxed">{currentQuestion.noi_dung}</CardDescription>
                </CardHeader>
                <CardContent className="pb-8 flex-1 overflow-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {choices.map((choice, index) => {
                            const choiceLetter = String.fromCharCode(65 + index);
                            const isSelected = selectedAnswer === choiceLetter;
                            const isCorrect = showFeedback && choiceLetter === currentQuestion.correct_choice;
                            const isWrong = showFeedback && isSelected && choiceLetter !== currentQuestion.correct_choice;

                            return (
                                <Card
                                    key={index}
                                    className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                                        isCorrect
                                            ? 'ring-2 ring-green-500 bg-green-50 border-green-300'
                                            : isWrong
                                            ? 'ring-2 ring-red-500 bg-red-50 border-red-300'
                                            : isSelected
                                            ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-300'
                                            : 'hover:shadow-lg border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50'
                                    } ${showFeedback ? 'pointer-events-none' : ''}`}
                                    onClick={() => !showFeedback && handleAnswerSelect(index)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                                                isCorrect
                                                    ? 'bg-green-500 text-white'
                                                    : isWrong
                                                    ? 'bg-red-500 text-white'
                                                    : isSelected 
                                                    ? 'bg-blue-500 text-white' 
                                                    : choiceLetter === 'A' ? 'bg-yellow-400 text-yellow-900'
                                                    : choiceLetter === 'B' ? 'bg-green-400 text-green-900'
                                                    : choiceLetter === 'C' ? 'bg-pink-400 text-pink-900'
                                                    : 'bg-blue-400 text-blue-900'
                                            }`}>
                                                {choiceLetter}
                                            </div>
                                            <span className={`text-base font-medium flex-1 ${
                                                isCorrect ? 'text-green-800' : isWrong ? 'text-red-800' : 'text-gray-800'
                                            }`}>
                                                {choice}
                                            </span>
                                            {isCorrect && (
                                                <Check className="h-5 w-5 text-green-600" />
                                            )}
                                            {isWrong && (
                                                <X className="h-5 w-5 text-red-600" />
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>



                    {/* Correct Answer Feedback - Above Content */}
                    {showFeedback && (
                        <div className={`mt-6 p-4 rounded-lg border-2 ${
                            isCorrect 
                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
                                : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-300'
                        }`}>
                            <div className="flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                                    isCorrect ? 'bg-green-500' : 'bg-red-500'
                                }`}>
                                    {isCorrect ? (
                                        <Check className="h-6 w-6 text-white" />
                                    ) : (
                                        <X className="h-6 w-6 text-white" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className={`font-bold text-xl ${
                                        isCorrect ? 'text-green-800' : 'text-red-800'
                                    }`}>
                                        {isCorrect ? 'Correct Answer!' : 'Incorrect'}
                                    </div>
                                    {currentQuestion.explanation && (
                                        <div className={`text-sm mt-2 ${
                                            isCorrect ? 'text-green-700' : 'text-red-700'
                                        }`}>
                                            {currentQuestion.explanation}
                                        </div>
                                    )}
                                    {isCorrect && (
                                        <div className="text-green-700 text-sm mt-2 font-medium">+100 points added to your score</div>
                                    )}
                                </div>
                                {/* Content Image Preview - Properly sized */}
                                {linkedContent && linkedContent.imageid && (
                                    <div className="flex-shrink-0">
                                        <div className="relative">
                                            <img
                                                src={linkedContent.imageid}
                                                alt={linkedContent.title || 'Content image'}
                                                className="w-20 h-20 object-cover rounded-lg border-2 border-white shadow-md"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                                <span className="text-white text-xs">📖</span>
                                            </div>
                                        </div>
                                        {linkedContent.title && (
                                            <div className="text-xs text-gray-600 mt-1 text-center max-w-20 truncate">
                                                {linkedContent.title}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Show Content and Next Button on Same Line */}
                    {showFeedback && (
                        <div className="mt-6 flex items-center justify-between gap-4">
                            <Button 
                                variant="outline" 
                                onClick={handleShowContent} 
                                disabled={isContentLoading}
                                className="bg-purple-500 text-white border-0 hover:bg-purple-600 px-6 py-2 rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200"
                            >
                                {isContentLoading ? 'Loading...' : (showContent ? 'Hide Content' : 'Show Content')}
                            </Button>

                            <Button 
                                onClick={handleNext}
                                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
                            >
                                {currentQuestionIndex < questionIds.length - 1 ? (
                                    <>Next <span>→</span></>
                                ) : (
                                    'Finish Quiz'
                                )}
                            </Button>
                        </div>
                    )}

                    {showContent && linkedContent && (
                        <Card className="mt-6 bg-blue-50 border-blue-200">
                            <CardHeader>
                                <CardTitle className="text-2xl text-blue-700">{linkedContent.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Left side: Text content */}
                                    <div className="space-y-4">
                                        {linkedContent.short_description && (
                                            <div>
                                                <h4 className="font-semibold text-blue-600 mb-2">Description:</h4>
                                                <div className="text-gray-700 leading-relaxed whitespace-pre-line">{linkedContent.short_description}</div>
                                            </div>
                                        )}
                                        {linkedContent.short_blurb && (
                                            <div>
                                                <h4 className="font-semibold text-blue-600 mb-2">Details:</h4>
                                                <MarkdownRenderer className="text-gray-700 leading-relaxed">
                                                    {linkedContent.short_blurb}
                                                </MarkdownRenderer>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right side: Image */}
                                    {linkedContent.imageid && (
                                        <div className="flex justify-center">
                                            <img
                                                src={linkedContent.imageid}
                                                alt={linkedContent.title}
                                                className="max-w-full h-auto rounded-lg shadow-md"
                                                style={{ maxHeight: '400px' }}
                                                onError={(e) => {
                                                    console.log('Content image failed to load:', linkedContent.imageid);
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default QuizView;