import express, { Request, Response} from 'express';
import pool from '../db';

const sitesRouter = express.Router();

sitesRouter.post('/', async (req: Request, res: Response) => {
    const { name, url } = req.body;
    
    try {
        const userId = req.user?.id

        if(!name || !url) {
            return res.status(400).json({ error: 'Name and URL are required' });
        }

        if(!/^https?:\/\/.+/.test(url)) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        const result = await pool.query(
            'INSERT INTO sites (user_id, name, url) VALUES ($1, $2, $3) RETURNING *',
            [userId, name, url]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

sitesRouter.get('/', async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id

        const result = await pool.query(
            'SELECT * FROM sites WHERE user_id = $1',
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

sitesRouter.get('/:id/stats', async (req: Request, res: Response) => {
    const siteId = req.params.id;
    const lastDay = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    

    try {
        const userId = req.user?.id

        const siteResult = await pool.query(
            'SELECT * FROM sites WHERE id = $1 AND user_id = $2',
            [siteId, userId]
        )

        if (siteResult.rows.length === 0) {
            return res.status(404).json({ error: 'Site not found' });
        }


        const upTime = await pool.query(
            'SELECT COUNT(*) as total_checks, COUNT(*) FILTER (WHERE status = \'up\') as up_checks, AVG(response_time) as avg_response_time FROM history WHERE site_id = $1 AND checked_at >= $2',
            [siteId, lastDay]
        )

        const upPercentage = Math.round(upTime.rows[0].total_checks > 0 ? (upTime.rows[0].up_checks / upTime.rows[0].total_checks) * 100 : 0);
        const avg_response_time = Math.round(upTime.rows[0].avg_response_time * 100) / 100; // Round to 2 decimal places
        
        res.json({
            upPercentage,
            avg_response_time
        });

    }catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

sitesRouter.get('/:id/history', async (req: Request, res: Response) => {
    const siteId = req.params.id;
    const lastDay = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    try {

        const historyResult = await pool.query(
           'SELECT * FROM history WHERE site_id = $1 AND checked_at >= $2 ORDER BY checked_at DESC',
           [siteId, lastDay]
        );

        res.json(historyResult.rows);

    }catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

sitesRouter.delete('/:id', async (req: Request, res: Response) => {
    const siteId = req.params.id;

    try {
        const userId = req.user?.id

        const siteResult = await pool.query(
            'SELECT * FROM sites WHERE id = $1 AND user_id = $2',
            [siteId, userId]
        )

        if (siteResult.rows.length === 0) {
            return res.status(404).json({ error: 'Site not found' });
        }

        await pool.query(
            'DELETE FROM sites WHERE id = $1 AND user_id = $2',
            [siteId, userId]
        );

        res.sendStatus(204);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

export default sitesRouter;