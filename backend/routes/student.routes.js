const express = require('express');
const router = express.Router();
const StudentController = require('../controllers/student.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Endpoint específico para el perfil del alumno logueado actualmente (Mapea 'current')
router.get('/current/profile', authMiddleware, StudentController.getProfileData);

// Endpoint accesible por cualquier rol pasando un ID específico (ej. Admin auditando)
router.get('/:id/profile', authMiddleware, StudentController.getProfileData);

// --- NUEVAS RUTAS CRUD DE ADMINISTRACIÓN ---
router.get('/', authMiddleware, roleMiddleware('ADMIN'), StudentController.getAllStudents);
router.post('/', authMiddleware, roleMiddleware('ADMIN'), StudentController.createStudent);
router.put('/:id', authMiddleware, roleMiddleware('ADMIN'), StudentController.updateStudent);
router.delete('/:id', authMiddleware, roleMiddleware('ADMIN'), StudentController.deleteStudent);

module.exports = router;