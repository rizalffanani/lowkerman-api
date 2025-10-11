import express from 'express';
import { authenticateToken, authorizeRole } from '../../middlewares/auth.js';
import pagination from '../../middlewares/pagination.js';
import paymentService from '../../services/payment.services.js';

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

router.get('/', authenticateToken, authorizeRole(['admin']), pagination, async (req, res) => {
    const { search = '', sort = '', order = '', limit = 10, page = 1 } = req.query;
    try {
        const [data, totalData] = await paymentService.getAll(search, sort, order, limit, page);
        res.status(200).json({
            total: totalData,
            page, limit,
            totalPages: Math.ceil(totalData / limit),
            data,
        });
    } catch (err) { handleError(res, err); }
});

export default router;
