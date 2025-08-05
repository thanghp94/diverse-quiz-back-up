import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { QuizView } from '@/components/quiz';

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
    const [questionIds, setQuestionIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTopicQuiz = async () => {
            try {
                setIsLoading(true);
                console.log(`Fetching questions for topic ${topicId} with level ${level}`);

                // Fetch questions for the topic and level
                const response = await fetch(`/api/questions?topicId=${topicId}&level=${level}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch questions');
                }
                const questions = await response.json();
                console.log(`Found ${questions.length} questions for level: ${level}`);

                if (questions.length === 0) {
                    console.log(`No ${level} questions available for topic ${topicId}`);
                    onClose();
                    return;
                }

                const questionIds = questions.map((q: any) => q.id);
                setQuestionIds(questionIds);

                // Create assignment_student_try
                const getCurrentUser = () => {
                    const storedUser = localStorage.getItem('currentUser');
                    if (storedUser) {
                        return JSON.parse(storedUser);
                    }
                    return { id: 'GV0002', name: 'Default User' };
                };

                const currentUser = getCurrentUser();
                const tryResponse = await fetch('/api/assignment-student-tries', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        hocsinh_id: currentUser.id,
                        contentID: `topic-${topicId}`, // Use topic-based contentID
                        questionIDs: JSON.stringify(questionIds),
                        start_time: new Date().toISOString(),
                        typeoftaking: level
                    })
                });

                if (!tryResponse.ok) {
                    throw new Error('Failed to create assignment try');
                }

                const assignmentTryResult = await tryResponse.json();
                console.log('Topic quiz started with database tracking:', assignmentTryResult);
                setAssignmentTry(assignmentTryResult);

                // Create student_try with required ID
                const studentTryResponse = await fetch('/api/student-tries', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        id: `topic-quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        assignment_student_try_id: assignmentTryResult.id,
                        hocsinh_id: currentUser.id,
                        time_start: new Date().toISOString()
                    })
                });

                if (!studentTryResponse.ok) {
                    const errorText = await studentTryResponse.text();
                    console.error('Student try creation failed:', errorText);
                    throw new Error('Failed to create student try');
                }

                const studentTryResult = await studentTryResponse.json();
                console.log('Created student_try:', studentTryResult);
                setStudentTry(studentTryResult);

            } catch (error) {
                console.error('Error setting up topic quiz:', error);
                onClose();
            } finally {
                setIsLoading(false);
            }
        };

        if (topicId && level) {
            fetchTopicQuiz();
        }
    }, [topicId, level, onClose]);

    const handleQuizFinish = () => {
        onClose();
    };

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

    if (!assignmentTry || !studentTry || questionIds.length === 0) {
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
                        questionIds={questionIds}
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