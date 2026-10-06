import express, { Request, Response } from 'express';
import pool from '../db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const authRouter = express.Router();

interface RegisterBody {
    username: string;
    email: string;
    password: string;
}

interface LoginBody {
    username: string;
    password: string;
}

interface User {
    id: number;
    username: string;
    email: string;
    password_hash: string;
    created_at: Date;
}

interface PgError extends Error {
    code?: string;
}

authRouter.post('/register', async (req: Request, res: Response) => {
    const { username, email, password} = req.body as RegisterBody;

    if(!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
            [username, email, hashedPassword]
        );
        res.sendStatus(201);
    } catch (error) {
        console.error(error);
        if (error instanceof Error && (error as PgError).code === '23505') { // Unique violation
            res.status(400).json({ error: 'Username or email already exists' });
        }
        else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
})

authRouter.post('/login', async (req: Request, res: Response) => {
    const {username, password} = req.body as LoginBody;

    if(!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        const user = result.rows[0] as User;
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }


        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

export default authRouter;