import 'dotenv/config';
import express, { Request, Response } from 'express';
import pool from './db';
import authRouter from './routes/auth';
import sitesRouter from './routes/sites';
import authMiddleware from './middleware/authMiddleware';
import './services/monitor';
import cors from 'cors';


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json())
app.use(cors())
app.use('/api/auth', authRouter);
app.use('/api/sites', authMiddleware, sitesRouter);

app.get('/health', async (req: Request, res: Response) => {
  res.json({ status: 'ok', dbTime: (await pool.query('SELECT NOW()')).rows[0] });
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});