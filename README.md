# 🚀 Momentum

**A comprehensive productivity and goal tracking platform designed to help you build momentum, track progress, and achieve your dreams.**

<div align="center">

[Live Demo](https://mommenttum.vercel.app/) • [Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [Contributing](#contributing)

[![GitHub Stars](https://img.shields.io/github/stars/sudeep042006/Momentum?style=flat-square)](https://github.com/sudeep042006/Momentum/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/sudeep042006/Momentum?style=flat-square)](https://github.com/sudeep042006/Momentum/issues)
[![License](https://img.shields.io/badge/license-ISC-blue?style=flat-square)](LICENSE)

</div>

---

## 📋 About

Momentum is an all-in-one productivity platform that combines task management, activity tracking, journaling, scheduling, and milestone planning. Whether you're building new habits, tracking daily progress, or working toward long-term goals, Momentum helps you stay focused and motivated.

### Key Highlights
- 📊 **Track Daily Activity** - Visualize your productivity patterns with an activity calendar
- ✅ **Smart Task Management** - Organize, prioritize, and complete tasks effortlessly
- 📅 **Schedule Planning** - Plan your week and manage your time effectively
- 📝 **Journaling** - Reflect on your journey and document your progress
- 🏆 **Badges & Milestones** - Celebrate achievements and track major goals
- 👥 **Social Profiles** - Share your public profile and inspire others
- 📱 **Real-time Updates** - Live notifications and data synchronization via WebSocket

---

## ✨ Features

### Core Functionality
- **User Authentication** - Secure login, registration, and password management
- **Task Management** - Create, update, delete, and track tasks with due dates
- **Daily Activity Tracking** - Log your daily activities and track consistency
- **Smart Scheduling** - Plan schedules and manage time blocks
- **Personal Journaling** - Write and save journal entries for reflection
- **Badge System** - Earn badges for milestones and achievements
- **Milestone Tracking** - Set and achieve major goals with progress tracking
- **User Profiles** - Build public profiles and share your achievements
- **Activity Calendar** - Visual calendar heatmap of your productivity

### Advanced Features
- 🔐 **Secure Authentication** - Bcrypt password hashing with JWT tokens
- 🖼️ **Image Upload** - Store profile pictures and content images via Cloudinary
- 📡 **Real-time Sync** - WebSocket integration for instant updates
- 🔔 **Scheduled Tasks** - Automated background jobs using node-cron
- 🌐 **CORS Enabled** - Seamless frontend-backend communication
- 📊 **Database Integration** - MongoDB for reliable data persistence

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI library with latest features
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Beautiful icon library
- **Axios** - HTTP client for API calls
- **React Activity Calendar** - Activity visualization component
- **React Tooltip** - Enhanced tooltips

### Backend
- **Express.js** - Fast and minimalist Node.js framework
- **MongoDB & Mongoose** - NoSQL database with ODM
- **Socket.IO** - Real-time bidirectional communication
- **Bcrypt** - Secure password hashing
- **JWT** - Token-based authentication
- **Cloudinary** - Cloud image management
- **Multer** - File upload handling
- **Node-Cron** - Task scheduling
- **Supabase** - Backend as a service

### Infrastructure
- **Deployed Frontend** - Vercel
- **Environment Management** - Dotenv

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB instance (local or cloud)
- Cloudinary account (for image uploads)
- Git

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/sudeep042006/Momentum.git
cd Momentum
```

#### 2. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

#### 3. Setup Frontend

```bash
cd ../web
npm install
```

Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` (or another available port)

#### 4. Build for Production

Frontend:
```bash
cd web
npm run build
```

Backend:
```bash
cd backend
npm run dev  # or your production start command
```

---

## 📁 Project Structure

```
Momentum/
├── backend/
│   ├── src/
│   │   ├── config/         # Database and Socket configuration
│   │   ├── modules/        # Feature modules (users, tasks, journals, etc.)
│   │   ├── server.js       # Main server entry point
│   │   └── .env            # Environment variables
│   └── package.json
│
├── web/
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React Context (UserContext)
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── public/             # Static assets
│   └── package.json
│
└── README.md
```

---

## 🔗 API Endpoints

### Users
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile

### Tasks
- `GET /api/tasks` - Get all user tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Daily Activity
- `GET /api/daily-activity` - Get daily activity log
- `POST /api/daily-activity` - Log daily activity
- `PUT /api/daily-activity/:id` - Update activity

### Schedules
- `GET /api/schedules` - Get user schedules
- `POST /api/schedules` - Create schedule
- `PUT /api/schedules/:id` - Update schedule

### Journals
- `GET /api/journals` - Get all journal entries
- `POST /api/journals` - Create journal entry
- `PUT /api/journals/:id` - Update entry
- `DELETE /api/journals/:id` - Delete entry

### Badges & Milestones
- `GET /api/badges` - Get user badges
- `GET /api/milestones` - Get milestones
- `POST /api/milestones` - Create milestone

---

## 🔐 Authentication

Momentum uses JWT (JSON Web Token) for secure authentication:

1. **Register/Login** - Users provide credentials
2. **Token Generation** - Server returns JWT token
3. **Token Storage** - Token stored in localStorage
4. **Protected Routes** - Routes require valid token
5. **Password Security** - Passwords hashed with bcrypt (10 salt rounds)

---

## 📡 Real-time Features

Socket.IO integration enables:
- Live notifications when activities are logged
- Real-time updates across multiple devices
- Instant badge/milestone notifications
- Live collaboration features

---

## 🎨 UI/UX

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark/Light Mode** - Theme customization support
- **Smooth Animations** - Framer Motion for fluid interactions
- **Accessible Icons** - Lucide React for consistent iconography
- **Toast Notifications** - Real-time feedback to users

---

## 📊 Database Schema

### Key Collections
- **Users** - User accounts, profiles, and authentication
- **Tasks** - User tasks with status and due dates
- **DailyLists** - Daily activity logs and tracking
- **Journals** - Journal entries and reflections
- **Schedules** - Time-blocked schedules
- **Badges** - Achievement badges
- **Milestones** - Long-term goals and tracking

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit changes** (`git commit -m 'Add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- Follow the existing code structure
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed

---

## 🐛 Issues & Support

Found a bug or have a feature request? Please [open an issue](https://github.com/sudeep042006/Momentum/issues) on GitHub.

For support, you can:
- Check existing issues and discussions
- Create a detailed bug report with steps to reproduce
- Suggest features with use cases

---

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- React and Vite communities for excellent tooling
- Tailwind CSS for utility-first CSS framework
- MongoDB for reliable database solutions
- All contributors who help improve Momentum

---

## 📞 Contact

**Author:** [sudeep042006](https://github.com/sudeep042006)

**Live Demo:** [https://mommenttum.vercel.app/](https://mommenttum.vercel.app/)

---

<div align="center">

**Made with ❤️ to help you build momentum and achieve your goals**

[⬆ Back to top](#-momentum)

</div>
