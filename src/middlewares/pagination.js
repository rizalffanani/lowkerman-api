const pagination = (req, res, next) => {
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
        return res.status(400).json({ message: 'Invalid page or limit' });
    }

    req.pagination = {
        page,
        limit,
        offset: (page - 1) * limit,
    };

    next();
};

module.exports = pagination;
