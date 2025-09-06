import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useQuizData, useQuizTracking } from "@/quiz/hooks";
import QuizView from './QuizView';

interface TopicQuizRunnerProps {
    topicId: string;
    level: 'Overview' | 'Easy' | 'Hard';
    topicName: string;
    onClose: () => void;
}

const TopicQuizRunner: React.FC<TopicQuizRunnerProps> = ({
    topicId,
    level,
    topicName,
    onClose
}) => {
    const [assignmentTry, setAssignmentTry] = useState<any>(null);
    const [studentTry, setStudentTry] = useState<any>(null);
    const [isSetupComplete, setIsSetupComplete] = useState(false);

    // Use unified data fetching
    const { questions, isLoading: isLoadingQuestions } = useQuizData({
        source: {
            type: 'topic',
            topicId,
            level,
        },
    });

    // Use unified tracking for database operations
    const tracking = useQuizTracking({
        topicId,
        trackProgress: true,
    });

    useEffect(() => {
        const setupTopicQuiz = async () => {
            if (!questions.length || isSetupComplete) return;

            try {
                console.log(`Setting up topic quiz for ${topicId} with ${questions.length} questions`);

                if (questions.length === 0) {
                    console.log(`No ${level} questions available for topic ${topicId}`);
                    onClose();
                    return;
                }

                const questionIds = questions.map((q: any) => q.id);
                const currentUser = tracking.getCurrentUser();

                // Create assignment_student_try using unified tracking
                const assignmentTryResult = await tracking.createAssignmentStudentTry({
                    hocsinh_id: currentUser.id,
                    contentID: `topic-${topicId}`,
                    questionIDs: JSON.stringify(questionIds),
                    start_time: new Date().toISOString(),
                    typeoftaking: level
                });

                console.log('Topic quiz started with database tracking:', assignmentTryResult);
                setAssignmentTry(assignmentTryResult);

                // Create student_try using unified tracking
                const studentTryResult = await tracking.createStudentTry({
                    assignment_student_try_id: assignmentTryResult.id.toString(),
                    hocsinh_id: currentUser.id,
                });

                console.log('Created student_try:', studentTryResult);
                setStudentTry(studentTryResult);
                setIsSetupComplete(true);

            } catch (error) {
                console.error('Error setting up topic quiz:', error);
                onClose();
            }
        };

        setupTopicQuiz();
    }, [questions, topicId, level, onClose, tracking, isSetupComplete]);

    const handleQuizFinish = () => {
        onClose();
    };

    const isLoading = isLoadingQuestions || !isSetupComplete;

    if (isLoading) {
        return (
            <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="max-w-4xl h-[80vh]">
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="text-lg font-semibold">Loading {level} Quiz...</div>
                            <div className="text-gray-600 mt-2">Preparing questions for {topicName}</div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    if (!assignmentTry || !studentTry || questions.length === 0) {
        return (
            <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="max-w-4xl h-[80vh]">
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="text-lg font-semibold">No questions available</div>
                            <div className="text-gray-600 mt-2">Unable to load {level} quiz for {topicName}</div>
                            <Button onClick={onClose} className="mt-4">Close</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-7xl h-[90vh] overflow-hidden">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-semibold">
                            {topicName} - {level} Quiz
                        </DialogTitle>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="h-[calc(90vh-4rem)] w-full overflow-hidden">
                    <QuizView
                        questionIds={questions.map((q: any) => q.id)}
                        onQuizFinish={handleQuizFinish}
                        assignmentStudentTryId={assignmentTry.id.toString()}
                        studentTryId={studentTry.id}
                        topicId={topicId}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TopicQuizRunner;