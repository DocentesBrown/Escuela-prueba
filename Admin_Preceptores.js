// ============================================================================
// ARCHIVO: Admin_Preceptores.js
// ============================================================================

async function verPreceptores() {
    const contenedor = document.getElementById('contenido-dinamico');
    contenedor.innerHTML = '<div class="spinner-border text-primary"></div> Cargando Preceptores...';
    
    try {
        const resp = await fetch(`${URL_API}?op=getPreceptoresAdmin&rol=Directivo`);
        const json = await resp.json();
        
        if (json.status !== 'success') throw new Error(json.message);

        baseDatosPreceptores = json.data; 

        let html = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5>Gestión de Preceptores</h5>
                <button onclick="abrirModalPreceptor()" class="btn btn-success">+ Nuevo Preceptor</button>
            </div>
            
            <div class="table-responsive bg-white rounded shadow-sm">
                <table class="table table-hover table-bordered mb-0 align-middle">
                    <thead class="table-dark text-center">
                        <tr><th>DNI</th><th>Nombre</th><th>Contacto</th><th>Cursos a Cargo</th><th>Acciones</th></tr>
                    </thead>
                    <tbody>`;
        
        json.data.forEach((p, index) => {
            let cursosHTML = p.cursos ? 
                p.cursos.split(',').map(c => `<span class="badge bg-info text-dark me-1">${c.trim()}</span>`).join('') : 
                '<span class="text-muted small">Sin asignar</span>';
            
            html += `
                <tr>
                    <td>${p.dni}</td>
                    <td class="fw-bold">${p.nombre}</td>
                    <td><small>${p.email}<br>${p.celular || ''}</small></td>
                    <td>${cursosHTML}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-warning me-1" onclick="abrirModalCursosPreceptor(${index})" title="Asignar Cursos">📚</button>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="editarPreceptor(${index})" title="Editar">✏️</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="borrarPreceptor('${p.dni}')" title="Borrar">🗑️</button>
                    </td>
                </tr>`;
        });
        
        html += `</tbody></table></div>`;
        html += renderModalPreceptorHTML() + renderModalCursosPreceptorHTML();
        
        contenedor.innerHTML = html;
        
    } catch (e) { 
        alert("Error: " + e.message); 
    }
}

// --- ASIGNACIÓN DE CURSOS CON DETECCIÓN DE CONFLICTOS ---

async function abrirModalCursosPreceptor(index) {
    const p = baseDatosPreceptores[index];
    const modal = new bootstrap.Modal(document.getElementById('modalCursosPreceptor'));
    
    document.getElementById('tituloModalCursos').innerText = `Asignar cursos a: ${p.nombre}`;
    document.getElementById('dni_curso_preceptor').value = p.dni;
    
    const select = document.getElementById('cursos_disponibles');
    select.innerHTML = '<option>Cargando cursos y verificando conflictos...</option>';
    
    modal.show();
    
    try {
        // 1. Obtenemos lista de cursos del sistema
        const respCursos = await fetch(`${URL_API}?op=getCursosDisponibles&rol=Directivo`);
        const jsonCursos = await respCursos.json();
        
        // 2. Mapeamos quién tiene qué curso actualmente (usando baseDatosPreceptores local)
        const mapaCursos = {}; // { "1A": "Juan Perez", "2B": "Maria Gomez" }
        
        baseDatosPreceptores.forEach(prec => {
            if(prec.cursos) {
                const lista = prec.cursos.split(',');
                lista.forEach(c => { mapaCursos[c.trim()] = prec.nombre; });
            }
        });

        select.innerHTML = '';
        const cursosDeEstePreceptor = p.cursos ? p.cursos.split(', ').map(c => c.trim()) : [];
        
        jsonCursos.data.forEach(curso => {
            const loTengoYo = cursosDeEstePreceptor.includes(curso);
            const duenoActual = mapaCursos[curso];
            
            let textoOption = curso;
            let clase = "";
            let selected = "";

            if (loTengoYo) {
                // Si es mío
                textoOption += " (Ya asignado)";
                selected = "selected";
                clase = "fw-bold text-success"; 
            } else if (duenoActual) {
                // Si es de otro
                textoOption += ` ⚠️ (Tiene: ${duenoActual} - Se le quitará)`;
                clase = "text-danger fw-bold"; 
            }

            select.innerHTML += `<option value="${curso}" class="${clase}" ${selected}>${textoOption}</option>`;
        });
        
    } catch (e) {
        console.error(e);
        select.innerHTML = '<option>Error al cargar datos</option>';
    }
}

async function guardarAsignacionCursos() {
    const dni = document.getElementById('dni_curso_preceptor').value;
    const select = document.getElementById('cursos_disponibles');
    // Obtener valores múltiples
    const seleccionados = Array.from(select.selectedOptions).map(o => o.value);
    
    const btn = document.getElementById('btnGuardarCursos');
    btn.disabled = true; btn.innerText = "Guardando...";
    
    try {
        await fetch(URL_API, { 
            method: 'POST', 
            body: JSON.stringify({ 
                op: 'asignarCursosPreceptor', 
                dniPreceptor: dni, 
                cursos: seleccionados 
            }) 
        });
        
        const modalEl = document.getElementById('modalCursosPreceptor');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if(modal) modal.hide();
        
        alert("Cursos asignados correctamente.");
        verPreceptores(); // Recargar para ver los cambios
    } catch (e) { 
        alert("Error al asignar cursos."); 
    } finally {
        btn.disabled = false; btn.innerText = "💾 Guardar Asignación";
    }
}

// --- FUNCIONES CRUD SIMPLES ---
function abrirModalPreceptor() {
    document.getElementById('formPreceptor').reset();
    document.getElementById('tituloModalPreceptor').innerText = "Nuevo Preceptor";
    document.getElementById('accion_preceptor').value = "crear";
    new bootstrap.Modal(document.getElementById('modalPreceptor')).show();
}

function editarPreceptor(index) {
    const p = baseDatosPreceptores[index];
    document.getElementById('tituloModalPreceptor').innerText = "Editar Preceptor";
    document.getElementById('accion_preceptor').value = "editar";
    document.getElementById('dni_original_preceptor').value = p.dni;
    document.getElementById('prec_dni').value = p.dni;
    document.getElementById('prec_nombre').value = p.nombre;
    document.getElementById('prec_email').value = p.email;
    document.getElementById('prec_celular').value = p.celular;
    new bootstrap.Modal(document.getElementById('modalPreceptor')).show();
}

async function guardarPreceptor() {
    const datos = {
        op: 'administrarPreceptor',
        accion: document.getElementById('accion_preceptor').value,
        dniOriginal: document.getElementById('dni_original_preceptor').value,
        dni: document.getElementById('prec_dni').value,
        nombre: document.getElementById('prec_nombre').value,
        email: document.getElementById('prec_email').value,
        celular: document.getElementById('prec_celular').value
    };
    try {
        await fetch(URL_API, { method: 'POST', body: JSON.stringify(datos) });
        bootstrap.Modal.getInstance(document.getElementById('modalPreceptor')).hide();
        verPreceptores();
    } catch (e) { alert("Error al guardar."); }
}

async function borrarPreceptor(dni) {
    if(!confirm(`¿Eliminar preceptor?`)) return;
    try { await fetch(URL_API, { method: 'POST', body: JSON.stringify({ op: 'administrarPreceptor', accion: 'borrar', dni: dni }) }); verPreceptores(); } catch (e) { alert("Error."); }
}
