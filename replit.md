# Educational Platform

## Overview
This project is an educational platform designed for content management, interactive quizzes, assignments, and student progress tracking. It aims to provide a comprehensive learning environment with features supporting diverse educational activities. The platform has successfully migrated to a standard Replit environment leveraging Neon PostgreSQL for data persistence. The vision is to offer a streamlined, efficient, and user-friendly system for delivering educational content and monitoring student engagement.

## User Preferences
- No OAuth authentication required
- Focus on educational content delivery
- Simple session-based authentication preferred

## System Architecture

### UI/UX Decisions
The platform features a clean, functional UI with a focus on usability and content accessibility. Key design choices include:
- Simplified layouts for improved readability (e.g., 2-column layout for writing prompts).
- Clear organization of content with visual indicators (e.g., Topic/Content badges, level indicators, orange styling for groupcards).
- Interactive elements like drag-and-drop for content reordering.
- Minimalistic design in monitoring tools for maximum information density.

### Technical Implementations
- **Backend**: Express.js with TypeScript, utilizing Drizzle ORM for database interactions and a modular API structure for maintainability.
- **Frontend**: React with TypeScript and Vite, styled using Tailwind CSS for a consistent and responsive design. React Query manages server state, and React Router handles navigation.
- **Core Features**:
    - **Content Management System (CMS)**: Hierarchical 4-level structure with integrated topic and content management, supporting advanced filtering, reordering (drag-and-drop for topics, groupcards, and content), and comprehensive content organization within collections.
    - **Quiz System**: Robust quiz functionality with dynamic difficulty fallback, error handling, and availability guidance.
    - **Assignment System**: Creation and management of assignments.
    - **Student Tracking**: Comprehensive student progress monitoring, including leaderboards for quiz completion counts and streak tracking.
    - **Writing Journal**: Integrated writing prompts with dedicated interfaces for academic essays and creative writing, including outline phases, word count tracking, and content persistence.
    - **Debate System**: Functionality for organizing debates, including file upload for submissions.
    - **Matching Activities**: Support for interactive matching exercises.
    - **Video Content**: Integration capabilities for video content.
    - **Live Class Monitoring**: Real-time monitoring of student activity for teachers (GV0002 or Teacher category).
    - **Admin Panel**: CRUD operations for managing students, topics, content, and matching data, with pagination.

### System Design Choices
- **Modular Architecture**: Routes, storage, and UI components are refactored into distinct, logical modules and folders with barrel exports for improved maintainability, testability, and code reusability.
- **Session-Based Authentication**: For user authentication, aligning with user preference to forgo OAuth.
- **Component Reusability**: Emphasis on creating small, reusable components to build pages and features.
- **Performance Optimization**: Efforts include tree-shaking, reduced bundle size, and improved hot reload times through proper component organization.

## External Dependencies
- **Database**: Neon PostgreSQL (used for all data persistence)
- **ORM**: Drizzle ORM (for database interaction)
- **Drag-and-Drop Library**: `@dnd-kit` (for content reordering functionality)
- **Object Storage**: For file uploads (e.g., debate submissions)