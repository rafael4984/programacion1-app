// Configuración de URL dinámica para producción y desarrollo
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://vionex-backend-s34l.onrender.com';

// Módulo de gestión para la Ventana de Actividades
export const ActivitiesModule = {
    // Carga inicial y renderizado de la tabla y los selectores
    init: async () => {
        await ActivitiesModule.fetchAndRender();
    },

    // Obtener las actividades del backend y actualizar el DOM
    fetchAndRender: async () => {
        const token = localStorage.getItem('token');
        const tbody = document.getElementById('table-activities-body');
        const selectActivity = document.getElementById('select-activity');

        try {
            await fetch(`${API_BASE_URL}/api/auth`, { 
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const resActivities = await fetch(`${API_BASE_URL}/api/activities`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!resActivities.ok) throw new Error('No se pudieron recuperar las actividades.');
            const activities = await resActivities.json();

            // 1. Renderizar tabla en la pestaña de Actividades
            if (tbody) {
                if (activities.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No hay actividades creadas aún.</td></tr>`;
                } else {
                    tbody.innerHTML = activities.map(act => `
                        <tr>
                            <td style="font-weight: bold; color: var(--brand-light);">${act.id}</td>
                            <td>${act.title}</td>
                            <td style="color: var(--text-muted);">${act.description || 'Sin descripción'}</td>
                        </tr>
                    `).join('');
                }
            }

            // 2. Sincronizar el selector de la pestaña de Notas
            if (selectActivity) {
                selectActivity.innerHTML = '<option value="">-- Seleccionar Actividad --</option>' + 
                    activities.map(act => `<option value="${act.id}">${act.title}</option>`).join('');
            }

        } catch (error) {
            console.error('Error de carga de actividades:', error);
            if (tbody) tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--danger);">Error al conectar con el servidor.</td></tr>`;
        }
    },

    // Enviar los datos del formulario a la BD
    createActivity: async (title, description) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_BASE_URL}/api/activities`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, description })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al procesar la solicitud.');
            }

            await ActivitiesModule.fetchAndRender();
            return true;
        } catch (error) {
            alert(error.message);
            return false;
        }
    }
};