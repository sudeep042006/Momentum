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

import http from 'http';
import { initSocket } from './config/socket.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

const server = http.createServer(app);
initSocket(server);

app.use(cors());
app.use(express.json());

//connecting the DB;
ConnectDB();

// Routes
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/daily-activity', dailyRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/schedules', scheduleRoutes);

app.get('/', (req, res) => {
    res.send('Hello from Momentum Backend!');
});

server.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
}); 