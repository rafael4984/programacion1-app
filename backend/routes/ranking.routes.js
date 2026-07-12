const express = require('express');
const router = express.Router();
const RankingController = require('../controllers/ranking.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Endpoint protegido: cualquier usuario logueado (docente o alumno) puede ver el ranking
router.get('/', authMiddleware, RankingController.getTopRanking);

module.exports = router;