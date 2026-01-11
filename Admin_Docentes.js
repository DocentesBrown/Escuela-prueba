// ============================================================================
// ARCHIVO: Admin_Docentes.js
// ============================================================================
console.log("Cargando módulo Docentes..."); // Chequeo de carga

async function verDocentes() {
    const contenedor = document.getElementById('contenido-dinamico');
    contenedor.innerHTML = '<div class="spinner-border text-primary"></div> Cargando Docentes...';
    
    try {
        const resp = await fetch(`${URL_API}?op=getDocentes&rol=Directivo`);
        const json = await resp.json();
        
        if (json.status !== 'success') throw new Error(json.message);

        baseDatosDocentes = json.data; 

        let html = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5>Gestión de Docentes</h5>
                <button onclick="abrirModalDocente()" class="btn btn-success">+ Nuevo Docente</button>
            </div>
            
            <div class="card mb-3 shadow-sm">
                <div class="card-body">
                    <div class="input-group">
                        <span class="input-group-text">🔍</span>
                        <input type="text" class="form-control" id="buscadorDocentes" placeholder="Buscar..." onkeyup="filtrarDocentes()">
                    </div>
                    <div class="mt-2 text-muted small"><span id="contadorDocentes">${json.data.length} docentes</span></div>
                </div>
            </div>
            
            <div class="table-responsive bg-white rounded shadow-sm" style="max-height: 600px; overflow-y: auto;">
                <table class="table table-hover table-bordered mb-0 align-middle">
                    <thead class="table-dark text-center" style="position: sticky; top: 0;">
                        <tr><th>DNI</th><th>Nombre</th><th>Contacto</th><th>Materias Asignadas</th><th>Acciones</th></tr>
                    </thead>
                    <tbody id="tbodyDocentes">`;
        
        json.data.forEach((fila, index) => {
            // Limpieza de datos
            let materiasRaw = String(fila[4] || '');
            
            // Renderizado visual simple y seguro para evitar el bug ">
            // Simplemente reemplazamos los textos clave por Badges HTML
            let materiasHTML = materiasRaw
                .replace(/\[SUPLANTADO\]/g, '<span class="badge bg-danger">[SUPLANTADO]</span>')
                .replace(/\[Titular\]/gi, '<span class="badge bg-success bg-opacity-75 text-white">Titular</span>')
                .replace(/\[Provisional\]/gi, '<span class="badge bg-info text-dark">Prov.</span>')
                .replace(/\[Interino\]/gi, '<span class="badge bg-secondary">Int.</span>')
                .replace(/\[Suplencia\]/gi, '<span class="badge bg-warning text-dark">Supl.</span>');

            html += `
                <tr class="fila-docente" data-dni="${fila[0]}" data-nombre="${String(fila[1]).toLowerCase()}" data-materias="${materiasRaw.toLowerCase()}">
                    <td>${fila[0]}</td>
                    <td class="fw-bold">${fila[1]}</td>
                    <td><small>${fila[2]}<br>${fila[3] || ''}</small></td>
                    <td><small>${materiasHTML}</small></td>
                    <td class="text-center" style="width: 160px;">
                        <button class="btn btn-sm btn-outline-warning me-1" onclick="abrirModalAsignacion(${index})" title="Asignar Materia">📚</button>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="editarDocente(${index})" title="Editar">✏️</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="borrarDocente('${fila[0]}', '${fila[2]}')" title="Borrar">🗑️</button>
                    </td>
                </tr>`;
        });
        
        html += `</tbody></table></div>`;
        html += renderModalDocenteHTML() + renderModalAsignacionCompletaHTML();
        contenedor.innerHTML = html;
        
    } catch (e) { 
        console.error(e);
        contenedor.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
    }
}

function filtrarDocentes() {
    const busqueda = document.getElementById('buscadorDocentes').value.toLowerCase();
    const filas = document.querySelectorAll('#tbodyDocentes tr.fila-docente');
    let contador = 0;
    
    filas.forEach(fila => {
        const texto = fila.dataset.nombre + " " + fila.dataset.dni + " " + fila.dataset.materias;
        const mostrar = texto.includes(busqueda);
        fila.style.display = mostrar ? '' : 'none';
        if(mostrar) contador++;
    });
    document.getElementById('contadorDocentes').innerText = `${contador} docentes encontrados`;
}

// --- ASIGNACIÓN DE MATERIAS ---

async function abrirModalAsignacion(index) {
    const doc = baseDatosDocentes[index];
    if (!doc) return alert("Error al identificar al docente.");

    document.getElementById('asig_dni_docente').value = doc[0];
    document.getElementById('asig_nombre_docente').value = doc[1];
    document.getElementById('span_nombre_docente').innerText = doc[1];
    
    const select = document.getElementById('sel_materia_asig');
    select.innerHTML = '<option>Cargando materias...</option>';
    
    // Configurar evento change para el tipo de asignación
    const tipoSelect = document.getElementById('tipo_asignacion');
    if(tipoSelect) {
        tipoSelect.onchange = function() {
            const info = document.getElementById('suplente_info');
            if(this.value === 'Suplencia') info.classList.remove('d-none'); 
            else info.classList.add('d-none');
        };
    }

    const modal = new bootstrap.Modal(document.getElementById('modalAsignacionCompleta'));
    modal.show();

    try {
        const resp = await fetch(`${URL_API}?op=getMaterias&rol=Directivo`);
        const json = await resp.json();
        let opts = `<option value="" selected disabled>-- Selecciona la materia --</option>`;
        
        json.data.forEach(mat => {
            // mat: [id, nombre, dni_profe, curso, nombre_profe, tipo, suplente_de]
            const nombreProfe = mat[4] ? String(mat[4]).trim() : "";
            let estilo = "color: #333;";
            let texto = `${mat[1]} (${mat[3]})`;
            
            if(nombreProfe) {
                texto += ` - ${nombreProfe}`;
                if(mat[5] && mat[5] === 'Suplencia') {
                    estilo = "color: orange; font-weight: bold;";
                    texto += ` [Suplente de: ${mat[6] || "?"}]`;
                }
            } else {
                estilo = "color: red; font-weight: bold;";
                texto = `[VACANTE] ${mat[1]} (${mat[3]})`;
            }
            opts += `<option value="${mat[0]}" style="${estilo}">${texto}</option>`;
        });
        select.innerHTML = opts;
    } catch (e) { 
        console.error(e);
        select.innerHTML = '<option>Error al cargar materias</option>'; 
    }
}

async function guardarAsignacionCompleta() {
    const btn = document.getElementById('btnGuardarAsigCompleta');
    const idMateria = document.getElementById('sel_materia_asig').value;
    
    if(!idMateria) { alert("Por favor selecciona una materia."); return; }
    
    btn.disabled = true; btn.innerText = "Asignando...";
    
    const datos = {
        op: 'asignarDocenteMateria',
        id_materia: idMateria,
        dni_docente: document.getElementById('asig_dni_docente').value,
        nombre_docente: document.getElementById('asig_nombre_docente').value,
        tipoAsignacion: document.getElementById('tipo_asignacion').value
    };

    try {
        const resp = await fetch(URL_API, { method: 'POST', body: JSON.stringify(datos) });
        const res = await resp.json();
        
        if(res.status === 'success') {
            // Cerrar modal a la fuerza
            const modalEl = document.getElementById('modalAsignacionCompleta');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if(modal) modal.hide();
            
            alert("✅ Asignación realizada correctamente.");
            verDocentes(); // Recargar lista
        } else {
            throw new Error(res.message);
        }
    } catch (e) { 
        alert("Error al asignar: " + e.message); 
    } finally { 
        btn.disabled = false; btn.innerText = "Confirmar Asignación"; 
    }
}

// --- CRUD DOCENTE ---

function abrirModalDocente() {
    document.getElementById('modalTitleDoc').innerText = "Nuevo Docente";
    document.getElementById('formDocente').reset();
    document.getElementById('accion_doc').value = "crear";
    new bootstrap.Modal(document.getElementById('modalDocente')).show();
}

function editarDocente(index) {
    const doc = baseDatosDocentes[index];
    document.getElementById('modalTitleDoc').innerText = "Editar Docente";
    document.getElementById('accion_doc').value = "editar";
    document.getElementById('doc_dni_orig').value = doc[0];
    document.getElementById('doc_dni').value = doc[0];
    document.getElementById('doc_nombre').value = doc[1];
    document.getElementById('doc_email').value = doc[2];
    document.getElementById('doc_cel').value = doc[3];
    new bootstrap.Modal(document.getElementById('modalDocente')).show();
}

async function guardarDocente() {
    const btn = document.getElementById('btnGuardarDoc');
    btn.disabled = true;
    
    const datos = {
        op: 'administrarDocente',
        accion: document.getElementById('accion_doc').value,
        dni: document.getElementById('doc_dni').value,
        nombre: document.getElementById('doc_nombre').value,
        email: document.getElementById('doc_email').value,
        celular: document.getElementById('doc_cel').value,
        dniOriginal: document.getElementById('doc_dni_orig').value
    };
    
    try { 
        await fetch(URL_API, { method: 'POST', body: JSON.stringify(datos) });
        const modalEl = document.getElementById('modalDocente');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if(modal) modal.hide();
        
        verDocentes();
    } catch (e) { 
        alert("Error al guardar docente."); 
    } finally {
        btn.disabled = false;
    }
}

async function borrarDocente(dni, email) {
    if(!confirm("¿Estás seguro de eliminar este docente? Se perderán sus asignaciones.")) return;
    try { 
        await fetch(URL_API, { method: 'POST', body: JSON.stringify({ op: 'administrarDocente', accion: 'borrar', dni: dni, email: email }) }); 
        verDocentes(); 
    } catch (e) { alert("Error al eliminar."); }
}
