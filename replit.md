# Educational Platform

## Overview
This project is an educational platform offering content management, quizzes, assignments, and student tracking. Its main purpose is to deliver educational content effectively. Key capabilities include a comprehensive content management system, robust quiz and assignment creation tools, detailed student progress tracking, live class monitoring features, writing journal functionality, matching activities, integrated video content, and a complete debate scheduling system with team registration. The platform has successfully migrated to a standard Replit environment with a Neon PostgreSQL database, ensuring a stable and scalable foundation for educational delivery.

## Recent Changes
- **August 2025**: Successfully migrated debate scheduling system to main Neon PostgreSQL database
- Fixed critical database connectivity issue - now using main Neon database instead of external database service
- Cleaned activities_jsonb storage approach - field now starts empty ({}) and is reserved for future information
- Resolved double API prefix problem (/api/api/debate-sessions → /api/debate-sessions) that was causing session creation failures
- Updated team registration system to work with main database while maintaining activities_jsonb for registration tracking
- Registration system includes division tracking (SKT/JR/SR) and team management with proper database integration

## User Preferences
- No OAuth authentication required
- Focus on educational content delivery
- Simple session-based authentication preferred

## System Architecture

### UI/UX Decisions
The platform features a clean, simple layout. For example, the Writing page replaced complex grids with a 2-column layout showing only prompts, using clean cards with title, prompt snippets, and essay buttons. Visual organization is enhanced with elements like orange styling and Target icons for groupcards, and integration of icons like GripVertical for reordering.

### Technical Implementations
- **Backend**: Built with Express.js and TypeScript, serving RESTful APIs.
- **Frontend**: Developed using React with TypeScript and Vite for a fast and responsive user experience. Tailwind CSS is used for styling, complemented by custom UI components. React Query manages server state, and React Router handles navigation.
- **Database**: Utilizes Neon PostgreSQL with Drizzle ORM for schema definition and interaction.
- **Authentication**: Implements a session-based authentication system, with Google OAuth explicitly disabled as per user preference.
- **Content Organization**: Features a 4-level hierarchical CMS integrated into the `CollectionManager` dialog. This system allows for multi-level filtering (Level 1-4) with parent-based conditional filtering. Collections serve as the primary content organization method, combining topics and content in a single searchable interface with Topic/Content badges and level indicators. Drag-and-drop reordering is implemented for topics, groupcards, and content items across hierarchy levels using `@dnd-kit`.
- **Quiz System**: Includes enhancements for error handling, fallback difficulty levels, and a `QuizAvailabilityGuide` component, ensuring a smoother user experience during quizzes.
- **Writing System**: Supports both Academic Essay and Creative Writing flows, with features like outline generation, word count tracking, and separate content-specific storage.
- **Debate System**: Incorporates a comprehensive debate scheduling system with team registration, file upload system for debate submissions, and activity data storage in activities_jsonb format. Team registrations are saved to the activity_sessions table with structured JSON data including team_id, division, and timestamps.
- **Modular Architecture**: Routes and storage have been refactored into modular components for improved maintainability. Components are organized into logical folders with barrel exports for clean imports. The AdminPage has been significantly refactored with extracted components: `AdminControls`, `AdminTabs`, `AdminPagination`, and `AddItemDialog` for better organization and reusability.

### Feature Specifications
- **Content Management**: Unified CMS combining topics and content, with hierarchical filtering and drag-and-drop reordering.
- **Quizzes & Assignments**: Creation and management of quizzes and assignments with enhanced availability guidance.
- **Student Tracking**: Comprehensive leaderboard system for student tries, points, and streaks.
- **Live Class Monitoring**: Ultra-compact table design for real-time monitoring of student activity.
- **Writing Journal**: Dedicated writing pages for creative and academic essays with structured prompts and submission capabilities.
- **Admin Features**: CRUD operations for various data entities (Students, Topics, Content, Matching) with pagination. The admin interface has been restructured with modular components for better maintainability, including dedicated components for controls, tabs, pagination, and dialogs.

## External Dependencies
- **Neon PostgreSQL**: Primary database for all application data.
- **Drizzle ORM**: Used for interacting with the PostgreSQL database.
- **Express.js**: Backend web application framework.
- **React**: Frontend JavaScript library for building user interfaces.
- **Vite**: Frontend build tool.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **React Query**: For server state management in the frontend.
- **React Router**: For client-side routing.
- **@dnd-kit**: Library used for drag-and-drop functionalities in content reordering.