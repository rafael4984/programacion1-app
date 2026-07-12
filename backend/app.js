const express = require('express');
const cors = require('cors');
const path = require('path'); // Requerido para manejar rutas de carpetas de forma segura
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const activityRoutes = require('./routes/activity.routes'); // INYECTADO: Ruta de actividades
const studentRoutes = require('./routes/student.routes');   // INYECTADO: Ruta de alumnos
const rankingRoutes = require('./routes/ranking.routes');   // INYECTADO: Ruta de ranking

const app = express();

// Middlewares globales profesionales - Configurado con permisos explícitos para desarrollo local
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'], // Orígenes permitidos desde Live Server
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// LOG INTERNO: Monitoreo inmediato en consola para ver si el fetch toca el backend
app.use((req, res, next) => {
    console.log(`📡 Petición detectada en Express: ${req.method} ${req.url}`);
    next();
});

// Inyección de rutas funcionales de la API
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes); // INYECTADO: Enrutador de actividades
app.use('/api/students', studentRoutes);   // INYECTADO: Enrutador de alumnos
app.use('/api/ranking', rankingRoutes);     // INYECTADO: Enrutador de ranking activo

// Ruta de estado de la API
app.get('/api/status', (req, res) => {
    res.json({ status: 'online', message: 'Servidor de Programación I operando correctamente.' });
});

// ====== CONFIGURACIÓN PARA SERVIR EL FRONTEND ======
// Le indicamos a Express que sirva todos los archivos estáticos de la carpeta 'frontend'
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// SOLUCIÓN: Si entran a la raíz (/), los mandamos directo a tu hermosa vista de login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'views', 'login.html'));
});

// Si escriben cualquier otra ruta inexistente, también los aseguramos mandándolos al login
app.use((req, res) => {
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ error: `La ruta de la API [${req.url}] no se encuentra mapeada.` });
    }
    res.sendFile(path.join(__dirname, '..', 'frontend', 'views', 'login.html'));
});
// ===================================================

module.exports = app;