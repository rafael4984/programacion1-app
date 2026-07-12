const express = require('express');
const router = express.Router();
const ActivityController = require('../controllers/activity.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// 1. RUTAS FIJAS / ESPECÍFICAS (Siempre van arriba)
// GET a /api/activities
router.get('/', authMiddleware, ActivityController.getAll);

// GET a /api/activities/evaluations/all (Historial de notas)
router.get('/evaluations/all', authMiddleware, roleMiddleware('ADMIN'), ActivityController.getAllEvaluations);

// POST a /api/activities/evaluations (Guardar nueva nota)
router.post('/evaluations', authMiddleware, roleMiddleware('ADMIN'), ActivityController.submitGrade);

// PUT a /api/activities/evaluations/:id (Editar una nota existente)
router.put('/evaluations/:id', authMiddleware, roleMiddleware('ADMIN'), ActivityController.updateEvaluation);

// DELETE a /api/activities/evaluations/:id (Eliminar una nota)
router.delete('/evaluations/:id', authMiddleware, roleMiddleware('ADMIN'), ActivityController.deleteEvaluation);

// POST a /api/activities (Crear actividades)
router.post('/', authMiddleware, roleMiddleware('ADMIN'), ActivityController.create);


// 2. RUTAS DINÁMICAS con :id (Siempre van al final)
// PUT a /api/activities/:id (Editar una actividad)
router.put('/:id', authMiddleware, roleMiddleware('ADMIN'), ActivityController.update);

// DELETE a /api/activities/:id (Eliminar una actividad)
router.delete('/:id', authMiddleware, roleMiddleware('ADMIN'), ActivityController.delete);

module.exports = router;