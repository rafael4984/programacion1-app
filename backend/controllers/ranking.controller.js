const StudentModel = require('../models/student.model');

const RankingController = {
    getTopRanking: async (req, res) => {
        try {
            const rankingData = await StudentModel.getRanking();
            res.json(rankingData);
        } catch (error) {
            console.error('Error al obtener el ranking:', error);
            res.status(500).json({ error: 'Error interno del servidor al procesar el ranking.' });
        }
    }
};

module.exports = RankingController;