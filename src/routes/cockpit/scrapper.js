import express from 'express';
import puppeteer from 'puppeteer';
import { authenticateToken, authorizeRole } from '../../middlewares/auth.js';

const router = express.Router();

const MESSAGES = {
    DATABASE_ERROR: 'Database error',
    DATA_UPDATED: 'City updated',
};

const handleError = (res, err) => res.status(500).json({ message: MESSAGES.DATABASE_ERROR, error: err.message });

router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { urls } = req.body;
    if (!Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ error: 'Invalid URLs' });
    }

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const results = [];

    for (const url of urls) {
        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            const data = await page.evaluate(() => {
                const getText = (selector) => document.querySelector(selector)?.innerText || null;
                return {
                    title: document.querySelector('h1')?.innerText || null,
                    deskripsi: getText('.deskripsi-block'),
                    perusahaan: getText('.perusahaan'),
                };
            });

            results.push({ url, ...data });
        } catch (err) {
            results.push({ url, error: err.message });
            handleError(res, err);
        }
    }

    await browser.close();
    // res.json(results);
    res.status(200).json({ message: MESSAGES.DATA_UPDATED, result: results });
});

export default router;
