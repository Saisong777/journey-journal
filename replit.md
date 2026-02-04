# Trip Companion - Pilgrimage Journey App (朝聖之旅)

## Overview
Trip Companion is a web application designed for Christian pilgrimage/mission trips. It enables team members to share journals, devotional entries, track locations, manage groups, and create trip summaries. The UI is in Chinese Traditional (繁體中文) with a warm spiritual design using amber/gold colors.

## Project Status
**Completed** - Successfully migrated from Lovable/Supabase to Replit's fullstack environment with PostgreSQL.

## Recent Changes (February 4, 2026)
- **Dynamic Homepage**: Connected homepage to real database data
  - Fetches current trip info, today's schedule, and member count
  - Dynamic greetings based on time of day
  - Real-time trip card with actual dates and member count
- **Daily Itinerary Display**: TodaySchedule component shows real trip day data
  - Parses highlights into schedule items with times
  - Shows meals (breakfast, lunch, dinner) and lodging
  - Highlights the next upcoming activity
- **Daily Devotional**: Shows Bible references from current trip day
- **Trip Days Management**: Admin interface for managing daily itineraries
  - CRUD operations for trip days
  - CSV-based data structure support
- **Trip Data Import**: Imported 16-day Turkey-Greece pilgrimage itinerary
  - Complete with Bible references, highlights, meals, and lodging
- **New API Endpoint**: Added `/api/trip-days/today` for today's schedule
- **Dynamic Attractions Page**: Attractions now display based on trip itinerary
  - Parses highlights from trip_days to extract attractions
  - Filters by day number
  - Shows Bible references and location for each attraction
  - Only displays attractions from current trip
- **Token-based authentication**: Replaced cookie-based sessions with JWT-like tokens stored in localStorage to bypass Replit iframe third-party cookie restrictions
- **Interactive Map**: Implemented real-time team member location tracking with Leaflet maps
  - Real OpenStreetMap integration
  - Share location button using browser Geolocation API
  - Auto-refresh every 30 seconds
  - Visual markers for team members with popup info
- **Location API endpoints**: Added `/api/locations`, `/api/my-location` for location tracking

### Previous Changes (February 2, 2026)
- Fixed duplicate `/api/trip` route in routes.ts
- Standardized all field names to camelCase throughout the codebase
- Fixed AdminMembers.tsx to use camelCase field references (userId, tripId, groupId, profileId)
- Added proper null checks for tripId in API routes
- Global admin role system with nullable trip_id for system-wide permissions
- **Auto-assignment of trips**: New users are automatically assigned to the first available trip when they register
- **Login trip assignment**: Existing users without a trip are automatically assigned when they login
- Added `updateUserRoleTrip` method to storage for updating user role trip assignments

### Migration Summary
- Completely removed all Supabase dependencies (`@supabase/supabase-js`)
- Deleted all Supabase-related configuration files and migration folders
- Implemented token-based authentication (tokens stored in localStorage, sent via Authorization header)
- Created Drizzle ORM schema matching original Supabase structure
- Built RESTful API endpoints for all features
- Updated all frontend hooks to use fetch API instead of Supabase client
- Configured Vite for client/server/shared project structure
- Standardized all API responses and frontend components to use camelCase field names

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
