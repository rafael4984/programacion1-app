const app = require('./app');
const cors = require('cors');

// Configuración de CORS para permitir peticiones desde tu Frontend en Vercel
app.use(cors({
    origin: 'https://programacion1-app.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor de Vionex corriendo exitosamente en el puerto ${PORT}`);
});