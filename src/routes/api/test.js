import express from 'express';
import db from '../../config/knex.js';

const router = express.Router();
const TABLE = 'test';
const ID_COLUMN = 'test.id_test';

const MESSAGES = {
    DATABASE_ERROR: 'Database error',
    REQUIRED_FIELDS: 'All fields are required!!',
    DATA_NOT_FOUND: 'Data not found',
    DATA_ADDED: 'Data created',
    DATA_UPDATED: 'Data updated',
    DATA_DELETED: 'Data deleted'
};

const handleError = (res, err) => res.status(500).json({ message: MESSAGES.DATABASE_ERROR, error: err.message });

const saveQuestions = async (id_test, pertanyaan, reqBody) => {
    for (const [idp, teks_pertanyaan] of Object.entries(pertanyaan)) {
        const pilihan = reqBody[`pilihan${idp}`] || [];
        const jawaban = reqBody[`jawaban${idp}`];
        const datajson = pilihan.map((text, index) => ({ text, option: jawaban == index ? "1" : "0" }));

        const existing = await db('test_questions').where({ id_test, row_number: idp }).first();
        if (existing) {
            await db('test_questions').where({ id_question: existing.id_question })
                .update({ text_question: teks_pertanyaan, datajson: JSON.stringify(datajson) });
        } else {
            await db('test_questions').insert({ id_test, row_number: idp, text_question: teks_pertanyaan, datajson: JSON.stringify(datajson) });
        }
    }
};

// Create test
router.post('/', async (req, res) => {
    try {
        const { id_product, name_test, desc_test, time_limit = 1, id_test_category, pertanyaan } = req.body;
        if (!id_product || !name_test || !desc_test || !time_limit || !id_test_category || !pertanyaan)
            return res.status(400).json({ message: MESSAGES.REQUIRED_FIELDS });

        const data_product = await db('products').where({ id_product }).first();
        if (!data_product) return res.status(404).json({ message: MESSAGES.DATA_NOT_FOUND });

        const [id_test] = await db(TABLE).insert({
            id_product, name_test, desc: desc_test, time_limit, id_test_category, id_test_type: "1", active: '1'
        });

        await saveQuestions(id_test, pertanyaan, req.body);
        res.status(201).json({ message: MESSAGES.DATA_ADDED, id_test });
    } catch (err) { handleError(res, err); }
});

// Update/Delete test
router.route('/:id')
    .put(async (req, res) => {
        try {
            const { id_product, name_test, desc_test, time_limit = 1, id_test_category, pertanyaan } = req.body;
            if (!id_product || !name_test || !desc_test || !time_limit || !id_test_category || !pertanyaan)
                return res.status(400).json({ message: MESSAGES.REQUIRED_FIELDS });

            const id_test = req.params.id;
            const updatedRows = await db(TABLE).where({ [ID_COLUMN]: id_test })
                .update({ id_product, name_test, desc: desc_test, time_limit, id_test_category, id_test_type: "1", active: '1' });
            if (!updatedRows) return res.status(404).json({ message: MESSAGES.DATA_NOT_FOUND });

            // Hapus pertanyaan yang tidak ada lagi
            const existingRows = await db('test_questions').where({ id_test }).select('row_number');
            const toDelete = existingRows.map(r => r.row_number).filter(x => !Object.keys(pertanyaan).includes(String(x)));
            if (toDelete.length) await db('test_questions').where('id_test', id_test).whereIn('row_number', toDelete).del();

            await saveQuestions(id_test, pertanyaan, req.body);
            res.status(200).json({ message: MESSAGES.DATA_UPDATED, result: id_test });
        } catch (err) { handleError(res, err); }
    })
    .delete(async (req, res) => {
        try {
            await db('test_questions').where({ id_test: req.params.id }).del();
            const deleted = await db(TABLE).where({ [ID_COLUMN]: req.params.id }).del();
            if (!deleted) return res.status(404).json({ message: MESSAGES.DATA_NOT_FOUND });
            res.status(200).json({ message: MESSAGES.DATA_DELETED });
        } catch (err) { handleError(res, err); }
    });

export default router;
