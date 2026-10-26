# Mommenttum — Complete System & Mobile Frontend PRD

**Version:** 1.0.0  
**Project:** Mommenttum (Full-Stack Developer Productivity Platform)  
**Target:** React Native Bare CLI Mobile Application (`mobile/`)  
**Design Language:** Developer-Grade Dark Mode (True Black `#000000` & Emerald `#00E676`)  
**Execution Protocol:** UI files in `.jsx`, Logic in `.js`, User-driven build/bundling.

---

## 1. Executive Summary & Vision

Mommenttum is a developer-grade productivity ecosystem inspired by GitHub contribution graphs, minimalist code editors (Neovim/VSCode), and linear productivity systems. It is engineered for software engineers, builders, and learners who require high focus, zero distractions, and rapid daily execution.

The platform unites **Task Management**, **GitHub-Style Contribution Heatmaps**, **Time-Blocked Scheduling**, **Distraction-Free Journaling & Quotes**, **Streaks & Geometric Badges**, and **Long-Term Milestones** into a single cohesive workspace.

This document serves as the master specification for the **Mobile Frontend (`mobile/`)**, its integration with the existing **Express 5 / MongoDB / Supabase Backend**, and its **Offline-First Synchronization Engine**.

---

## 2. Global Architecture & System Topology

```mermaid
graph TD
    subgraph Client Layer
        WebClient["Web Client (React 19 + Vite)"]
        MobileClient["Mobile Client (React Native CLI Bare)"]
    end

    subgraph Mobile Core Subsystems
        LocalCache["Local Storage & Cache (AsyncStorage)"]
        OutboxQueue["Outbox Mutation Queue"]
        SyncEngine["Offline Sync Engine (NetInfo)"]
        MobileUI["Mobile UI Layer (.jsx Components)"]
        
        MobileUI -->|0ms Read/Write| LocalCache
        MobileUI -->|Enqueues Action| OutboxQueue
        OutboxQueue -->|Drains on Reconnect| SyncEngine
    end

    subgraph Backend Layer
        API["Node.js / Express 5 API"]
        SocketServer["Socket.IO Server (Rooms: user_id)"]
    end

    subgraph Persistence Layer
        MongoDB[(MongoDB Atlas - Core State)]
        Supabase[(Supabase Auth - User Credentials)]
        Cloudinary[(Cloudinary - Profile Images)]
    end

    SyncEngine -->|HTTPS REST| API
    WebClient -->|HTTPS REST| API
    MobileClient -.->|Socket Stream (Phase 2)| SocketServer
    WebClient -.->|Socket Stream (Phase 2)| SocketServer

    API --> Supabase
    API --> MongoDB
    API --> Cloudinary
```

### Verified Infrastructure State
- **Backend Primary URL:** `https://momentum-vh06.onrender.com` (Verified Live & Operational)
- **Backend Fallback URL:** `https://momentum-jdcd.onrender.com`
- **Database:** MongoDB with Mongoose ODM (field-level AES-256-GCM encryption for titles and content).
- **Authentication:** Supabase Auth (`signUp`, `signInWithPassword`, `refreshSession`) + MongoDB `UserProfile`.
- **Host Development Environment:** Windows 11, Node v22.12.0, npm 11.10.0, OpenJDK 17, Android SDK at `D:\Android\Sdk`.

---

## 3. Mandatory Visual Design System

The mobile application strictly embodies a **terminal/developer-tool aesthetic**.

### Color Tokens

| Token | Hex Value | Usage |
| :--- | :--- | :--- |
| `background` | `#000000` | True black primary workspace background. Never navy or blue-grey. |
| `surface` | `#080A08` | Secondary container backgrounds. |
| `card` | `#101310` | Elevated task rows, note cards, and schedule blocks. |
| `input` | `#0B0D0B` | Text inputs and textareas. |
| `border` | `#222922` | Hairline 1px borders for cards, separators, and inputs. |
| `emerald-bright` | `#00E676` | Primary accent: completed checkboxes, active navigation, key buttons. |
| `emerald-deep` | `#087F46` | Secondary accent: intermediate heatmap cells, badges. |
| `emerald-muted` | `#315B43` | Lowest-tier green: subtle tags, category accents. |
| `text-primary` | `#F5F7F5` | Headings, active labels, primary reading text. |
| `text-secondary` | `#A0AAA2` | Timestamps, categories, subheadings. |
| `text-muted` | `#69736B` | Inactive labels, placeholder text, streak icons. |
| `text-disabled` | `#414841` | Disabled controls and unselected options. |

### Contribution Heatmap Palette
- **Level 0 (0% / Empty):** `#101310`
- **Level 1 (1–25%):** `#0d3b1e`
- **Level 2 (26–50%):** `#087F46`
- **Level 3 (51–75%):** `#00b359`
- **Level 4 (76–99%):** `#00E676`
- **Level 5 (100% Complete):** `#5cff9d` (Brightest terminal green)

### Typography & Structure Rules
- **Sans-serif:** Clean system font for headings, notes, and labels.
- **Monospace:** Reserved for completion ratios (e.g., `4/6 • 67%`), time blocks (`09:00 - 10:30`), dates, and streak counters.
- **Radii:** Restrained `8px` to `12px` maximum.
- **Borders over Shadows:** Strict 1px hairline borders (`#222922`) instead of blurred drop shadows.
- **No Gamification Gimmicks:** No confetti, arcade sounds, or cartoon mascots.

---

## 4. Mobile Navigation Architecture

The application implements a **Dual-Tier Navigation Hierarchy**:

```
RootNavigator (.jsx)
├── [Unauthorized] AuthNavigator (.jsx)
│   ├── LoginScreen (.jsx)
│   ├── RegisterScreen (.jsx)
│   └── ForgotPasswordScreen (.jsx)
│
└── [Authorized] DrawerNavigator (.jsx)
    ├── MainBottomTabs (.jsx)
    │   ├── Tab 1: HomeScreen (.jsx)
    │   ├── Tab 2: JournalScreen (.jsx)
    │   ├── Tab 3: TimetableScreen (.jsx)
    │   └── Tab 4: ProfileScreen (.jsx)
    │
    └── Secondary Drawer Screens (.jsx)
        ├── MilestonesScreen (.jsx)
        ├── CommunityScreen (.jsx)
        ├── SettingsScreen (.jsx)
        └── ModulePlaceholderScreen (.jsx) (Analytics & Integrations)
```

---

## 5. Detailed Screen Specifications

### 5.1 Screen One: Home / Daily Productivity (`HomeScreen.jsx`)
- **Header:** Minimal Mommenttum glyph + Drawer hamburger trigger + Today's date banner.
- **Metric Strip:**
  - Today's Completion Ratio (e.g. `4/6 Completed • 67%` with monospace badge).
  - Current Streak counter (`🔥 5 Days` with emerald border).
- **Contribution Heatmap (`ContributionHeatmap.jsx`):**
  - Horizontally scrollable 16-week matrix.
  - 5 discrete green shades based on daily completion rank (`0` to `5`).
  - Auto-scrolls to the current day on paint.
- **Today's Task List:**
  - Virtualized `FlatList` for 60fps rendering.
  - Interactive custom checkboxes (hairline border `#222922` -> emerald checkmark `#00E676` with subtle text strike-through).
  - Priority pills (`low`, `medium`, `high`) and category tags (`work`, `personal`, `health`, `learning`).
  - Optional scheduled time display (`startTime` - `endTime`).
- **Task Creation & Management:**
  - Bottom sheet modal (`AddTaskModal.jsx`) for title, priority, category, and scheduled times.
  - Swipe or icon actions for task deletion and editing.
- **States:** Skeleton loading placeholders, empty workspace prompt, pull-to-refresh.

### 5.2 Screen Two: Journal & Quotes (`JournalScreen.jsx`)
- **Segmented Control:** Pill switch between `Notes` and `Quotes`.
- **Search Header:** Real-time search input filtering entries by title or content.
- **Notes Feed:** Card layout displaying title, markdown/text preview, and relative timestamp (`2h ago`, `Yesterday`).
- **Quotes Feed:** Blockquote cards featuring quote text, stylized quote marks, and author/source attribution.
- **Add / Edit Modal (`JournalEntryModal.jsx`):** Title input, multiline content editor, type toggle (`note` vs `quote`), and public visibility flag.
- **States:** Empty journal prompt, deletion confirmation dialog.

### 5.3 Screen Three: Timetable / Schedule (`TimetableScreen.jsx`)
- **Schedule Mode Selector:** Segmented switch between `Working Days` and `Holidays (Weekend)`.
- **Daily Timeline:**
  - Vertical time-blocked list sorted by `startTime` (12-hour format).
  - Category accents: Routine (Emerald), Work (Blue), Learning (Purple), Break (Amber).
  - Current time indicator (active timeline line if viewed during current hour).
- **Controls & Actions:**
  - Toggle switch: "Auto-sync to Today's Tasks" (`useScheduleForDailyTasks`).
  - Button: "Generate Developer Schedule" (seeds pre-configured schedule template).
  - Button: "Sync to Today Now" (manual one-tap push to `/api/tasks`).
  - Modal (`EditBlockModal.jsx`): Add/edit block with start/end time, title, category, and `addToDailyList` checkbox.

### 5.4 Screen Four: Profile & Progress (`ProfileScreen.jsx`)
- **Header:**
  - User avatar with fallback initials in emerald circle.
  - Name, username, and bio/tagline (`Builder • Learner • Thinker`).
  - Edit Profile modal (updates name, tagline, and Cloudinary profile photo).
- **Productivity Diagnostics:**
  - Monospace cards: Total tasks completed, average completion rate %, focus hours logged, current consecutive streak.
- **Expanded Heatmap:** Full-width annual contribution grid.
- **Badges Showcase (`BadgeCard.jsx`):**
  - Geometric badge cards for 10-day ("Getting Started"), 50-day ("Half Century"), and 100-day ("Momentum Master") milestones.
  - Unlocked: Emerald border + unlock date; Locked: Dimmed `#222922` hairline border.
- **Account Actions:** API connection status, clear local cache, and Logout.

### 5.5 Secondary Drawer Screens
- **Milestones (`MilestonesScreen.jsx`):** Long-term goal cards with completion checkboxes, target dates, and creation modal (connected to `/api/milestones`).
- **Community (`CommunityScreen.jsx`):** Search users (`/api/users/search`), view public profiles (`/api/users/public/:username`), and follow/unfollow.
- **Settings (`SettingsScreen.jsx`):** API health indicator, primary/fallback endpoint status, cache management, app version.
- **Module Placeholders (`ModulePlaceholderScreen.jsx`):** Clean, honest "Coming Soon" screens for Advanced Analytics and External Integrations.

---

## 6. Offline-First Synchronization Engine

The application functions completely without an active internet connection.

### The 4-Pillar Offline Flow

1. **Stale-While-Revalidate (SWR) Local Reads:**
   - Every screen queries `cacheManager.js` first.
   - UI paints in **0ms** directly from phone storage.
   - If connected, a background fetch reconciles any server-side delta updates silently.

2. **Optimistic Local Mutations:**
   - When a user ticks a checkbox or adds a task:
     - The UI updates immediately (zero latency).
     - The updated record is written to local storage.
     - New items receive temporary IDs (`local_uuid`).

3. **Persistent Outbox Queue (`syncQueue.js`):**
   - Every mutation performed while offline is appended to a persistent queue:
     ```json
     {
       "id": "mut_1740319200",
       "endpoint": "/api/tasks/67b901...",
       "method": "PUT",
       "payload": { "status": "completed" },
       "timestamp": 1740319200
     }
     ```

4. **Network Reconnection & Queue Drain (`syncEngine.js`):**
   - `@react-native-community/netinfo` monitors connection state.
   - Upon reconnecting:
     - Sync Engine drains the Outbox queue sequentially (FIFO).
     - Replaces temporary IDs with real MongoDB `_id` values.
     - Displays subtle status banner: *"All changes synced"*.

---

## 7. Complete Backend API Contracts

| Domain | Method | Endpoint | Request Body / Params | Response Data |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/users/register` | `{ name, email, password }` | `{ data: { user, session } }` |
| | `POST` | `/api/users/login` | `{ email, password }` | `{ data: { user, session: { access_token, refresh_token } } }` |
| | `POST` | `/api/users/refresh` | `{ refresh_token }` | `{ data: { session: { access_token, refresh_token } } }` |
| | `POST` | `/api/users/forgot-password` | `{ email }` | `{ message }` |
| | `POST` | `/api/users/reset-password` | `{ newPassword }` | `{ message }` |
| | `GET` | `/api/users/me` | Bearer Token | `{ data: { ...supabaseUser, profile } }` |
| | `POST` | `/api/users/profile` | `multipart/form-data` | `{ data: UserProfile }` |
| | `GET` | `/api/users/profile` | Bearer Token | `{ data: UserProfile }` |
| | `GET` | `/api/users/search?q={query}` | Query param `q` | `{ success: true, data: [UserProfile] }` |
| | `GET` | `/api/users/public/:username`| Path param `username` | `{ success: true, data: { profile, stats, journals, badges } }` |
| | `POST` | `/api/users/:username/follow`| Path param `username` | `{ success: true, message }` |
| | `POST` | `/api/users/:username/unfollow`| Path param `username`| `{ success: true, message }` |
| **Tasks**| `GET` | `/api/tasks?date=YYYY-MM-DD` | Query param `date` | `{ data: [Task] }` (Auto-syncs timetable if today) |
| | `POST` | `/api/tasks` | `{ title, status, priority, category, date, startTime, endTime }` | `{ data: Task }` |
| | `PUT` | `/api/tasks/:id` | `{ title?, status?, priority?, category? }` | `{ data: Task }` |
| | `DELETE`| `/api/tasks/:id` | Path param `id` | `{ message }` |
| | `POST` | `/api/tasks/clone` | `{ fromDate, toDate }` | `{ data: [Task] }` |
| **Daily**| `GET` | `/api/daily-activity/heatmap` | `?startDate=...&endDate=...` | `{ data: [{ date, totalTasks, tasksCompleted, rank }] }` |
| | `GET` | `/api/daily-activity/stats` | None | `{ data: { currentStreak, avgCompletion, tasksFinished, focusHours, recentDays } }` |
| **Journal**| `GET` | `/api/journals` | None | `{ success: true, data: [Journal] }` |
| | `POST` | `/api/journals` | `{ title, content, type: 'note'\|'quote', isPublic }` | `{ success: true, data: Journal }` |
| | `PUT` | `/api/journals/:id` | `{ title, content, type, isPublic }` | `{ success: true, data: Journal }` |
| | `DELETE`| `/api/journals/:id` | Path param `id` | `{ success: true, data: {} }` |
| **Schedule**| `GET`| `/api/schedules` | None | `{ data: { useScheduleForDailyTasks, workingDays, holidays } }` |
| | `PUT` | `/api/schedules` | `{ workingDays?, holidays?, useScheduleForDailyTasks? }` | `{ data: Schedule }` |
| | `POST` | `/api/schedules/generate` | None | `{ data: Schedule }` |
| | `POST` | `/api/schedules/sync` | None | `{ message, count, scheduleType }` |
| **Badges**| `GET` | `/api/badges` | None | `{ user, total_streak, badges: [{ badge_name, badge_image, unlocked_at }] }` |
| **Milestones**| `GET` | `/api/milestones` | None | `{ data: [Milestone] }` |
| | `POST` | `/api/milestones` | `{ title, description, targetDate }` | `{ data: Milestone }` |
| | `PUT` | `/api/milestones/:id/toggle` | Path param `id` | `{ data: Milestone }` |
| | `DELETE`| `/api/milestones/:id` | Path param `id` | `{ message }` |

---

## 8. Directory Structure & File Extension Blueprint

```
mobile/
├── android/                         # Native Android project (Gradle, SDK 34)
├── ios/                             # Native iOS project
│
├── src/
│   ├── api/                         # 🌐 Pure Logic / Network (.js)
│   │   ├── apiClient.js
│   │   ├── authApi.js
│   │   ├── taskApi.js
│   │   ├── dailyApi.js
│   │   ├── journalApi.js
│   │   ├── scheduleApi.js
│   │   ├── badgeApi.js
│   │   └── milestoneApi.js
│   │
│   ├── storage/                     # 💾 Local Persistent Storage (.js)
│   │   ├── localStorage.js          # AsyncStorage wrapper
│   │   ├── cacheManager.js          # In-memory and local cache
│   │   └── syncQueue.js             # Outbox queue
│   │
│   ├── sync/                        # 🔄 Offline-to-Backend Sync (.js)
│   │   ├── syncEngine.js            # Queue drain orchestrator
│   │   └── networkMonitor.js        # NetInfo event handler
│   │
│   ├── context/                     # 🧠 Application Contexts (.jsx)
│   │   ├── AuthContext.jsx
│   │   ├── TaskContext.jsx
│   │   └── SyncContext.jsx
│   │
│   ├── navigation/                  # 🧭 Navigation Components (.jsx)
│   │   ├── RootNavigator.jsx
│   │   ├── AuthNavigator.jsx
│   │   ├── DrawerNavigator.jsx
│   │   ├── BottomTabNavigator.jsx
│   │   └── CustomDrawerContent.jsx
│   │
│   ├── screens/                     # 📱 Presentation Views (.jsx)
│   │   ├── auth/
│   │   │   ├── LoginScreen.jsx
│   │   │   ├── RegisterScreen.jsx
│   │   │   └── ForgotPasswordScreen.jsx
│   │   ├── home/
│   │   │   ├── HomeScreen.jsx
│   │   │   └── components/
│   │   │       ├── TodayHeader.jsx
│   │   │       ├── ContributionHeatmap.jsx
│   │   │       ├── StreakBadge.jsx
│   │   │       ├── TaskRow.jsx
│   │   │       └── AddTaskModal.jsx
│   │   ├── journal/
│   │   │   ├── JournalScreen.jsx
│   │   │   └── components/
│   │   │       ├── JournalCard.jsx
│   │   │       └── JournalEntryModal.jsx
│   │   ├── timetable/
│   │   │   ├── TimetableScreen.jsx
│   │   │   └── components/
│   │   │       ├── ScheduleBlockRow.jsx
│   │   │       └── EditBlockModal.jsx
│   │   ├── profile/
│   │   │   ├── ProfileScreen.jsx
│   │   │   └── components/
│   │   │       ├── ProfileHeader.jsx
│   │   │       ├── BadgeCard.jsx
│   │   │       └── EditProfileModal.jsx
│   │   └── secondary/
│   │       ├── MilestonesScreen.jsx
│   │       ├── CommunityScreen.jsx
│   │       ├── SettingsScreen.jsx
│   │       └── ModulePlaceholderScreen.jsx
│   │
│   ├── components/                  # 🧩 Reusable Common UI (.jsx)
│   │   ├── AppHeader.jsx
│   │   ├── CustomCheckbox.jsx
│   │   ├── SegmentedControl.jsx
│   │   ├── SyncStatusBar.jsx
│   │   ├── EmptyState.jsx
│   │   ├── LoadingSkeleton.jsx
│   │   └── ConfirmationDialog.jsx
│   │
│   ├── theme/                       # 🎨 Design System Tokens (.js)
│   │   ├── colors.js
│   │   ├── typography.js
│   │   └── spacing.js
│   │
│   └── utils/                       # 🛠️ Helpers (.js)
│       ├── dateUtils.js
│       └── timeUtils.js
│
├── App.jsx                          # Root UI Provider
├── index.js                         # React Native AppRegistry entry
├── tailwind.config.js               # NativeWind Tailwind configuration
├── babel.config.js                  # Babel plugins (NativeWind + Reanimated)
├── metro.config.js                  # Metro bundler config
└── package.json
```

---

## 9. Absolute Development Rules & Workflow Protocol

1. **The Forever Build Command Rule**:
   - The AI Assistant will **NEVER** run `npm start`, `npx react-native start`, `npm run android`, `npx react-native run-android`, or any bundling or dev server process.
   - All build, installation, and bundler commands are prepared clearly and handed over to the **USER** to execute in their terminal.

2. **File Extension Law**:
   - Any file containing JSX / React components MUST use the `.jsx` extension.
   - Any pure logic, helper, configuration, storage, or API file MUST use the `.js` extension.

3. **No Unnecessary Dependencies**:
   - Bare React Native CLI. No Expo libraries.
   - Icons powered exclusively by `lucide-react-native` + `react-native-svg`.
   - Styling handled strictly by `nativewind` and React Native primitives.

4. **Phase Prioritization**:
   - **Phase 1 (Immediate Target):** Complete Bare React Native app with 100% offline-first storage and automatic sync to the Express backend.
   - **Phase 2 (Final Module):** Real-time Socket.IO live-sync across mobile and web simultaneously.
