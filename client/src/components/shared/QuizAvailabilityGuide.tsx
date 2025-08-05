import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface QuizGuideProps {
  onClose?: () => void;
}

const RECOMMENDED_CONTENT = [
  { id: "af8a7fe8", title: "Should it be illegal?", subject: "Philosophy", easy: 15, hard: 34 },
  { id: "e51ad416", title: "Does coma patient brain still working?", subject: "Science", easy: 15, hard: 34 },
  { id: "c3e10302", title: "Free Lives | Terra Nil (2023)", subject: "Gaming", easy: 15, hard: 34 },
  { id: "d64c643e", title: "Old music is killing new music?", subject: "Music", easy: 15, hard: 15 },
  { id: "5381759b", title: "Blizzard Entertainment | Overwatch (2016)", subject: "Gaming", easy: 15, hard: 33 },
];

export const QuizAvailabilityGuide: React.FC<QuizGuideProps> = ({ onClose }) => {
  return (
    <Card className="mb-4 border-green-200 bg-green-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <CardTitle className="text-green-800 text-sm">Quiz Available Content</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-green-700 mb-3">
          These content items have plenty of quiz questions available:
        </p>
        <div className="space-y-2">
          {RECOMMENDED_CONTENT.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {item.subject}
                  </Badge>
                  <span className="text-xs text-green-600">
                    {item.easy} Easy • {item.hard} Hard
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              <strong>Tip:</strong> If you see "No Quiz Available", try these recommended content items above. 
              They have been verified to work with both Easy and Hard difficulty levels.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};