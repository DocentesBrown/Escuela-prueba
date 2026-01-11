// ============================================================================
// ARCHIVO: Core.js
// ============================================================================

// --- TU URL DE GOOGLE APPS SCRIPT (CAMBIALA SI ES NECESARIO) ---
const URL_API = "https://script.google.com/macros/s/AKfycbyTGnoS8hevr6k7pXE16p7KtcQxYrYP0yc11yJoJyvfX8Z7pEKJ5ZYymJ--IBcoVqUB/exec"; 

// --- VARIABLES GLOBALES ---
let usuarioActual = null;
let baseDatosAlumnos = []; 
let baseDatosDocentes = []; 
let baseDatosPreceptores = [];

// ==========================================
// LOGIN Y DASHBOARD
// ==========================================

async function iniciarSesion() {
    const email = document.getElementById('email').value;
    const clave = document.getElementById('clave').value;
    const btn = document.getElementById('btn-login');
    const errorMsg = document.getElementById('error-msg');
    
    btn.innerText = "Verificando...";
    btn.disabled = true;
    errorMsg.classList.add('d-none');

    try {
        const resp = await fetch(`${URL_API}?op=login&email=${email}&pass=${clave}`);
        const data = await resp.json();

        if (data.status === 'success') {
            usuarioActual = data;
            cargarDashboard(data);
        } else {
            errorMsg.innerText = data.message;
            errorMsg.classList.remove('d-none');
        }
    } catch (e) {
        console.error(e);
        errorMsg.innerText = "Error de conexión.";
        errorMsg.classList.remove('d-none');
    } finally {
        btn.innerText = "Ingresar";
        btn.disabled = false;
    }
}

function cargarDashboard(user) {
    document.getElementById('login-screen').classList.add('d-none');
    document.getElementById('dashboard-screen').classList.remove('d-none');
    document.getElementById('user-name').innerText = `${user.nombre} (${user.rol})`;

    const menu = document.getElementById('menu-lateral');
    menu.innerHTML = '';
    const rol = String(user.rol).trim().toLowerCase(); 

    if (rol === 'directivo') {
        menu.innerHTML += `
            <button class="list-group-item list-group-item-action" onclick="verEstudiantes()">👥 Gestión Estudiantes</button>
            <button class="list-group-item list-group-item-action" onclick="verDocentes()">🎓 Gestión Docentes</button>
            <button class="list-group-item list-group-item-action" onclick="verPreceptores()">👨‍🏫 Gestión Preceptores</button>
        `;
    }
    if (rol === 'preceptor') {
        menu.innerHTML += `
            <button class="list-group-item list-group-item-action" onclick="iniciarModuloPreceptor()">📝 Tomar Asistencia</button>
            <button class="list-group-item list-group-item-action bg-info text-white" onclick="verContactosDocentes()">📞 Contactar Docentes</button>
        `;
        iniciarModuloPreceptor(); 
    }
    if (rol === 'docente') {
        menu.innerHTML += `
            <button class="list-group-item list-group-item-action bg-primary text-white" onclick="iniciarModuloDocente()">🏫 Mis Cursos</button>
            <button class="list-group-item list-group-item-action" onclick="verMisDatosDocente()">👤 Mis Datos</button>
        `;
        iniciarModuloDocente();
    }
    menu.innerHTML += `<button class="list-group-item list-group-item-action text-danger mt-3" onclick="location.reload()">Cerrar Sesión</button>`;
}

function calcularEdad(fechaString) {
    if (!fechaString) return "-";
    const hoy = new Date();
    const nacimiento = new Date(fechaString);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) { edad--; }
    return isNaN(edad) ? "-" : edad + " años";
}
