# OpenChess - Online Chess Platform

## Overview

OpenChess is a full-stack online chess platform built with React and Node.js, designed to function similarly to Chess.com. It provides real-time multiplayer chess games with user authentication, matchmaking, chat functionality, and game history tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### January 2025 - MongoDB Migration
- Successfully migrated from PostgreSQL/Drizzle to MongoDB/Mongoose
- Updated all database schemas to use Mongoose models
- Converted session storage to use connect-mongo
- Updated storage layer to handle MongoDB ObjectIds properly
- All type conversions implemented for seamless frontend compatibility

## System Architecture

The application follows a monorepo structure with clear separation between client and server code:

- **Frontend**: React SPA with TypeScript
- **Backend**: Express.js REST API with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Features**: Built for WebSocket integration (Socket.IO ready)
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Authentication**: Replit Auth integration with session management

## Key Components

### Frontend Architecture
- **React Router**: Uses Wouter for lightweight routing
- **State Management**: React Query (@tanstack/react-query) for server state
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Chess Logic**: chess.js library for move validation and game rules
- **Styling**: Tailwind CSS with custom CSS variables for theming

### Backend Architecture
- **API Server**: Express.js with TypeScript
- **Database Layer**: Mongoose ODM with MongoDB
- **Authentication**: Replit Auth with OpenID Connect
- **Session Storage**: MongoDB-based session store using connect-mongo
- **File Structure**: Modular separation of routes, storage, and database logic

### Database Schema
The application uses MongoDB with the following core collections:
- **users**: User profiles with ratings and game statistics
- **games**: Chess game instances with player assignments and metadata
- **gameMoves**: Individual moves within games
- **chatMessages**: In-game chat functionality
- **matchmakingQueue**: Player matchmaking system
- **sessions**: Session management for authentication

## Data Flow

1. **User Authentication**: Replit Auth handles user login/registration with fallback guest accounts
2. **Game Creation**: Users can join matchmaking queue or create private games
3. **Real-time Updates**: Frontend polls API endpoints for game state updates
4. **Move Processing**: Chess moves are validated server-side using chess.js
5. **Chat System**: In-game messaging with polling-based updates
6. **Game History**: All moves and game outcomes are persisted to database

## External Dependencies

### Frontend Dependencies
- **chess.js**: Chess game logic and validation
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight React router
- **@radix-ui/***: Headless UI components
- **tailwindcss**: Utility-first CSS framework
- **date-fns**: Date manipulation utilities

### Backend Dependencies
- **mongoose**: MongoDB object modeling library
- **express**: Web application framework
- **passport**: Authentication middleware
- **connect-mongo**: MongoDB session store

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type safety
- **tsx**: TypeScript execution engine

## Deployment Strategy

The application is configured for deployment with:
- **Build Process**: Vite builds the frontend, esbuild bundles the backend
- **Production Server**: Node.js serving static files and API endpoints
- **Database**: MongoDB with Mongoose models
- **Environment Variables**: MONGODB_URI, SESSION_SECRET, REPL_ID, etc.
- **Development Mode**: Vite dev server with hot reload and error overlay

The app supports both development (with Replit integration) and production deployment modes. The server serves the built React app as static files while providing API endpoints under `/api/*`.

## Notable Architectural Decisions

### Database Choice
- **MongoDB with Mongoose ODM**: Provides flexible document storage, schema validation, and excellent TypeScript integration
- **Session Storage in Database**: Uses the same MongoDB instance for session persistence with connect-mongo

### Authentication Strategy
- **Replit Auth**: Leverages the platform's built-in authentication
- **Guest Account Support**: Allows anonymous play without full registration

### Real-time Updates
- **Polling Strategy**: Currently uses polling for simplicity, but architecture supports WebSocket upgrade
- **React Query**: Handles caching and background refetching automatically

### UI Architecture
- **Component Library**: shadcn/ui provides consistent, accessible components
- **Theme System**: CSS variables enable easy theming and customization
- **Mobile Responsive**: Tailwind classes ensure mobile compatibility

The architecture prioritizes type safety, developer experience, and scalability while maintaining simplicity for the MVP implementation.