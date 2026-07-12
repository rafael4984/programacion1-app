const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // 1. Obtener el token del encabezado Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token válido.' });
    }

    try {
        // 2. Verificar el token usando tu clave secreta exacta del .env
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ClaveSecretaUltraSeguraParaFirmarTokens2026');
        
        // 3. Inyectar los datos del usuario logueado en la petición
        req.user = decoded; 
        
        next(); // Continuar al controlador de forma limpia
    } catch (error) {
        console.error('❌ ERROR EN AUTH_MIDDLEWARE:', error.message);
        return res.status(403).json({ error: 'Token inválido o expirado. Por favor, inicie sesión nuevamente.' });
    }
};

module.exports = authMiddleware;