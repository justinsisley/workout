# Requirements

## Functional Requirements

**FR1:** The system shall provide passkey-based authentication for product users using globally unique usernames as identifiers.

**FR2:** The system shall support two distinct user types: Admin users (PayloadCMS built-in) and Product users (custom collection with passkey authentication).

**FR3:** The system shall provide a PayloadCMS admin interface for creating and managing workout programs with embedded milestones, days, and exercise references within a single Programs collection.

**FR3.1:** The system shall support time-based exercise configuration using dual-field duration specification with separate value (numeric) and unit (seconds/minutes/hours) fields for intuitive admin entry and semantic display.

**FR4:** The system shall maintain an exercise library with title, description, video URL, and alternative exercises.

**FR5:** The system shall track user progress through programs including current program, milestone, and day position.

**FR6:** The system shall provide a mobile-optimized workout interface for displaying exercises with inline video playback and fullscreen toggle.

**FR7:** The system shall enable users to log workout completion data including sets, reps, weight, and time for each exercise.

**FR7.1:** The system shall display time-based exercise durations in natural, human-readable format using the original units specified by admins (e.g., "30 seconds", "5 minutes", "1 hour") across all user interfaces.

**FR8:** The system shall auto-populate previous workout data (sets, reps, weight) for subsequent sessions of the same exercise.

**FR9:** The system shall support rest day management through embedded day structures within program milestones, with simple checkbox marking of days as rest days.

**FR10:** The system shall provide program selection interface for users to choose from available workout programs.

**FR11:** The system shall implement gap detection logic to identify days since last workout.

**FR12:** The system shall implement regression rules that mirror workout gaps (5 days off = go back 5 days in program).

**FR13:** The system shall enforce maximum regression limits (can go back to day 1 but never cancel the program).

**FR14:** The system shall provide alternative exercise access during workouts for exercise substitutions.

**FR15:** The system shall enable users to skip exercises when needed during workout sessions.

## Non-Functional Requirements

**NFR1:** The system shall load within 3 seconds on mobile networks during gym use.

**NFR2:** The system shall provide smooth video playback with minimal buffering for exercise demonstrations.

**NFR3:** The system shall maintain 99.9%+ uptime and data persistence reliability.

**NFR4:** The system shall support real-time data saving with offline capability for gym use.

**NFR5:** The system shall provide touch-optimized UI for one-handed operation during gym sessions.

**NFR6:** The system shall maintain user data isolation between primary users (Justin and wife).

**NFR7:** The system shall implement secure username storage and WebAuthN passkey validation.

**NFR8:** The system shall support local development with Docker Compose for MongoDB.

**NFR9:** The system shall be built using Next.js with Tailwind CSS and ShadCN components.

**NFR10:** The system shall use PayloadCMS for unified data management and admin interface.

**NFR11:** The system shall use MongoDB for flexible document structure supporting complex program hierarchies.

**NFR12:** The system shall aim to stay within free/low-cost service limits (hosting only - no third-party authentication services).
