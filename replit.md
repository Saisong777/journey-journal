# Trip Companion - Pilgrimage Journey App

## Overview
Trip Companion is a web application designed for Christian pilgrimage/mission trips. It enables team members to share journals, devotional entries, track locations, manage groups, and create trip summaries.

## Project Status
**Completed** - Successfully migrated from Lovable/Supabase to Replit's fullstack environment with PostgreSQL.

### Migration Summary
- Removed Supabase dependencies and integrations
- Implemented session-based authentication with Express sessions
- Created Drizzle ORM schema matching original Supabase structure
- Built RESTful API endpoints for all features
- Updated all frontend hooks to use fetch API instead of Supabase client
- Configured Vite for client/server/shared project structure

## Key Features
- User authentication (email/password)
- Role-based access control (admin, leader, guide, member)
- Journal entries with photos
- Daily devotionals with scripture references
- Group and member management
- Trip statistics and summaries
- Location tracking

## Tech Stack
- **Frontend**: React, TypeScript, Vite, TailwindCSS, Shadcn/UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Express sessions with bcrypt password hashing

## Project Structure
```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Page components
│   │   └── lib/          # Utility functions
│   └── index.html
├── server/               # Backend Express application
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Data access layer
│   ├── db.ts             # Database connection
│   └── vite.ts           # Vite dev server config
├── shared/               # Shared types and schemas
│   └── schema.ts         # Drizzle ORM schema
└── drizzle.config.ts     # Drizzle configuration
```

## Development Commands
- `npm run dev` - Start development server on port 5000
- `npm run db:push` - Push schema changes to database
- `npm run build` - Build for production

## Database Schema
Main tables:
- `users` - User authentication
- `profiles` - User profile information
- `trips` - Trip information
- `groups` - Groups within trips
- `user_roles` - Role assignments (admin/leader/guide/member)
- `journal_entries` - Journal posts
- `journal_photos` - Photos attached to journal entries
- `devotional_entries` - Daily devotional reflections
- `attraction_favorites` - Saved attractions

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Get current session

### User Data
- `GET /api/profile` - Get user profile
- `PATCH /api/profile` - Update profile
- `GET /api/trip` - Get user's trip
- `GET /api/members` - Get trip members
- `GET /api/groups` - Get trip groups

### Journal & Devotional
- `GET /api/journal-entries` - Get journal entries
- `POST /api/journal-entries` - Create journal entry
- `DELETE /api/journal-entries/:id` - Delete journal entry
- `GET /api/devotional-entries` - Get devotional entries
- `POST /api/devotional-entries` - Create/update devotional entry

### Admin Routes
- `GET /api/admin/trips` - Get all trips
- `POST /api/admin/trips` - Create trip
- `PATCH /api/admin/trips/:id` - Update trip
- `DELETE /api/admin/trips/:id` - Delete trip
- (Similar CRUD for groups, profiles, user-roles)

## Recent Changes (Feb 2, 2026)
- Migrated from Supabase to Replit PostgreSQL
- Converted auth from Supabase Auth to session-based auth
- Removed Google OAuth (simplified to email/password only)
- Updated all frontend hooks to use fetch API
- Configured Vite for client/server project structure
- Pushed database schema with Drizzle

## User Preferences
- Chinese Traditional (繁體中文) UI language
- Warm, spiritual design theme with amber/gold primary colors
- Mobile-first responsive design
