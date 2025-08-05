
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { WritingJournal } from "@/components/WritingJournal";
import { WritingTopicSelection } from "@/components/WritingTopicSelection";
import { StructuredEssayWriter } from "@/components/StructuredEssayWriter";

const WritingPage = () => {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [writingFlow, setWritingFlow] = useState<
        "journal" | "topics" | "essay"
    >("journal");
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedTopic, setSelectedTopic] = useState<{
        id: string;
        title: string;
        description: string;
    }>({
        id: "",
        title: "",
        description: "",
    });
    const [writingPrompts, setWritingPrompts] = useState<any[]>([]);

    useEffect(() => {
        const userData = localStorage.getItem("currentUser");
        if (userData) {
            setCurrentUser(JSON.parse(userData));
        } else {
            // Provide a demo user when no user is found in localStorage
            setCurrentUser({
                id: "demo-user",
                full_name: "Demo User",
                first_name: "Demo",
            });
        }
    }, []);

    // Fetch writing prompts from API
    useEffect(() => {
        const fetchWritingPrompts = async () => {
            try {
                const response = await fetch('/api/writing-prompts');
                if (response.ok) {
                    const prompts = await response.json();
                    setWritingPrompts(prompts);
                }
            } catch (error) {
                console.error('Failed to fetch writing prompts:', error);
            }
        };

        fetchWritingPrompts();
    }, []);

    const handleCategorySelect = (category: string) => {
        setSelectedCategory(category);
        setWritingFlow("topics");
    };

    const handleTopicSelect = (topicId: string) => {
        // Find the topic from fetched writing prompts
        const foundPrompt = writingPrompts.find(prompt => prompt.id === topicId);
        
        const topic = foundPrompt || {
            title: "Creative Writing",
            description: "Write about your chosen topic."
        };

        setSelectedTopic({
            id: topicId,
            title: topic.title,
            description: topic.description,
        });
        setWritingFlow("essay");
    };

    const handleBackToJournal = () => {
        setWritingFlow("journal");
        setSelectedCategory("");
    };

    const handleBackToTopics = () => {
        setWritingFlow("topics");
    };

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white">
                <Header />
                <div className="container mx-auto p-4 md:p-8">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-white mb-3">
                            Writing
                        </h1>
                        <p className="text-lg text-white/80">
                            Please log in to access the writing system.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (writingFlow === "topics") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
                <Header />
                <WritingTopicSelection
                    category={selectedCategory}
                    onBack={handleBackToJournal}
                    onTopicSelect={handleTopicSelect}
                />
            </div>
        );
    }

    if (writingFlow === "essay") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
                <Header />
                <StructuredEssayWriter
                    topicTitle={selectedTopic.title}
                    topicDescription={selectedTopic.description}
                    studentId={currentUser.id}
                    onBack={handleBackToTopics}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
            <Header />
            <WritingJournal
                studentId={currentUser.id}
                studentName={currentUser.full_name || currentUser.first_name}
                onCategorySelect={handleCategorySelect}
            />
        </div>
    );
};

export default WritingPage;
