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
- **Landing Page:** A public landing page at `/welcome` with the app branding, tagline ("享受一段與神同行的旅程！"), and a login button. Unauthenticated users are redirected here instead of directly to `/auth`. Already-authenticated users are automatically redirected to the home dashboard.
- **Authentication System:** Implemented a token-based authentication system using Express sessions and bcrypt for password hashing. Auth tokens are persistent, stored in a PostgreSQL `auth_tokens` table, allowing users to remain logged in across server restarts (7-day expiry). A manual OIDC flow is used for Google login to bypass iframe cookie blocking. Users remain logged in until they explicitly log out or the token expires. Login page supports temp password login with clear helper text. Password change available in ProfileEditSheet (`PATCH /api/auth/change-password`), which clears `tempPassword` on success.
- **First-Login Profile Setup:** When an imported member (with `tempPassword` set) logs in, `ProtectedRoute` checks `GET /api/auth/needs-profile-setup` and redirects to `/settings?setup=1`. The Settings page shows a welcome banner and auto-opens the profile edit sheet. After saving, user is redirected to the home dashboard and the setup flag is cleared.
- **Profile Editing:** Profile data persists to the database via `PATCH /api/profile` (upserts if profile doesn't exist). Frontend field mapping: `emergencyContact` → `emergencyContactName`, `emergencyPhone` → `emergencyContactPhone`. Profile loaded from DB on Settings page via `GET /api/profile`.
- **Journaling:** Users can create and edit journal entries with photo attachments. Up to 7 photos per entry are supported, utilizing Replit Object Storage for uploads via presigned URLs. Journal entries are user-specific.
- **Daily Devotionals:** Integrates daily devotionals with scripture references. An admin interface allows for creating and managing devotional content per trip. A new "Evening Gratitude" feature allows users to record gratitude, highlights, and prayers.
- **Trip Management:** Includes a comprehensive trip invitation code system for users to join trips, with admin interfaces for code generation and management. Invitation codes are 4-character alphanumeric (excluding ambiguous chars like 0/O/1/I/L). Each code has a QR code generated via `qrcode.react` that links to `/verify-trip?code=XXXX` for easy scanning. The VerifyTrip page auto-fills the code from URL parameters.
- **Itinerary & Schedule:** Displays dynamic daily itineraries, including attractions, meals, and lodging. Before a trip starts, a countdown is shown on the homepage.
- **Location Tracking:** Real-time team member location tracking is implemented using Leaflet maps and OpenStreetMap, leveraging the browser's Geolocation API. Locations are auto-refreshed periodically.
- **Data Management:** All data is stored in a PostgreSQL database, managed with Drizzle ORM. Field names are standardized to `camelCase` across the entire codebase and database schema.
- **Admin Features:** Provides extensive admin dashboards for managing trips, users, groups, devotional courses, and invitation codes. Admins can bypass invitation code checks. CSV import for batch member creation (Name + Email → auto-generates 4-digit temp password, creates user/profile/role). Email notification system via Resend API sends pre-trip welcome emails with invitation codes, temp passwords, and QR codes. Two separate management concepts: **會員管理** (`/admin/members`) for platform-level user management (all registered users, edit name/email/phone, assign/remove trips, set platform role, delete account), and **團員管理** (inside each trip in `/admin/trips`) for per-trip participant management (add/import/edit role/group/remove from trip, send notifications). A user (會員) can participate in multiple trips as a 團員.
- **Platform Role System:** A new `platform_roles` table manages platform-level permissions separate from trip-scoped `user_roles`. Five roles: **總管理員 (super_admin)** — full site management, only role that can assign permissions; **管理團隊 (management)** — module-specific permissions via checkboxes; **導遊 (guide)** — trip management; **VIP (vip)** — future benefits; **會員 (member)** — default. The `requireSuperAdmin` middleware guards role assignment endpoints. `requireAdmin` checks both old admin role and new platform roles (super_admin or management). The `GET /api/is-admin` endpoint returns `{ isAdmin, isSuperAdmin, platformRole, permissions }`. New endpoints: `PATCH /api/admin/users/:userId/platform-role`, `POST /api/admin/users/:userId/trips`, `DELETE /api/admin/users/:userId/trips/:tripId`.
- **Trip Notes (注意事項):** Region-based trip notes system. Each note = one region's complete guide (e.g. 土耳其, 以色列, 日本). Admin manages regional notes in "注意事項管理" (`/admin/trip-notes`), then assigns them to specific trips via checkboxes in "旅程管理". Each trip also has a `specialRemarks` field for independent special remarks. Users see assigned regional notes + special remarks in the "注意事項" tab of the Tools page (`/tools`). Content is formatted with `【section】` headings rendered as styled headers. Tables: `trip_notes` (id, title=region name, content=full guide), `trip_note_assignments` (tripId, noteId, sortOrder), and `trips.special_remarks` column. Endpoints: `GET/POST/PATCH/DELETE /api/admin/trip-notes`, `GET/POST/DELETE /api/admin/trips/:tripId/notes`, `PATCH /api/admin/trips/:tripId/remarks`, `GET /api/trips/current/notes`, `GET /api/trips/current/remarks`. Startup migration auto-merges old individual notes into regional format.
- **Error Handling:** Enhanced error handling for geolocation API with specific messages for permission issues and timeouts.
- **Build System:** Uses Vite for client/server/shared project structure and an ESM build for production.

**System Design Choices:**
- **Database Schema:** Standardized schema including `users`, `profiles`, `trips`, `groups`, `user_roles`, `journal_entries`, `journal_photos`, `devotional_entries`, `evening_reflections`, `devotional_courses`, `trip_invitations`, `auth_tokens`, `platform_roles`, `trip_notes`, and `trip_note_assignments` tables.
- **API Structure:** A RESTful API provides endpoints for authentication, user data, journal, devotional, and comprehensive admin functionalities.
- **Modularity:** Project structured with separate `client/`, `server/`, and `shared/` directories for clear separation of concerns.

## External Dependencies
- **Replit Object Storage:** Used for storing journal photos and other media files.
- **Leaflet Maps:** Integrated for displaying interactive maps and team member locations.
- **OpenStreetMap:** Provides map data for location tracking features.
- **Uppy v5:** Used as the file uploader component for managing photo uploads.
- **openid-client:** Utilized for manual OpenID Connect (OIDC) flow to manage Google login without relying on session cookies.
- **Resend:** Integrated via Replit connector for sending transactional emails (pre-trip notifications with invitation codes, temp passwords, and QR codes).