const app = require('./app');
// ====== SCRIPT TEMPORAL DE EMERGENCIA ======
const bcrypt = require('bcryptjs');
const db = require('./config/db');
(async () => {
    try {
        const salt = await bcrypt.genSalt(10);
        const nuevoHash = await bcrypt.hash('Rafael4984', salt);
        
        // Limpiamos y aseguramos el insert perfecto desde Node
        await db.query('DELETE FROM users WHERE username = $1', ['43633237']);
        await db.query(
            'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
            ['43633237', nuevoHash, 'ADMIN']
        );
        console.log('🔑 [Node.js] Usuario Administrador verificado y re-encriptado con éxito.');
    } catch (err) {
        console.error('❌ Error en el script de emergencia:', err.message);
    }
})();
// ===========================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor Full Stack Senior corriendo en http://localhost:${PORT}`);

    const fs = require('fs');
const path = require('path');

console.log('--------------------------------------------------');
console.log('📁 Ubicación actual de server.js:', __dirname);
console.log('📂 Contenido de la carpeta raíz del proyecto:', fs.readdirSync(path.join(__dirname, '..')));
try {
    console.log('🎨 Buscando CSS en:', path.join(__dirname, '..', 'frontend', 'css'));
    console.log('📄 Archivos CSS encontrados:', fs.readdirSync(path.join(__dirname, '..', 'frontend', 'css')));
} catch (e) {
    console.log('❌ Error al buscar la carpeta frontend:', e.message);
}
console.log('--------------------------------------------------');
});