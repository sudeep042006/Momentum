import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

//importing required files;
import ConnectDB from './config/database.js';
import userRoutes from './modules/users/user.routes.js';
import taskRoutes from './modules/tasks/task.routes.js';
import dailyRoutes from './modules/daily-lists/daily.routes.js';
import badgeRoutes from './modules/badges/badge.routes.js';
import scheduleRoutes from './modules/schedules/schedule.routes.js';
import journalRoutes from './modules/journals/journal.routes.js';   
import milestoneRoutes from './modules/milestones/milestone.routes.js';
import http from 'http';
import { initSocket } from './config/socket.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

const server = http.createServer(app);
initSocket(server);

// app.use(cors());
app.use(cors({ origin: '*' }));
app.use(express.json());

//connecting the DB;
ConnectDB();

// Routes
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/daily-activity', dailyRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/milestones', milestoneRoutes);

app.get('/', (req, res) => {
    res.send('Hello from Momentum Backend!');
});

server.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
    
    // Prevent Render Free Tier from sleeping by pinging itself every 14 minutes
    const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes
    const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    
    setInterval(async () => {
        try {
            const res = await fetch(url);
            console.log(`[Self-Ping] Successfully pinged ${url} - Status: ${res.status}`);
        } catch (error) {
            console.error(`[Self-Ping] Failed to ping ${url}:`, error.message);
        }
    }, PING_INTERVAL);
}); 