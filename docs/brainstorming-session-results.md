# Workout App Brainstorming Session Results

**Session Date:** September 6, 2025  
**Facilitator:** Business Analyst Mary 📊  
**Participant:** Justin Sisley

## Executive Summary

**Topic:** Personal workout app for household use (Justin and wife)

**Session Goals:** Define features, technical architecture, and development approach for a mobile-optimized workout app using Next.js, PayloadCMS, and MongoDB

**Techniques Used:** User Journey Mapping, Feature Storming, Constraint-Based Innovation

**Total Ideas Generated:** 25+ core features and technical decisions

**Key Themes Identified:**

- Personal use focus (not commercial)
- Mobile-first user experience
- Admin-driven program creation
- Smart progression with safety features
- Unified PayloadCMS ecosystem
- Simple but powerful data structure

## Core Application Concept

### Purpose & Scope

- **Personal fitness tool** for Justin and his wife
- **Admin-driven program creation** via PayloadCMS
- **Mobile-optimized** for gym use
- **No gamification** - pure utility focus
- **Flexible program management** - easy to create/modify workout programs

### Program Structure Hierarchy

```
Program (overall objective)
├── Milestones (themed capabilities)
    ├── Weeks (time-based progression)
        ├── Days (workout sessions OR rest days)
            └── Sessions (collections of exercises with sets/reps)
                └── Exercises (reusable exercise library)
```

## Technical Architecture

### Technology Stack

- **Frontend:** Next.js with Tailwind CSS + ShadCN components
- **Backend:** PayloadCMS (unified data management)
- **Database:** MongoDB (local development via Docker Compose)
- **Authentication:** WebAuthn passkeys for users, standard PayloadCMS auth for admin
- **Deployment:** Local development first, cloud deployment later

### Data Architecture

**Two User Types:**

1. **Admin Users** (PayloadCMS built-in)
   - Access to admin interface
   - Create/manage programs, exercises
2. **Product Users** (Custom collection)
   - WebAuthn passkey authentication
   - Username as user ID
   - No admin access
   - Associated with workout data

### PayloadCMS Collections

- `exercises` (title, description, video URL, alternatives)
- `programs` (name, description, objective, milestone order)
- `milestones` (name, theme, objective, program relationship)
- `weeks` (milestone relationship, week number)
- `days` (week relationship, day number, is_rest_day, session relationship)
- `sessions` (exercises with sets/reps/rest periods)
- `product_users` (username, current program, current milestone, current day)
- `exercise_completions` (user, exercise, reps, sets, weight, time, date)

## Key Features

### Admin Features (PayloadCMS)

- **Program Creation:** Name, description, objective
- **Milestone Management:** Theme, objective, ordering
- **Exercise Library:** Title, description, video URLs
- **Alternative Exercises:** One-to-many relationships for exercise substitutions
- **Auto-derived Data:** Duration estimates
- **Manual Milestone Ordering:** Intentional milestone sequence management
- **Simple Rest Days:** Checkbox to mark days as rest days

### User Features (Mobile App)

- **Dead Simple Onboarding:** Username + passkey → select program → start workout
- **Workout Flow:** Exercise display with video, sets/reps, completion tracking
- **Progress Tracking:** Save actual reps/sets/weight, auto-populate previous values
- **Alternative Exercises:** Quick access to substitute exercises
- **Skip Option:** Ability to skip exercises when needed

### Smart Progression Logic

- **Gap Detection:** Days since last workout
- **Regression Rules:** Mirror the gap (5 days off = go back 5 days)
- **Regression Scope:** Can affect milestone and day pointers, but user stays in same program
- **Maximum Regression:** Can go back to day 1 of program, but never cancels the program
- **Natural Motivation:** Skipping days = losing progress, not just pausing

### Mobile Experience

- **Inline Video Playback:** Quick reference with fullscreen toggle
- **Easy Number Input:** Optimized for reps, sets, weight entry
- **Passkey Auto-fill:** WebAuthn passkey auto-population
- **Gym-Optimized:** Designed for phone use during workouts

## Development Phases

### Phase 1: Foundation & Infrastructure

- Bootstrap Next.js app with Tailwind + ShadCN
- Set up Git repo, Docker Compose for MongoDB
- Get PayloadCMS running locally
- Create all collections and relationships

### Phase 1.5: Data Population

- Manually create first complete program
- Populate all exercises, milestones, weeks, days
- Establish real data foundation for development

### Phase 2: User Authentication

- Research PayloadCMS WebAuthn passkey plugins
- Implement username and passkey authentication
- Create product users collection
- Basic user management

### Phase 3: User-Facing Mobile App

- Program selection interface
- Workout flow with real data
- Exercise completion tracking
- Progress persistence

### Phase 4: Smart Features

- Gap detection and regression logic
- Alternative exercises functionality
- Enhanced mobile UX refinements

## Key Insights & Learnings

### What Makes This Superior to Paper

- **Always available** (phone always with you)
- **Shared access** (both users can work out simultaneously)
- **Structured data** (enables future analytics, AI program generation)
- **Easy program creation** (like creating blog posts in CMS)
- **Future-proof foundation** (ready for advanced features)

### Technical Advantages

- **Unified ecosystem** (everything in PayloadCMS)
- **Real data from day one** (no mock data needed)
- **AI development assistance** (can query actual payload data)
- **Iterative validation** (each phase builds on real data)

### User Experience Philosophy

- **Simplicity over complexity** (no unnecessary features)
- **Mobile-first design** (gym use is primary use case)
- **Natural motivation** (regression creates internal drive)
- **Flexibility** (easy to modify programs as needs change)

## Action Planning

### Top 3 Priority Ideas

**#1 Priority: PayloadCMS Foundation Setup**

- Rationale: Everything builds on this foundation
- Next steps: Research PayloadCMS WebAuthn auth plugins, design collection schemas
- Resources needed: PayloadCMS documentation, MongoDB setup
- Timeline: Week 1

**#2 Priority: First Program Data Population**

- Rationale: Real data enables effective development
- Next steps: Create complete program structure in PayloadCMS
- Resources needed: Exercise library, program details from Justin
- Timeline: Week 2

**#3 Priority: Mobile User Authentication**

- Rationale: Core user experience foundation
- Next steps: Implement WebAuthn passkeys, create product users collection
- Resources needed: WebAuthn library, PayloadCMS auth hooks
- Timeline: Week 3

## Reflection & Follow-up

### What Worked Well

- Clear personal use case eliminated feature bloat
- Technical constraints became creative advantages
- Mobile-first thinking drove key decisions
- Unified PayloadCMS approach simplified architecture

### Areas for Further Exploration

- PayloadCMS plugin ecosystem research
- WebAuthn passkey implementation options
- Mobile UX testing approaches
- Future AI integration possibilities

### Recommended Follow-up Techniques

- Technical architecture deep-dive
- User flow prototyping
- Competitive analysis of existing fitness apps
- Implementation timeline planning

### Questions That Emerged

- Which PayloadCMS plugins exist for WebAuthn authentication?
- What's the best approach for milestone ordering in PayloadCMS?
- How to handle video storage and delivery for exercises?
- What's the optimal mobile input pattern for workout data?

### Next Session Planning

- **Suggested topics:** Technical implementation details, PayloadCMS collection schemas
- **Recommended timeframe:** After initial setup and research
- **Preparation needed:** PayloadCMS documentation review, WebAuthn service research

---

_Session facilitated using the BMAD-METHOD™ brainstorming framework_
