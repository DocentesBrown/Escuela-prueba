// ============================================================================
// ARCHIVO: Templates.js
// ============================================================================

function renderModalHTML() {
    return `
    <div class="modal fade" id="modalEstudiante" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title" id="modalTitle">Estudiante</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="formEstudiante">
                <input type="hidden" id="accion_form"><input type="hidden" id="dni_original"><input type="hidden" id="email_original">
                <div class="row">
                    <div class="col-md-6 mb-2"><label>DNI</label><input type="number" id="inp_dni" class="form-control" required></div>
                    <div class="col-md-6 mb-2"><label>Nacimiento</label><input type="date" id="inp_nacimiento" class="form-control"></div>
                </div>
                <div class="mb-2"><label>Nombre y Apellido</label><input type="text" id="inp_nombre" class="form-control" required></div>
                <div class="row">
                    <div class="col-md-6 mb-2"><label>Curso</label><input type="text" id="inp_curso" class="form-control" required></div>
                    <div class="col-md-6 mb-2"><label>Email</label><input type="email" id="inp_email" class="form-control" required></div>
                </div>
                <div class="row">
                    <div class="col-6 mb-2"><label>Adulto Resp.</label><input type="text" id="inp_adulto" class="form-control"></div>
                    <div class="col-6 mb-2"><label>Teléfono</label><input type="text" id="inp_tel" class="form-control"></div>
                </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" id="btnGuardarModal" onclick="guardarEstudiante()">Guardar</button>
          </div>
        </div>
      </div>
    </div>`;
}

function renderModalInscripcionHTML() {
    return `
    <div class="modal fade" id="modalInscripcion" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title" id="tituloInscripcion">Inscripción</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <input type="hidden" id="ins_dni_est"><input type="hidden" id="ins_nombre_est">
            
            <div class="card mb-3 bg-light border-success">
                <div class="card-body py-2">
                    <label class="fw-bold text-success mb-1">Paso 1: Definir Curso (Autocompletar Materias)</label>
                    <div class="d-flex gap-2">
                        <select id="ins_curso_selector" class="form-select" onchange="cargarMateriasPorCurso()">
                            <option value="">-- Seleccionar Curso --</option>
                        </select>
                         <button class="btn btn-outline-success btn-sm" onclick="cargarMateriasPorCurso()" title="Aplicar Materias">🔄</button>
                    </div>
                </div>
            </div>

            <div id="gridMaterias"></div> 
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-success" id="btnGuardarIns" onclick="guardarInscripcion()">Guardar Inscripción</button>
          </div>
        </div>
      </div>
    </div>`;
}

function renderModalDocenteHTML() {
    return `
    <div class="modal fade" id="modalDocente" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title" id="modalTitleDoc">Docente</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="formDocente">
                <input type="hidden" id="accion_doc"><input type="hidden" id="doc_dni_orig"><input type="hidden" id="doc_email_orig">
                <div class="mb-2"><label>DNI</label><input type="number" id="doc_dni" class="form-control"></div>
                <div class="mb-2"><label>Nombre</label><input type="text" id="doc_nombre" class="form-control"></div>
                <div class="mb-2"><label>Email ABC</label><input type="email" id="doc_email" class="form-control"></div>
                <div class="mb-2"><label>Celular</label><input type="text" id="doc_cel" class="form-control"></div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-success" id="btnGuardarDoc" onclick="guardarDocente()">Guardar</button>
          </div>
        </div>
      </div>
    </div>`;
}

function renderModalAsignacionCompletaHTML() {
    return `
    <div class="modal fade" id="modalAsignacionCompleta" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-warning">
            <h5 class="modal-title text-dark">Asignar Materia</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>Docente: <b><span id="span_nombre_docente"></span></b></p>
            <input type="hidden" id="asig_dni_docente">
            <input type="hidden" id="asig_nombre_docente">
            <div class="mb-3">
                <label class="form-label">Tipo de Asignación:</label>
                <select id="tipo_asignacion" class="form-select">
                    <option value="Titular" selected>Titular</option>
                    <option value="Provisional">Provisional</option>
                    <option value="Interino">Interino</option>
                    <option value="Suplencia">Suplencia</option>
                </select>
                <div id="suplente_info" class="d-none alert alert-warning mt-2"><small>⚠️ Se marcará como suplencia.</small></div>
            </div>
            <div class="mb-3">
                <label class="form-label">Seleccionar Materia:</label>
                <select id="sel_materia_asig" class="form-select" size="8"></select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-dark" id="btnGuardarAsigCompleta" onclick="guardarAsignacionCompleta()">Confirmar</button>
          </div>
        </div>
      </div>
    </div>`;
}

function renderModalPreceptorHTML() {
    return `
    <div class="modal fade" id="modalPreceptor" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title" id="tituloModalPreceptor">Nuevo Preceptor</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="formPreceptor">
                <input type="hidden" id="accion_preceptor"><input type="hidden" id="dni_original_preceptor">
                <div class="mb-3"><label>DNI</label><input type="number" class="form-control" id="prec_dni" required></div>
                <div class="mb-3"><label>Nombre y Apellido</label><input type="text" class="form-control" id="prec_nombre" required></div>
                <div class="mb-3"><label>Email ABC</label><input type="email" class="form-control" id="prec_email"></div>
                <div class="mb-3"><label>Celular</label><input type="text" class="form-control" id="prec_celular"></div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-success" id="btnGuardarPreceptor" onclick="guardarPreceptor()">Guardar</button>
          </div>
        </div>
      </div>
    </div>`;
}

function renderModalCursosPreceptorHTML() {
    return `
    <div class="modal fade" id="modalCursosPreceptor" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-warning">
            <h5 class="modal-title" id="tituloModalCursos">Asignar Cursos</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <input type="hidden" id="dni_curso_preceptor">
            <div class="alert alert-info small">Mantén presionada <b>Ctrl</b> para selección múltiple.</div>
            <div class="mb-3">
                <label>Seleccionar Cursos:</label>
                <select id="cursos_disponibles" class="form-select" multiple size="8"></select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-dark" id="btnGuardarCursos" onclick="guardarAsignacionCursos()">💾 Guardar</button>
          </div>
        </div>
      </div>
    </div>`;
}

function renderModalJustificacionHTML() {
    return `
    <div class="modal fade" id="modalJustificar" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">Justificar Inasistencias</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <h6 class="mb-3 text-center" id="just_nombre">Alumno</h6>
            <div id="just_lista" style="max-height: 300px; overflow-y: auto;"></div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
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
            <p class="small text-muted">Selecciona la fecha para justificar la falta.</p>
            <div id="lista_faltas_docente" class="list-group">
                <div class="text-center"><div class="spinner-border spinner-border-sm"></div> Cargando...</div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
          </div>
        </div>
      </div>
    </div>`;
}
