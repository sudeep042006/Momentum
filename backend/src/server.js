import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

//importing required files;
import ConnectDB from './config/database';

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

//connecting the DB;
ConnectDB();

app.get('/', (req, res) => {
    res.send('Hello from Momentum Backend!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
}); 