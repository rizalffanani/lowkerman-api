import express from 'express';
import axios from 'axios';
import db from '../../config/knex.js';

const router = express.Router();

const MESSAGES = {
    DATABASE_ERROR: 'Database error',
    REQUIRED_FIELDS: 'All fields are required',
    DATA_EXISTS: 'Data already exists',
    DATA_NOT_FOUND: 'Data not found',
    DATA_ADDED: 'Data added',
    DATA_UPDATED: 'Data updated',
    DATA_DELETED: 'Data deleted',
    STATUS_UPDATED: 'Status updated successfully',
    INVALID_STATUS: 'Active status is required'
};

const handleError = (res, err) => res.status(500).json({ message: MESSAGES.DATABASE_ERROR, error: err.message });

router.post('/', async (req, res) => {
    const { username, freelanceId } = req.body;
    const bot_token = process.env.BOT_TOKEN;
    const channel_id = process.env.CHANNEL_ID;

    if (!username || !freelanceId) return res.status(400).json({ message: MESSAGES.REQUIRED_FIELDS });

    try {
        const cek_users = await db('users').where({ username }).first();
        if (!cek_users) return res.status(400).json({ message: MESSAGES.DATA_EXISTS });

        let cek_freelance = await db('freelancers')
            .select('*')
            .leftJoin('users', 'freelancers.id_user', 'users.id_user')
            .where('freelancers.id_freelance', freelanceId)
            .first()
        if (!cek_freelance) return res.status(400).json({ message: MESSAGES.DATA_EXISTS });

        // Pastikan link selalu lengkap
        const freelanceLink = /^https?:\/\//.test(cek_freelance.link_url)
            ? cek_freelance.link_url
            : `https://${cek_freelance.link_url}`;

        const userLink = /^https?:\/\//.test(cek_users.link_url)
            ? cek_users.link_url
            : `https://${cek_users.link_url}`;

        // Buat pesan dengan format HTML
        const message = `
            Mendapat order
            Username: <b>${cek_freelance.username}</b>
            Nama: ${cek_freelance.name}
            Link: <a href="${freelanceLink}">${freelanceLink}</a>
            __________________________________
            Dari
            Username: <b>${cek_users.username}</b>
            Nama: ${cek_users.name}
            Link: <a href="${userLink}">${userLink}</a>
        `;

        const data = {
            chat_id: channel_id,
            text: message,
            parse_mode: 'HTML',
            disable_web_page_preview: true
        };

        const url = `https://api.telegram.org/bot${bot_token}/sendMessage`;

        try {
            const response = await axios.post(url, data);
            if (response.data.ok) {
                return res.status(201).json({ message: 'Reservasi Telah Diajukan, anda akan dihubungi melalui WA!', result: { data } });
            } else {
                return res.status(400).json({ message: `Reservasi Gagal. (${response.data.description || 'Unknown error'})` })
            }
        } catch (error) {
            return res.status(400).json({ message: `Reservasi Gagal. (${error.message})` })
        }
    } catch (err) { handleError(res, err); }
});

export default router;