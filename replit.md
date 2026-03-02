# Trip Companion - Pilgrimage Journey App (朝聖之旅)

## Overview
Trip Companion is a web application designed for Christian pilgrimage/mission trips. It enables team members to share journals, devotional entries, track locations, manage groups, and create trip summaries. The application focuses on providing a centralized platform for trip participants to document their spiritual journeys, foster community, and access trip-related information. Key capabilities include user authentication, role-based access control, journaling with photos, daily devotionals, group management, and real-time location tracking. The project aims to enhance the pilgrimage experience through digital tools.

## User Preferences
- Chinese Traditional (繁體中文) UI language
- Warm, spiritual design theme with amber/gold primary colors
- Mobile-first responsive design

## System Architecture
The application follows a full-stack architecture with a React-based frontend, an Express.js backend, and a PostgreSQL database.

**UI/UX Decisions:**
- The user interface is in Traditional Chinese (繁體中文).
- The design theme is warm and spiritual, utilizing amber/gold primary colors.
- The application prioritizes a mobile-first responsive design.
- The main navigation is consolidated into a unified "Daily Journey" page (`/daily-journey`) with three tabs: Morning Devotion, Journal Adventures, and Evening Gratitude.
- Quick actions are compact and refined for improved usability.

**Technical Implementations & Feature Specifications:**
- **Authentication System:** Implemented a token-based authentication system using Express sessions and bcrypt for password hashing. Auth tokens are persistent, stored in a PostgreSQL `auth_tokens` table, allowing users to remain logged in across server restarts. A manual OIDC flow is used for Google login to bypass iframe cookie blocking.
- **Profile Editing:** Profile data persists to the database via `PATCH /api/profile` (upserts if profile doesn't exist). Frontend field mapping: `emergencyContact` → `emergencyContactName`, `emergencyPhone` → `emergencyContactPhone`. Profile loaded from DB on Settings page via `GET /api/profile`.
- **Journaling:** Users can create and edit journal entries with photo attachments. Up to 7 photos per entry are supported, utilizing Replit Object Storage for uploads via presigned URLs. Journal entries are user-specific.
- **Daily Devotionals:** Integrates daily devotionals with scripture references. An admin interface allows for creating and managing devotional content per trip. A new "Evening Gratitude" feature allows users to record gratitude, highlights, and prayers.
- **Trip Management:** Includes a comprehensive trip invitation code system for users to join trips, with admin interfaces for code generation and management.
- **Itinerary & Schedule:** Displays dynamic daily itineraries, including attractions, meals, and lodging. Before a trip starts, a countdown is shown on the homepage.
- **Location Tracking:** Real-time team member location tracking is implemented using Leaflet maps and OpenStreetMap, leveraging the browser's Geolocation API. Locations are auto-refreshed periodically.
- **Data Management:** All data is stored in a PostgreSQL database, managed with Drizzle ORM. Field names are standardized to `camelCase` across the entire codebase and database schema.
- **Admin Features:** Provides extensive admin dashboards for managing trips, users, groups, devotional courses, and invitation codes. Admins can bypass invitation code checks.
- **Error Handling:** Enhanced error handling for geolocation API with specific messages for permission issues and timeouts.
- **Build System:** Uses Vite for client/server/shared project structure and an ESM build for production.

**System Design Choices:**
- **Database Schema:** Standardized schema including `users`, `profiles`, `trips`, `groups`, `user_roles`, `journal_entries`, `journal_photos`, `devotional_entries`, `evening_reflections`, `devotional_courses`, `trip_invitations`, and `auth_tokens` tables.
- **API Structure:** A RESTful API provides endpoints for authentication, user data, journal, devotional, and comprehensive admin functionalities.
- **Modularity:** Project structured with separate `client/`, `server/`, and `shared/` directories for clear separation of concerns.

## External Dependencies
- **Replit Object Storage:** Used for storing journal photos and other media files.
- **Leaflet Maps:** Integrated for displaying interactive maps and team member locations.
- **OpenStreetMap:** Provides map data for location tracking features.
- **Uppy v5:** Used as the file uploader component for managing photo uploads.
- **openid-client:** Utilized for manual OpenID Connect (OIDC) flow to manage Google login without relying on session cookies.