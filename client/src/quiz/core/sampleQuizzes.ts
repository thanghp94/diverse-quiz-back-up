
import { Question } from '@/quiz/types';

export const sampleQuizzes: { id: number; title: string; description: string; questions: Question[] }[] = [
  {
    id: 1,
    title: "General Knowledge Quiz",
    description: "Test your knowledge across various topics",
    questions: [
      {
        id: 1,
        type: 'multiple-choice',
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correct: 2
      },
      {
        id: 2,
        type: 'matching',
        question: "Match the countries with their capitals:",
        pairs: [
          { left: "Italy", right: "Rome" },
          { left: "Japan", right: "Tokyo" },
          { left: "Australia", right: "Canberra" },
          { left: "Brazil", right: "Brasília" }
        ]
      },
      {
        id: 3,
        type: 'fill-blank',
        question: "Fill in the blanks:",
        blanks: [
          { text: "The largest planet in our solar system is ___.", answers: ["Jupiter", "jupiter"] },
          { text: "Water boils at ___ degrees Celsius.", answers: ["100", "one hundred"] }
        ]
      },
      {
        id: 4,
        type: 'categorize',
        question: "Categorize these animals:",
        categories: [
          { name: "Mammals", items: [] },
          { name: "Birds", items: [] },
          { name: "Fish", items: [] }
        ],
        items: ["Dog", "Eagle", "Shark", "Cat", "Parrot", "Salmon", "Lion", "Penguin"]
      }
    ]
  },
  {
    id: 2,
    title: "Science Quiz",
    description: "Challenge your scientific knowledge",
    questions: [
      {
        id: 1,
        type: 'multiple-choice',
        question: "What is H2O commonly known as?",
        options: ["Oxygen", "Hydrogen", "Water", "Carbon Dioxide"],
        correct: 2
      },
      {
        id: 2,
        type: 'fill-blank',
        question: "Complete the scientific facts:",
        blanks: [
          { text: "The speed of light is approximately ___ meters per second.", answers: ["299792458", "300000000"] },
          { text: "DNA stands for ___ acid.", answers: ["Deoxyribonucleic", "deoxyribonucleic"] }
        ]
      }
    ]
  }
];
