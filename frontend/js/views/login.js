import Storage from '../modules/storage.js';

// Configuración de URL dinámica para producción y desarrollo
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://vionex-backend-s34l.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorDisplay = document.getElementById('login-error');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Previene la recarga de página nativa
        
        // Ocultar errores previos
        if (errorDisplay) {
            errorDisplay.style.display = 'none';
            errorDisplay.textContent = '';
        }

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            showError('Por favor, completa todos los campos.');
            return;
        }

        try {
            // Petición real a la API configurada en el Backend utilizando la URL dinámica
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al intentar iniciar sesión.');
            }

            // Guardar credenciales JWT de forma persistente pero segura en el cliente
            Storage.saveSession(data.token, data.user);

            // Redirección inteligente basada en el Rol real devuelto por PostgreSQL
            if (data.user.role === 'ADMIN' || data.user.role === 'STUDENT') {
                window.location.href = './ranking.html'; 
            } else {
                throw new Error('Rol de usuario no autorizado.');
            }

        } catch (error) {
            showError(error.message);
        }
    });

    function showError(message) {
        if (errorDisplay) {
            errorDisplay.textContent = message;
            errorDisplay.style.display = 'block';
        } else {
            console.error(message);
        }
    }
});