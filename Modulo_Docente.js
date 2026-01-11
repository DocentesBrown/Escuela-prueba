// ============================================================================
// ARCHIVO: Modulo_Docente.js
// DESCRIPCIÓN: Lógica del Frontend para el Docente (Notas, Asistencia, Promedios)
// ============================================================================

// Variables globales del módulo
let cacheEstudiantesCurso = []; 
let idMateriaActual = null;
let nombreCursoActual = "";

/**
 * 1. INICIO: Carga la lista de cursos asignados al docente
 */
async function iniciarModuloDocente() {
    const contenedor = document.getElementById('contenido-dinamico');
    contenedor.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2">Cargando tus cursos...</p>
        </div>`;
    
    try {
        // Petición al Backend
        const resp = await fetch(`${URL_API}?op=getCursosDocente&rol=Docente&dni=${usuarioActual.dni}`);
        const json = await resp.json();
        
        if (json.status !== 'success') throw new Error(json.message);
        
        if (!json.data || json.data.length === 0) {
            contenedor.innerHTML = `<div class="alert alert-warning">No tienes cursos asignados. Contacta a dirección.</div>`;
            return;
        }
        
        // Renderizar Tarjetas de Cursos
        let html = `<h4 class="mb-4">🏫 Mis Cursos Asignados</h4><div class="row">`;
        
        json.data.forEach(c => {
            // Generamos HTML para cada materia dentro del curso
            let materiasHTML = c.materias.map(m => `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${m.nombre}</strong> <small class="text-muted">(${m.tipoAsignacion})</small>
                    </div>
                    <button class="btn btn-sm btn-primary" 
                        onclick="verCursoDocente('${m.id}', '${c.curso}', '${m.nombre}')">
                        Abrir
                    </button>
                </li>
            `).join('');

            html += `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100 shadow-sm border-start border-4 border-primary">
                    <div class="card-header bg-white fw-bold d-flex justify-content-between">
                        <span>${c.curso}</span>
                        <span class="badge bg-secondary">${c.totalEstudiantes} Alumnos</span>
                    </div>
                    <ul class="list-group list-group-flush">
                        ${materiasHTML}
                    </ul>
                </div>
            </div>`;
        });
        
        html += `</div>`;
        contenedor.innerHTML = html;

    } catch (e) {
        console.error(e);
        contenedor.innerHTML = `<div class="alert alert-danger">Error cargando cursos: ${e.message}</div>`;
    }
}

/**
 * 2. VISTA DE CURSO: Muestra la tabla de alumnos, notas y asistencia
 */
async function verCursoDocente(idMateria, curso, nombreMateria) {
    idMateriaActual = idMateria;
    nombreCursoActual = curso;
    
    const contenedor = document.getElementById('contenido-dinamico');
    contenedor.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2">Cargando planilla de ${nombreMateria} (${curso})...</p>
        </div>`;

    try {
        // NOTA: Usamos 'getEstudiantesConDatos' que mapea a la función correcta en Main.gs
        const params = new URLSearchParams({
            op: 'getEstudiantesConDatos',
            rol: 'Docente',
            dniDocente: usuarioActual.dni,
            curso: curso,
            idMateria: idMateria
        });

        const resp = await fetch(`${URL_API}?${params}`);
        const json = await resp.json();

        if (json.status !== 'success') throw new Error(json.message);

        cacheEstudiantesCurso = json.data.estudiantes; // Guardamos en memoria para guardar después

        // Renderizar la Interfaz de Planilla
        renderizarPlanilla(json.data.estudiantes, nombreMateria, curso);

    } catch (e) {
        console.error(e);
        contenedor.innerHTML = `
            <div class="alert alert-danger">
                Error al abrir el curso.<br>
                <small>${e.message}</small><br>
                <button class="btn btn-outline-danger mt-2" onclick="iniciarModuloDocente()">Volver</button>
            </div>`;
    }
}

function renderizarPlanilla(estudiantes, materia, curso) {
    const contenedor = document.getElementById('contenido-dinamico');
    
    let html = `
    <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
            <h4 class="mb-0">${materia} - ${curso}</h4>
            <small class="text-muted">${estudiantes.length} estudiantes inscriptos</small>
        </div>
        <div>
            <button class="btn btn-outline-secondary btn-sm me-2" onclick="iniciarModuloDocente()">⬅ Volver</button>
            <button class="btn btn-info btn-sm text-white me-2" onclick="abrirModalAsistencia()">📝 Tomar Asistencia</button>
            <button class="btn btn-success btn-sm" onclick="guardarNotas()">💾 Guardar Notas</button>
        </div>
    </div>

    <div class="table-responsive bg-white shadow-sm rounded" style="max-height: 75vh;">
        <table class="table table-bordered table-hover align-middle mb-0" style="font-size: 0.9rem;">
            <thead class="table-dark sticky-top">
                <tr class="text-center">
                    <th rowspan="2" style="width: 250px;">Estudiante</th>
                    <th colspan="2" class="bg-secondary">1º Cuatrimestre</th>
                    <th colspan="2" class="bg-secondary">2º Cuatrimestre</th>
                    <th rowspan="2" class="bg-primary">Final</th>
                    <th colspan="2" class="bg-warning text-dark">Recuperación</th>
                    <th rowspan="2" class="bg-success">Definitiva</th>
                    <th rowspan="2" style="width: 80px;">Asist.</th>
                </tr>
                <tr class="text-center small">
                    <th>Nota</th><th>Intensif.</th>
                    <th>Nota</th><th>Intensif.</th>
                    <th>Dic</th><th>Feb</th>
                </tr>
            </thead>
            <tbody>`;

    estudiantes.forEach((est, index) => {
        const n = est.notas || {};
        
        // Inputs de notas. Usamos onkeyup para calcular en tiempo real.
        html += `
        <tr data-dni="${est.dni}">
            <td class="fw-bold text-truncate" style="max-width: 200px;" title="${est.nombre}">
                ${est.nombre}
                ${est.condicion !== 'Cursa' ? `<br><span class="badge bg-warning text-dark">${est.condicion}</span>` : ''}
            </td>
            
            <td class="p-1"><input type="number" class="form-control form-control-sm text-center input-nota n1-c1" 
                value="${n.nota1_C1}" placeholder="-" min="1" max="10" onkeyup="calcularFila('${est.dni}')"></td>
            <td class="p-1"><input type="number" class="form-control form-control-sm text-center input-nota int-1" 
                value="${n.intensificacion1}" placeholder="-" min="1" max="10" onkeyup="calcularFila('${est.dni}')"></td>
            
            <td class="p-1"><input type="number" class="form-control form-control-sm text-center input-nota n1-c2" 
                value="${n.nota1_C2}" placeholder="-" min="1" max="10" onkeyup="calcularFila('${est.dni}')"></td>
            <td class="p-1"><input type="number" class="form-control form-control-sm text-center input-nota int-2" 
                value="${n.intensificacion2}" placeholder="-" min="1" max="10" onkeyup="calcularFila('${est.dni}')"></td>
            
            <td class="p-1 bg-light text-center fw-bold text-primary"><span id="final-${est.dni}">${n.nota_final || '-'}</span></td>
            
            <td class="p-1"><input type="number" class="form-control form-control-sm text-center input-nota n-dic" 
                id="dic-${est.dni}" value="${n.diciembre}" placeholder="-" min="1" max="10" onkeyup="calcularFila('${est.dni}')" ${n.nota_final >= 7 ? 'disabled' : ''}></td>
            <td class="p-1"><input type="number" class="form-control form-control-sm text-center input-nota n-feb" 
                id="feb-${est.dni}" value="${n.febrero}" placeholder="-" min="1" max="10" onkeyup="calcularFila('${est.dni}')" disabled></td>
            
            <td class="p-1 bg-light text-center fw-bold text-success"><span id="def-${est.dni}">${n.nota_definitiva || '-'}</span></td>

            <td class="text-center" style="cursor:pointer;" onclick="abrirJustificarFaltas('${est.dni}', '${est.nombre}')">
                <span class="badge ${est.asistencia.porcentaje < 60 ? 'bg-danger' : 'bg-info'}">
                    ${est.asistencia.porcentaje}%
                </span>
                <div style="font-size: 0.7em;" class="text-muted">${est.asistencia.total} clases</div>
            </td>
        </tr>`;
    });

    html += `</tbody></table></div>`;
    
    // Inyectar modales necesarios si no existen
    if(!document.getElementById('modalAsistenciaDocente')) {
        html += renderModalAsistenciaDocenteHTML();
        html += renderModalJustificarDocenteHTML();
    }
    
    contenedor.innerHTML = html;
}

/**
 * 3. LÓGICA DE CÁLCULO DE NOTAS (Tiempo Real)
 */
function calcularFila(dni) {
    const fila = document.querySelector(`tr[data-dni="${dni}"]`);
    
    // Obtener valores
    const getVal = (clase) => parseFloat(fila.querySelector(`.${clase}`).value) || 0;
    
    const n1 = getVal('n1-c1');
    const i1 = getVal('int-1');
    const n2 = getVal('n1-c2');
    const i2 = getVal('int-2');
    
    // Lógica: La nota efectiva del cuatrimestre es la mayor entre la cursada y la intensificación
    const efec1 = (i1 > 0 && i1 > n1) ? i1 : n1;
    const efec2 = (i2 > 0 && i2 > n2) ? i2 : n2;
    
    // Promedio
    let promedio = 0;
    if (efec1 > 0 && efec2 > 0) {
        promedio = (efec1 + efec2) / 2;
        // Redondeo lógico: 6.5 -> 7? Depende de la escuela. Usamos redondeo estándar.
        // Si quieres 6.50 -> 6.50 usa toFixed(2). Si es entero Math.round.
        promedio = Math.round(promedio * 10) / 10; 
    }

    // Mostrar Final
    const spanFinal = document.getElementById(`final-${dni}`);
    spanFinal.innerText = promedio > 0 ? promedio : '-';
    
    // Inputs de recuperación
    const inpDic = document.getElementById(`dic-${dni}`);
    const inpFeb = document.getElementById(`feb-${dni}`);
    const spanDef = document.getElementById(`def-${dni}`);
    
    // REGLAS DE APROBACIÓN
    // Se aprueba si promedio >= 7 Y ambos cuatrimestres están "aprobados" (>=7 en alguna instancia)
    // OJO: Si saca un 10 y un 4 -> Prom 7. Pero debe intensificar el 4.
    
    const aprobadoC1 = efec1 >= 7;
    const aprobadoC2 = efec2 >= 7;
    
    let definitiva = "-";

    if (promedio >= 7 && aprobadoC1 && aprobadoC2) {
        // Aprobó directo
        definitiva = Math.round(promedio); // O nota final
        inpDic.value = ''; inpDic.disabled = true;
        inpFeb.value = ''; inpFeb.disabled = true;
    } else if (promedio > 0) {
        // Debe ir a diciembre/febrero o intensificar
        inpDic.disabled = false;
        
        const notaDic = parseFloat(inpDic.value) || 0;
        
        if (notaDic >= 4) {
            // Aprobó en Diciembre
            definitiva = notaDic;
            inpFeb.value = ''; inpFeb.disabled = true;
        } else if (inpDic.value !== "") {
            // Desaprobó Diciembre -> Habilita Febrero
            inpFeb.disabled = false;
            const notaFeb = parseFloat(inpFeb.value) || 0;
            if (inpFeb.value !== "") {
                definitiva = notaFeb; // Queda la nota de febrero (aunque sea 2)
            }
        } else {
             // Aún no rinde Diciembre
             inpFeb.disabled = true;
        }
    }
    
    spanDef.innerText = definitiva;
    
    // Colores visuales
    colorInput(fila.querySelector('.n1-c1'), n1);
    colorInput(fila.querySelector('.n1-c2'), n2);
    colorInput(inpDic, parseFloat(inpDic.value)||0);
    colorInput(inpFeb, parseFloat(inpFeb.value)||0);
}

function colorInput(el, val) {
    if(!el || el.value === "") {
        el.style.color = 'black'; 
        return;
    }
    if(val >= 7) el.style.color = 'green';
    else if(val >= 4) el.style.color = '#d4ac0d'; // Amarillo oscuro
    else el.style.color = 'red';
    el.style.fontWeight = 'bold';
}

/**
 * 4. GUARDADO DE NOTAS
 */
async function guardarNotas() {
    if(!confirm("¿Deseas guardar los cambios en las notas?")) return;
    
    const filas = document.querySelectorAll('tr[data-dni]');
    let payload = [];
    
    filas.forEach(fila => {
        const dni = fila.getAttribute('data-dni');
        
        // Recolectar valores actuales
        const val = (sel) => fila.querySelector(sel).value;
        const txt = (id) => document.getElementById(id).innerText;
        
        payload.push({
            dni: dni,
            n1_c1: val('.n1-c1'),
            i1: val('.int-1'),
            n1_c2: val('.n1-c2'),
            i2: val('.int-2'),
            nota_final: txt(`final-${dni}`) === '-' ? '' : txt(`final-${dni}`),
            dic: val('.n-dic'),
            feb: val('.n-feb'),
            def: txt(`def-${dni}`) === '-' ? '' : txt(`def-${dni}`)
        });
    });

    // Enviar al servidor
    const btn = document.querySelector('.btn-success'); // Botón guardar
    const originalText = btn.innerText;
    btn.innerText = "Guardando..."; btn.disabled = true;

    try {
        const datos = {
            op: 'guardarNotasMasivo',
            rol: 'Docente',
            idMateria: idMateriaActual,
            notas: payload
        };
        
        const resp = await fetch(URL_API, { method: 'POST', body: JSON.stringify(datos) });
        const json = await resp.json();
        
        if(json.status === 'success') {
            alert("✅ Notas guardadas correctamente.");
        } else {
            alert("❌ Error al guardar: " + json.message);
        }
    } catch (e) {
        alert("Error de conexión.");
        console.error(e);
    } finally {
        btn.innerText = originalText; btn.disabled = false;
    }
}

/**
 * 5. ASISTENCIA
 */
function abrirModalAsistencia() {
    const modalBody = document.getElementById('lista-asistencia-body');
    modalBody.innerHTML = '';
    
    cacheEstudiantesCurso.forEach(est => {
        modalBody.innerHTML += `
        <div class="list-group-item d-flex justify-content-between align-items-center">
            <span>${est.nombre}</span>
            <div>
                <div class="btn-group" role="group">
                    <input type="radio" class="btn-check" name="asist-${est.dni}" id="P-${est.dni}" value="P" checked>
                    <label class="btn btn-outline-success btn-sm" for="P-${est.dni}">P</label>

                    <input type="radio" class="btn-check" name="asist-${est.dni}" id="A-${est.dni}" value="A">
                    <label class="btn btn-outline-danger btn-sm" for="A-${est.dni}">A</label>

                    <input type="radio" class="btn-check" name="asist-${est.dni}" id="T-${est.dni}" value="T">
                    <label class="btn btn-outline-warning btn-sm" for="T-${est.dni}">T</label>
                </div>
            </div>
        </div>`;
    });
    
    new bootstrap.Modal(document.getElementById('modalAsistenciaDocente')).show();
}

async function guardarAsistenciaDocenteForm() {
    const items = [];
    cacheEstudiantesCurso.forEach(est => {
        const estado = document.querySelector(`input[name="asist-${est.dni}"]:checked`).value;
        items.push({ dni: est.dni, estado: estado });
    });

    // Deshabilitar botón
    const btn = document.getElementById('btnGuardarAsistDoc');
    btn.disabled = true; btn.innerText = "Guardando...";

    try {
        const datos = {
            op: 'guardarAsistenciaDocente',
            rol: 'Docente',
            dniDocente: usuarioActual.dni,
            idMateria: idMateriaActual,
            asistencia: items
        };
        
        await fetch(URL_API, { method: 'POST', body: JSON.stringify(datos) });
        
        // Cerrar modal y refrescar
        bootstrap.Modal.getInstance(document.getElementById('modalAsistenciaDocente')).hide();
        alert("Asistencia guardada.");
        verCursoDocente(idMateriaActual, nombreCursoActual, ""); // Recargar para actualizar porcentajes
        
    } catch(e) {
        alert("Error guardando asistencia.");
    } finally {
        btn.disabled = false; btn.innerText = "Guardar Asistencia";
    }
}

/**
 * 6. JUSTIFICACIÓN DE FALTAS (Visualización)
 */
async function abrirJustificarFaltas(dniAlumno, nombreAlumno) {
    const modal = new bootstrap.Modal(document.getElementById('modalJustificarDocente'));
    document.getElementById('just_doc_nombre').innerText = nombreAlumno;
    const lista = document.getElementById('lista_faltas_docente');
    lista.innerHTML = '<div class="text-center"><div class="spinner-border spinner-border-sm"></div> Cargando...</div>';
    
    modal.show();
    
    try {
        const resp = await fetch(`${URL_API}?op=getFaltasAlumnoDocente&rol=Docente&dni=${dniAlumno}&idMateria=${idMateriaActual}`);
        const json = await resp.json();
        
        if (json.data.length === 0) {
            lista.innerHTML = '<div class="alert alert-info">No hay faltas injustificadas para esta materia.</div>';
            return;
        }
        
        let html = '';
        json.data.forEach(falta => {
            html += `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <span>📅 ${falta.fecha} - Ausente</span>
                <button class="btn btn-sm btn-outline-success" onclick="justificarFaltaAccion(${falta.fila}, this)">
                    Justificar
                </button>
            </div>`;
        });
        lista.innerHTML = html;
        
    } catch(e) {
        lista.innerHTML = 'Error cargando faltas.';
    }
}

async function justificarFaltaAccion(filaIndex, btnElement) {
    if(!confirm("¿Justificar esta falta?")) return;
    
    btnElement.disabled = true;
    btnElement.innerText = "...";
    
    try {
        await fetch(URL_API, { method: 'POST', body: JSON.stringify({ 
            op: 'justificarFaltaDocente', 
            rol: 'Docente', 
            fila: filaIndex 
        })});
        
        btnElement.parentElement.remove(); // Quitar de la lista visualmente
        
    } catch(e) {
        alert("Error.");
        btnElement.disabled = false;
    }
}


// --- TEMPLATES HTML INYECTADOS ---

function renderModalAsistenciaDocenteHTML() {
    return `
    <div class="modal fade" id="modalAsistenciaDocente" tabindex="-1">
      <div class="modal-dialog modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header bg-info text-white">
            <h5 class="modal-title">Tomar Asistencia Diaria</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p class="small text-muted">Marca el estado de hoy para cada alumno.</p>
            <div id="lista-asistencia-body" class="list-group">
                </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-info text-white" id="btnGuardarAsistDoc" onclick="guardarAsistenciaDocenteForm()">Guardar Asistencia</button>
          </div>
        </div>
      </div>
    </div>`;
}

function renderModalJustificarDocenteHTML() {
    return `
    <div class="modal fade" id="modalJustificarDocente" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-warning">
            <h5 class="modal-title text-dark">Justificar Inasistencias</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p>Alumno: <b id="just_doc_nombre"></b></p>
            <div id="lista_faltas_docente" class="list-group mt-2"></div>
          </div>
        </div>
      </div>
    </div>`;
}
