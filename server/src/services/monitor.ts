import pool from '../db';


async function checkAllSites(){
    try {
        const sitesResult = await pool.query('SELECT * FROM sites');
        const sites = sitesResult.rows;

        for ( const site of sites) {
            try {
                const startTime = Date.now();
                const response = await fetch(site.url);
                const responseTime = Date.now() - startTime;
                const httpStatus = response.status;
                let status: string = "down"; // Default status

                if (httpStatus >= 200 && httpStatus < 300) {
                    status = "up"; // Indicate that the site is reachable
                } else if (httpStatus >= 400 && httpStatus < 600) {
                    status = "down"; // Indicate that the site is unreachable
                }

                await pool.query(
                    'INSERT INTO history (site_id, checked_at, status, response_time) VALUES ($1, NOW(), $2, $3)',
                    [site.id, status, responseTime]
                );
            }catch (error) {
                console.error(`Error checking site ${site.url}:`, error);
                const status = "error"; // Indicate that the site is unreachable

                
                await pool.query(
                    'INSERT INTO history (site_id, checked_at, status, response_time) VALUES ($1, NOW(), $2, NULL)',
                    [site.id, status]
                );
            }
        }
    }catch (error) {
        console.error('Error checking sites:', error);
    }
}

setInterval(checkAllSites, 1 * 30 * 1000); // Check every 5 minutes

export default checkAllSites;