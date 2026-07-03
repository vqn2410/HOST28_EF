import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchoolData } from '../context/SchoolDataContext';
import { Check, X, FileSignature, CheckCircle2, ChevronRight, AlertCircle, AlertOctagon, Bell, Calendar, Edit, Trash2, Clock } from 'lucide-react';

const DocenteAsistencia = () => {
  const { user } = useAuth();
  const { alumnos, guardarParteEF, actualizarParteEF, eliminarParteEF, partes = [], cursosConfig, solicitudesFaltantes, feriados } = useSchoolData();

  // Estados del Formulario
  const [selectedCurso, setSelectedCurso] = useState(null);
  const [isEditingParteId, setIsEditingParteId] = useState(null);
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [horario, setHorario] = useState('08:00 - 09:30');
  
  // ¿Hubo clases? (Sí / No)
  const [huboClase, setHuboClase] = useState('Sí');
  const [motivoSuspension, setMotivoSuspension] = useState('Licencia Médica');
  const [otroMotivoText, setOtroMotivoText] = useState('');

  // Campos del Libro de Temas (solo obligatorios si hubo clases)
  const [claseNum, setClaseNum] = useState('');
  const [unidad, setUnidad] = useState('');
  const [caracter, setCaracter] = useState('Práctica');
  const [dinamica, setDinamica] = useState('Grupal');
  const [observaciones, setObservaciones] = useState('');
  const [temaAbordado, setTemaAbordado] = useState('');
  const [actividades, setActividades] = useState('');
  
  const [asistenciaState, setAsistenciaState] = useState({}); // { [dni]: 'Presente' | 'Ausente' | '-' }
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [signedParte, setSignedParte] = useState(null);

  // Estados para modal de éxito
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState('');
  const [successModalDescription, setSuccessModalDescription] = useState('');

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setSelectedCurso(null);
    setIsEditingParteId(null);
  };

  // Estados para reporte de inasistencia docente
  const [showInasistenciaModal, setShowInasistenciaModal] = useState(false);
  const [fechaInasistencia, setFechaInasistencia] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedCursosInasistencia, setSelectedCursosInasistencia] = useState([]);
  const [motivoInasistencia, setMotivoInasistencia] = useState('Licencia Médica');
  const [comentarioInasistencia, setComentarioInasistencia] = useState('');

  const getNombreDiaSemana = (fechaStr) => {
    if (!fechaStr) return '';
    const dateObj = new Date(fechaStr + 'T00:00:00');
    const diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return diasNombres[dateObj.getDay()];
  };

  const handleCursoInasistenciaToggle = (curso) => {
    setSelectedCursosInasistencia(prev =>
      prev.includes(curso)
        ? prev.filter(c => c !== curso)
        : [...prev, curso]
    );
  };



  const handleConfirmarInasistencia = async () => {
    if (selectedCursosInasistencia.length === 0) {
      alert("Por favor, seleccione al menos un curso.");
      return;
    }
    if (!fechaInasistencia) {
      alert("Por favor, seleccione la fecha de inasistencia.");
      return;
    }
    if (motivoInasistencia === 'Otros' && !comentarioInasistencia.trim()) {
      alert("Por favor, especifique el motivo de la inasistencia.");
      return;
    }

    // Registrar un parte de inasistencia para cada curso
    for (const curso of selectedCursosInasistencia) {
      const config = cursosConfig[curso];
      const turno = config ? config.turno : (curso.endsWith('2°') || curso.endsWith('3°') ? 'Tarde' : 'Mañana');
      const defaultHorario = config?.horario || (turno === 'Mañana' ? '08:00 - 09:30' : '13:30 - 15:00');

      const motivoCompleto = motivoInasistencia === 'Otros'
        ? (comentarioInasistencia.trim() || 'Motivo no especificado')
        : motivoInasistencia;

      const dateObj = new Date(fechaInasistencia + 'T00:00:00');
      const diaString = String(dateObj.getDate()).padStart(2, '0');
      const mesesNombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      const mesString = mesesNombres[dateObj.getMonth()];

      const firmaDigital = {
        apellido: user.apellido,
        nombre: user.nombre,
        cargo: 'Prof. de Educación Física',
        correo: user.correo,
        fechaFirma: new Date().toISOString()
      };

      // Asistencia de alumnos para clase no dictada: marcar todos como "-"
      const asistenciaFinal = {};
      alumnos.filter(al => al.cursoEF === curso && !al.noCursaEF).forEach(al => {
        asistenciaFinal[al.dni] = '-';
      });

      const nuevoParte = {
        fecha: fechaInasistencia,
        dia: diaString,
        mes: mesString,
        claseNum: '-',
        unidad: '-',
        caracter: '-',
        dinamica: '-',
        observaciones: `Inasistencia Docente. Motivo: ${motivoCompleto}`,
        curso,
        turno,
        horario: defaultHorario,
        docenteNombre: `${user.nombre} ${user.apellido}`,
        huboClase: 'No',
        motivoSuspension: motivoCompleto,
        asistencia: asistenciaFinal,
        contenido: `[INASISTENCIA DOCENTE] - Motivo: ${motivoCompleto}`,
        actividades: '-',
        firmaDigital,
        firmaAutoridad: null
      };

      await guardarParteEF(nuevoParte);
    }

    // Cerrar modal
    setShowInasistenciaModal(false);

    // Configurar modal de éxito
    setSuccessModalTitle("Inasistencia Registrada");
    setSuccessModalDescription(`Se ha registrado correctamente su inasistencia para los cursos: ${selectedCursosInasistencia.join(', ')} para el día ${new Date(fechaInasistencia + 'T00:00:00').toLocaleDateString('es-AR')}.`);
    setShowSuccessModal(true);

    // Resetear form
    setFechaInasistencia(new Date().toISOString().split('T')[0]);
    setSelectedCursosInasistencia([]);
    setMotivoInasistencia('Licencia Médica');
    setComentarioInasistencia('');
  };

  const CARACTERES = ['Práctica', 'Teórica', 'Teórica-Práctica', 'Evaluativa', 'Recreativa'];
  const SUSPENSION_MOTIVOS = ['Licencia Médica', 'Causas climáticas', 'Feriado / Fecha Patria', 'Otros'];

  // Computar cursos asignados dinámicamente
  const cursosAsignados = useMemo(() => {
    return Object.keys(cursosConfig).filter(
      (curso) => cursosConfig[curso].docenteDni === user.dni
    );
  }, [cursosConfig, user.dni]);

  // Sincronizar automáticamente los cursos del día seleccionando los correspondientes
  useEffect(() => {
    if (!fechaInasistencia || !cursosConfig || !showInasistenciaModal) return;
    const dateObj = new Date(fechaInasistencia + 'T00:00:00');
    const dayOfWeek = dateObj.getDay(); // 0: Dom, 1: Lun, 2: Mar, 3: Mié, 4: Jue, 5: Vie, 6: Sáb
    
    // Filtrar cursos asignados al docente que tengan clases este día de la semana
    const cursosDelDia = cursosAsignados.filter(curso => {
      const config = cursosConfig[curso];
      return config?.dias?.includes(dayOfWeek);
    });

    setSelectedCursosInasistencia(cursosDelDia);
  }, [fechaInasistencia, cursosAsignados, cursosConfig, showInasistenciaModal]);

  const misPartesEntregados = useMemo(() => {
    return partes.filter(p => cursosAsignados.includes(p.curso));
  }, [partes, cursosAsignados]);

  // Calcular número de clase automáticamente según fecha y temario
  useEffect(() => {
    if (huboClase === 'No') {
      setClaseNum('-');
      return;
    }
    if (!selectedCurso || !fecha) {
      setClaseNum('');
      return;
    }

    // Filtrar otros partes del mismo curso que sí tuvieron clase
    const otherParts = partes
      .filter(p => p.curso === selectedCurso && p.huboClase === 'Sí' && p.id !== isEditingParteId)
      .map(p => ({ id: p.id, fecha: p.fecha }));

    // Crear ítem virtual del formulario actual
    const virtualItem = { id: isEditingParteId || 'temp', fecha };
    const allItems = [...otherParts, virtualItem];

    // Ordenar cronológicamente por fecha y estabilizar por ID
    allItems.sort((a, b) => {
      if (a.fecha !== b.fecha) {
        return a.fecha.localeCompare(b.fecha);
      }
      return (a.id || '').localeCompare(b.id || '');
    });

    const index = allItems.findIndex(item => item.id === (isEditingParteId || 'temp'));
    setClaseNum(String(index + 1));
  }, [selectedCurso, fecha, huboClase, partes, isEditingParteId]);

  // Validar si ya existe un parte para este curso y fecha
  useEffect(() => {
    if (!selectedCurso || !fecha) return;
    
    const yaExiste = partes.some(p => 
      p.curso === selectedCurso && 
      p.fecha === fecha && 
      p.id !== isEditingParteId
    );
    
    if (yaExiste) {
      setErrorMsg(`Ya existe un parte diario registrado para el curso ${selectedCurso} en la fecha ${new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR')}. No se permiten duplicados.`);
    } else {
      setErrorMsg('');
    }
  }, [selectedCurso, fecha, isEditingParteId, partes]);

  const feriadoDelDia = useMemo(() => {
    if (!feriados) return null;
    return feriados.find(f => f.fecha === fecha);
  }, [feriados, fecha]);

  const isFeriado = !!feriadoDelDia;

  useEffect(() => {
    if (feriadoDelDia) {
      setHuboClase('No');
      setMotivoSuspension('Feriado / Fecha Patria');
      setOtroMotivoText(feriadoDelDia.descripcion);
    } else if (huboClase === 'No' && motivoSuspension === 'Feriado / Fecha Patria') {
      setMotivoSuspension('Licencia Médica');
      setOtroMotivoText('');
    }
  }, [feriadoDelDia, huboClase, motivoSuspension]);

  const handleEditParteClick = (parte) => {
    setIsEditingParteId(parte.id);
    setSelectedCurso(parte.curso);
    setFecha(parte.fecha);
    setHorario(parte.horario);
    setHuboClase(parte.huboClase || 'Sí');
    setMotivoSuspension(parte.motivoSuspension || 'Licencia Médica');
    setOtroMotivoText(parte.otroMotivoText || '');
    setClaseNum(parte.claseNum || '');
    setUnidad(parte.unidad || '');
    setCaracter(parte.caracter || 'Práctica');
    setDinamica(parte.dinamica || 'Grupal');
    setTemaAbordado(parte.temaAbordado || '');
    setActividades(parte.actividades || '');
    setObservaciones(parte.observaciones || '');
    setAsistenciaState(parte.asistencia || {});
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleDeleteParteClick = async (parteId) => {
    if (window.confirm("¿Está seguro de que desea eliminar permanentemente este parte diario de asistencia? Esta acción no se puede deshacer y afectará las planillas acumuladas.")) {
      await eliminarParteEF(parteId);
    }
  };

  const alumnosFiltrados = useMemo(() => {
    if (!selectedCurso) return [];
    return alumnos
      .filter(al => al.cursoOrigen === selectedCurso || al.cursoEF === selectedCurso)
      .sort((a, b) => {
        const isExternoA = a.cursoOrigen !== selectedCurso;
        const isExternoB = b.cursoOrigen !== selectedCurso;

        if (isExternoA && !isExternoB) return 1;
        if (!isExternoA && isExternoB) return -1;

        const nombreA = (a.nombre || '').trim().toLowerCase();
        const nombreB = (b.nombre || '').trim().toLowerCase();
        return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
      });
  }, [alumnos, selectedCurso]);

  // Filtrar notificaciones de partes faltantes pendientes para este docente
  const notificacionesFaltantes = useMemo(() => {
    return solicitudesFaltantes.filter(
      sol => cursosAsignados.includes(sol.curso) && !sol.completada
    );
  }, [solicitudesFaltantes, cursosAsignados]);

  // Al seleccionar un curso o atender una solicitud de parte faltante
  const handleSelectCurso = (curso, fechaSolicitud = null) => {
    setSelectedCurso(curso);
    setSuccessMsg('');
    setErrorMsg('');
    setSignedParte(null);
    
    // Configurar fecha
    if (fechaSolicitud) {
      setFecha(fechaSolicitud);
    } else {
      setFecha(new Date().toISOString().split('T')[0]);
    }

    setHuboClase('Sí');
    setMotivoSuspension('Licencia Médica');
    setOtroMotivoText('');
    setClaseNum('');
    setUnidad('I');
    setCaracter('Práctica');
    setDinamica('Grupal');
    setObservaciones('');
    setTemaAbordado('');
    setActividades('');
    
    const schoolTurno = curso.endsWith('1°') ? 'Mañana' : 'Tarde';
    const turnoDetectado = schoolTurno === 'Mañana' ? 'Tarde' : 'Mañana';
    const config = cursosConfig[curso];
    const horarioEstimado = config ? config.horario : (turnoDetectado === "Mañana" ? "08:00 - 09:30" : "13:30 - 15:00");
    setHorario(horarioEstimado);

    // Inicializar asistencia (solo alumnos que cursan EF activamente en esta división)
    const initialAsistencia = {};
    alumnos.filter(al => al.cursoEF === curso && !al.noCursaEF).forEach(al => {
      initialAsistencia[al.dni] = 'Presente';
    });
    setAsistenciaState(initialAsistencia);
  };

  const handleAsistenciaChange = (dni, estado) => {
    setAsistenciaState(prev => ({ ...prev, [dni]: estado }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setSignedParte(null);

    // Validar duplicado antes de guardar
    const yaExiste = partes.some(p => 
      p.curso === selectedCurso && 
      p.fecha === fecha && 
      p.id !== isEditingParteId
    );
    if (yaExiste) {
      setErrorMsg(`Ya existe un parte diario registrado para el curso ${selectedCurso} en la fecha ${new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR')}. No se permiten duplicados.`);
      return;
    }

    // Determinar valores según si HUBO clase o NO
    let temaAbordadoFinal = '';
    let actividadesFinal = '';
    let observacionesFinal = observaciones.trim() || 'Sin observaciones.';
    let asistenciaFinal = { ...asistenciaState };
    let claseNumFinal = claseNum.trim();
    let unidadFinal = unidad.trim();
    let caracterFinal = caracter;
    let dinamicaFinal = dinamica.trim();

    if (huboClase === 'No') {
      // ANULAR carga de asistencias (motivos de la anulación)
      const motivoCompleto = motivoSuspension === 'Otros' ? `Otros: ${otroMotivoText.trim()}` : motivoSuspension;
      
      if (motivoSuspension === 'Otros' && !otroMotivoText.trim()) {
        setErrorMsg("Por favor, especifique el motivo de la suspensión de clases.");
        return;
      }

      temaAbordadoFinal = `[CLASE NO DICTADA] - Motivo: ${motivoCompleto}`;
      actividadesFinal = '-';
      observacionesFinal = `Clase suspendida. Motivo: ${motivoCompleto}`;
      claseNumFinal = '-';
      characterFinal = '-';
      unidadFinal = '-';
      caracterFinal = '-';
      dinamicaFinal = '-';

      // Marcar a todos los alumnos activos en este curso con "-" (no se tomó asistencia porque no hubo clases)
      alumnosFiltrados.filter(al => al.cursoEF === selectedCurso && !al.noCursaEF).forEach(al => {
        asistenciaFinal[al.dni] = '-';
      });
    } else {
      // Validaciones si HUBO clases
      if (!claseNum.trim()) {
        setErrorMsg("El número de Clase es obligatorio.");
        return;
      }
      if (!unidad.trim()) {
        setErrorMsg("La Unidad es obligatoria.");
        return;
      }
      if (!temaAbordado.trim()) {
        setErrorMsg("El Tema Abordado es obligatorio.");
        return;
      }
      if (!actividades.trim()) {
        setErrorMsg("Las Actividades que se desarrollan son obligatorias.");
        return;
      }
      temaAbordadoFinal = temaAbordado.trim();
      actividadesFinal = actividades.trim();
    }

    const dateObj = new Date(fecha + 'T00:00:00');
    const diaString = String(dateObj.getDate()).padStart(2, '0');
    const mesesNombres = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const mesString = mesesNombres[dateObj.getMonth()];
    const turno = (selectedCurso.endsWith('2°') || selectedCurso.endsWith('3°')) ? "Tarde" : "Mañana";

    // Firma digital
    const firmaDigital = {
      apellido: user.apellido,
      nombre: user.nombre,
      cargo: "Prof. de Educación Física",
      correo: user.correo,
      fechaFirma: new Date().toISOString()
    };

    const nuevoParte = {
      fecha,
      dia: diaString,
      mes: mesString,
      claseNum: claseNumFinal,
      unidad: unidadFinal,
      caracter: caracterFinal,
      dinamica: dinamicaFinal,
      observaciones: observacionesFinal,
      curso: selectedCurso,
      turno,
      horario,
      docenteNombre: `${user.nombre} ${user.apellido}`,
      huboClase, // Sí o No
      motivoSuspension: huboClase === 'No' ? (motivoSuspension === 'Otros' ? otroMotivoText.trim() : motivoSuspension) : "",
      asistencia: asistenciaFinal,
      contenido: temaAbordadoFinal,
      actividades: actividadesFinal,
      firmaDigital,
      firmaAutoridad: isEditingParteId ? (partes.find(p => p.id === isEditingParteId)?.firmaAutoridad || null) : null
    };

    if (isEditingParteId) {
      actualizarParteEF(isEditingParteId, nuevoParte);
      setSuccessMsg("¡Parte diario actualizado con éxito!");
      setSuccessModalTitle("¡Parte Actualizado!");
      setSuccessModalDescription("El parte diario de asistencia ha sido modificado y guardado con éxito.");
      setShowSuccessModal(true);
    } else {
      guardarParteEF(nuevoParte);
      setSignedParte(nuevoParte);
      setSuccessMsg(
        huboClase === 'Sí' 
          ? "¡Parte firmado y registrado en el Libro de Temas!" 
          : "¡Parte registrado como CLASE SUSPENDIDA con firma digital!"
      );
      setSuccessModalTitle("Parte generado con éxito");
      setSuccessModalDescription(
        huboClase === 'Sí'
          ? `El parte de asistencia para el curso ${selectedCurso} correspondiente a la fecha ${new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR')} ha sido firmado digitalmente e inyectado correctamente en el Libro de Temas.`
          : `El parte sin dictado de clases para el curso ${selectedCurso} (Fecha: ${new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR')}) ha sido registrado con éxito.`
      );
      setShowSuccessModal(true);
    }
  };

  return (
    <div className="space-y-6">
      {!selectedCurso ? (
        // PANTALLA 1: Listado de Cursos + Solicitudes Faltantes
        <div className="space-y-6">
          
          {/* Panel de Notificaciones de Solicitudes Faltantes */}
          {notificacionesFaltantes.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-5 shadow-sm relative overflow-hidden animate-pulse-once">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl"></div>
              
              <div className="flex items-center gap-2 text-red-700 font-bold text-sm uppercase tracking-wider mb-4">
                <Bell className="animate-bounce" size={16} />
                <span>Solicitudes de Partes Faltantes Pendientes</span>
              </div>
              
              <div className="space-y-3">
                {notificacionesFaltantes.map((sol) => (
                  <div 
                    key={sol.id} 
                    className="bg-white border border-red-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <span className="inline-block bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-red-200">
                        FALTA PARTE DIARIO
                      </span>
                      <div className="mt-1.5 text-xs text-slate-800 font-bold">
                        Curso: {sol.curso} EF • Fecha Requerida: <span className="font-mono text-primary-500">{new Date(sol.fecha + 'T00:00:00').toLocaleDateString('es-AR')}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Solicitado por: <strong>{sol.solicitanteNombre} ({sol.solicitanteRol})</strong> el {new Date(sol.fechaSolicitud).toLocaleDateString()}
                      </div>
                      {sol.comentario && (
                        <div className="text-[10px] text-slate-650 bg-slate-50 border border-slate-200 p-2 rounded-xl mt-2 font-semibold text-left">
                          <strong>Comentario preceptor:</strong> {sol.comentario}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleSelectCurso(sol.curso, sol.fecha)}
                      className="bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer self-start sm:self-center shrink-0"
                    >
                      Confeccionar Parte Faltante
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cursos Asignados */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 font-display">Cursos Asignados</h2>
                <p className="text-slate-500 text-xs mt-1">Selecciona una de tus clases para confeccionar el Parte Diario o reportar una inasistencia.</p>
              </div>
              {cursosAsignados.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    setFechaInasistencia(todayStr);
                    
                    // Auto-seleccionar cursos del día de hoy
                    const dateObj = new Date(todayStr + 'T00:00:00');
                    const dayOfWeek = dateObj.getDay();
                    const cursosDelDia = cursosAsignados.filter(curso => {
                      const config = cursosConfig[curso];
                      return config?.dias?.includes(dayOfWeek);
                    });
                    setSelectedCursosInasistencia(cursosDelDia);

                    setMotivoInasistencia('Licencia Médica');
                    setComentarioInasistencia('');
                    setShowInasistenciaModal(true);
                  }}
                  className="bg-red-500 hover:bg-red-650 hover:bg-red-600 text-white font-bold text-xs py-2.5 px-4.5 rounded-xl transition-all shadow-md shadow-red-500/10 cursor-pointer active:scale-95 flex items-center gap-1.5 self-start sm:self-center shrink-0 uppercase tracking-wide"
                >
                  <Calendar size={14} />
                  Reportar Inasistencia
                </button>
              )}
            </div>
            
            {cursosAsignados.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-slate-300 rounded-3xl bg-white">
                <AlertOctagon className="mx-auto text-slate-400 mb-2" size={32} />
                <p className="text-slate-500 font-bold text-sm">No tienes ningún curso asignado en la consola administrativa.</p>
                <p className="text-slate-400 text-xs mt-1">Pídele a un Director o Preceptor que te asigne cursos en la sección de administración.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {cursosAsignados.map((curso) => {
                  const cantidad = alumnos.filter(al => al.cursoEF === curso).length;
                  const config = cursosConfig[curso];
                  const turno = config ? config.turno : (curso.endsWith('1°') ? 'Mañana' : 'Tarde');
                  
                  return (
                    <button
                      key={curso}
                      onClick={() => handleSelectCurso(curso)}
                      className="glass-panel text-left p-6 rounded-2xl border border-slate-200 hover:border-primary-500/30 hover:bg-primary-500/5 transition-all duration-300 group relative overflow-hidden bg-white cursor-pointer"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full blur-xl -mr-8 -mt-8 group-hover:bg-primary-500/10 transition-all"></div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-display font-extrabold text-3xl text-slate-800 tracking-tight">{curso}</span>
                        <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                          {turno}
                        </span>
                      </div>

                      <div className="space-y-2 mt-6">
                        <div className="text-xs text-slate-500 font-medium">
                          Estudiantes Totales: <strong className="text-slate-850 font-bold">{cantidad}</strong>
                        </div>
                        <div className="text-[10px] text-primary-500 flex items-center gap-1 font-bold">
                          <span>Confeccionar Parte</span>
                          <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Historial de Partes Entregados */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-200 shadow-lg bg-white">
            <h2 className="text-xl font-bold text-slate-850 font-display mb-4">Historial de Partes Entregados</h2>
            <p className="text-slate-500 text-xs mb-6 font-semibold">Listado de partes cargados y firmados por usted para sus cursos asignados. Permite editar los datos o eliminar registros.</p>

            {misPartesEntregados.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <p className="text-xs text-slate-400 font-bold">No registra partes diarios entregados en este período.</p>
              </div>
            ) : (
              <div className="overflow-x-auto font-sans">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-650 font-bold uppercase">
                      <th className="py-3 px-3">Curso</th>
                      <th className="py-3 px-3">Fecha</th>
                      <th className="py-3 px-3">Horario</th>
                      <th className="py-3 px-3 text-center">Clase N°</th>
                      <th className="py-3 px-3">Tema Abordado</th>
                      <th className="py-3 px-3 text-center">Presentes</th>
                      <th className="py-3 px-3 text-center">Ausentes</th>
                      <th className="py-3 px-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {misPartesEntregados.map((p) => {
                      const cantidadPresentes = Object.values(p.asistencia || {}).filter(a => a === 'Presente').length;
                      const cantidadAusentes = Object.values(p.asistencia || {}).filter(a => a === 'Ausente').length;
                      
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 text-slate-700 transition-colors">
                          <td className="py-3 px-3 font-extrabold text-slate-900">{p.curso}</td>
                          <td className="py-3 px-3 font-bold font-mono text-slate-750">
                            {new Date(p.fecha + 'T00:00:00').toLocaleDateString('es-AR')}
                          </td>
                          <td className="py-3 px-3 text-slate-500 font-semibold">{p.horario}</td>
                          <td className="py-3 px-3 font-bold text-slate-600 text-center">{p.claseNum || '-'}</td>
                          <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={p.temaAbordado}>{p.temaAbordado}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-block bg-accent-50 text-accent-700 px-2 py-0.5 rounded-lg border border-accent-200 font-bold">
                              {cantidadPresentes}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-block bg-red-50 text-red-700 px-2 py-0.5 rounded-lg border border-red-200 font-bold">
                              {cantidadAusentes}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditParteClick(p)}
                                className="p-1.5 text-primary-500 hover:text-primary-750 hover:bg-primary-500/10 rounded-lg transition-all cursor-pointer"
                                title="Editar Parte"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteParteClick(p.id)}
                                className="p-1.5 text-red-500 hover:text-red-750 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                                title="Eliminar Registro"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        // PANTALLA 2: Formulario del Parte
        <div className="glass-panel rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xl relative bg-white">
          
          <div className="flex items-center justify-between border-b border-slate-150 pb-5 mb-6">
            <div>
              <span className="text-[10px] font-bold text-primary-600 bg-primary-500/10 border border-primary-500/20 px-2.5 py-0.5 rounded-full uppercase">
                Parte e Inyección en Libro de Temas
              </span>
              <h2 className="text-2xl font-bold text-slate-900 font-display mt-1.5">
                {isEditingParteId ? `Edición de Clase: ${selectedCurso}` : `Confección de Clase: ${selectedCurso}`}
              </h2>
            </div>
            <button
              onClick={() => {
                setSelectedCurso(null);
                setIsEditingParteId(null);
              }}
              className="text-xs text-slate-650 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer font-bold"
            >
              Cancelar
            </button>
          </div>

          {successMsg && (
            <div className="mb-6 p-4 bg-accent-500/10 border border-accent-500/20 text-accent-700 text-sm rounded-2xl flex items-center gap-3 animate-pulse-once font-semibold">
              <CheckCircle2 className="text-accent-600 shrink-0" size={20} />
              <div>
                <span className="font-bold block">{successMsg}</span>
                <span className="text-[11px] text-accent-600/80 font-normal">Redirigiendo al panel de cursos...</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-500/5 border border-red-500/15 text-red-700 text-sm rounded-2xl flex items-center gap-3 font-semibold">
              <AlertCircle className="text-red-500 shrink-0" size={20} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {isFeriado && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-800 text-sm rounded-2xl flex items-center gap-3 font-semibold animate-fade-in">
                <Calendar className="text-amber-600 shrink-0" size={20} />
                <div>
                  <span className="font-bold block">Feriado / Fecha Patria: {feriadoDelDia.descripcion}</span>
                  <span className="text-[11px] font-normal">La fecha seleccionada corresponde a un feriado. La toma de asistencia se ha deshabilitado y el parte se registrará como clase suspendida.</span>
                </div>
              </div>
            )}

            {/* PREGUNTA CRÍTICA: ¿HUBO CLASES HOY? */}
            <div className={`border p-5 rounded-2xl ${isFeriado ? 'bg-slate-100 border-slate-200 opacity-80' : 'bg-slate-50 border-slate-200'}`}>
              <span className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-3 text-center">
                ¿Hubo clases de Educación Física el día de hoy? <span className="text-red-500">*</span>
              </span>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <button
                  type="button"
                  disabled={isFeriado}
                  onClick={() => setHuboClase('Sí')}
                  className={`py-3.5 px-4 rounded-xl border font-bold text-xs uppercase transition-all flex items-center justify-center gap-2 ${
                    isFeriado 
                      ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
                      : huboClase === 'Sí'
                        ? 'bg-accent-500 border-accent-600 text-white shadow-md shadow-accent-500/10 cursor-pointer'
                        : 'bg-white border-slate-250 text-slate-500 hover:bg-slate-100 hover:text-slate-700 border-slate-200 cursor-pointer'
                  }`}
                >
                  <Check size={16} />
                  SÍ, hubo clases
                </button>
                <button
                  type="button"
                  disabled={isFeriado}
                  onClick={() => setHuboClase('No')}
                  className={`py-3.5 px-4 rounded-xl border font-bold text-xs uppercase transition-all flex items-center justify-center gap-2 ${
                    isFeriado
                      ? 'bg-red-500 border-red-600 text-white shadow-md shadow-red-500/10 cursor-not-allowed'
                      : huboClase === 'No'
                        ? 'bg-red-500 border-red-600 text-white shadow-md shadow-red-500/10 cursor-pointer'
                        : 'bg-white border-slate-250 text-slate-500 hover:bg-slate-100 hover:text-slate-700 border-slate-200 cursor-pointer'
                  }`}
                >
                  <X size={16} />
                  NO hubo clases
                </button>
              </div>
            </div>

            {/* Cabecera / Configuración del Parte */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Profesor Interino</label>
                <input
                  type="text"
                  value={`${user.nombre} ${user.apellido}`}
                  disabled
                  className="w-full bg-white border border-slate-250 text-slate-500 rounded-xl px-3 py-2 text-xs font-semibold cursor-not-allowed border-slate-200 font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Fecha del Parte</label>
                <input
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Turno Cursada</label>
                <input
                  type="text"
                  value={(selectedCurso.endsWith('2°') || selectedCurso.endsWith('3°')) ? "Tarde" : "Mañana"}
                  disabled
                  className="w-full bg-white border border-slate-250 text-slate-500 rounded-xl px-3 py-2 text-xs font-semibold cursor-not-allowed border-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Días y Horarios EF</label>
                <input
                  type="text"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all font-mono"
                />
              </div>
            </div>

            {/* RENDERIZADO DINÁMICO CONDICIONAL: SI HUBO CLASE (Formulario completo) */}
            {huboClase === 'Sí' ? (
              <div className="space-y-6 animate-pulse-once">
                
                {/* Campos Libro de Temas */}
                <div className="bg-primary-500/5 p-5 rounded-2xl border border-primary-500/10 space-y-4">
                  <span className="text-[11px] font-bold text-primary-600 block uppercase tracking-wider mb-2 font-display">
                    Campos del Libro de Temas (Estructura Oficial)
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Clase N°</label>
                      <input
                        type="text"
                        value={claseNum}
                        readOnly
                        placeholder="Autocalculado"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-500 rounded-xl px-3 py-2 text-xs cursor-not-allowed font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Unidad <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={unidad}
                        onChange={(e) => setUnidad(e.target.value)}
                        placeholder="Ej. I / II"
                        required
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Carácter de la Clase</label>
                      <select
                        value={caracter}
                        onChange={(e) => setCaracter(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all font-bold cursor-pointer"
                      >
                        {CARACTERES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Dinámica de Clase</label>
                      <input
                        type="text"
                        value={dinamica}
                        onChange={(e) => setDinamica(e.target.value)}
                        placeholder="Grupal, Parejas, Estaciones..."
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tema Abordado <span className="text-red-500">*</span></label>
                      <textarea
                        value={temaAbordado}
                        onChange={(e) => setTemaAbordado(e.target.value)}
                        placeholder="Describa el tema o contenido curricular..."
                        rows={2}
                        required
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all font-sans leading-relaxed font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Actividades que se desarrollan <span className="text-red-500">*</span></label>
                      <textarea
                        value={actividades}
                        onChange={(e) => setActividades(e.target.value)}
                        placeholder="Describa las actividades físicas, ejercicios o juegos..."
                        rows={2}
                        required
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all font-sans leading-relaxed font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Observaciones</label>
                      <textarea
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        placeholder="Incidentes, conducta, justificaciones, etc. (Opcional)"
                        rows={2}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all font-sans leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* Tabla de Asistencia */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3 font-display">Tabla de Asistencia (Matrícula + Externos)</h3>
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-inner">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase">
                          <th className="py-2.5 px-4">Estudiante (Apellido, Nombre)</th>
                          <th className="py-2.5 px-3">DNI</th>
                          <th className="py-2.5 px-3">Curso Origen</th>
                          <th className="py-2.5 px-4 text-center w-48">Control de Asistencia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {alumnosFiltrados.map((al) => {
                          const esExterno = al.cursoOrigen !== selectedCurso;
                          const esInactivoEnEsteCurso = al.noCursaEF || (al.cursoEF !== selectedCurso && al.cursoOrigen === selectedCurso);
                          const controlValue = asistenciaState[al.dni] || 'Presente';
                          
                          return (
                            <tr key={al.dni} className="hover:bg-slate-50 text-slate-700">
                              <td className="py-3 px-4 font-semibold">
                                <span className={
                                  al.noCursaEF 
                                    ? 'text-red-600 line-through' 
                                    : esInactivoEnEsteCurso 
                                      ? 'text-slate-400 line-through' 
                                      : 'text-slate-800'
                                }>
                                  {al.nombre}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-500">{al.dni}</td>
                              <td className="py-3 px-3 font-medium">
                                {al.noCursaEF ? (
                                  <span className="inline-block bg-red-100 text-red-700 border border-red-300 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider">
                                    NO CURSA EF
                                  </span>
                                ) : al.cursoEF !== selectedCurso ? (
                                  <span className="inline-block bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded text-[9px] font-bold">
                                    Cursa en {al.cursoEF}
                                  </span>
                                ) : esExterno ? (
                                  <span className="inline-block bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[9px] font-bold">
                                    Externo (desde {al.cursoOrigen})
                                  </span>
                                ) : (
                                  <span className="text-slate-500">{al.cursoOrigen}</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {al.noCursaEF ? (
                                  <div className="text-center font-extrabold text-[9px] text-red-700 uppercase select-none py-1.5 bg-red-50 rounded-lg border border-red-200">
                                    NO CURSA EF
                                  </div>
                                ) : esInactivoEnEsteCurso ? (
                                  <div className="text-center font-bold text-[9px] text-slate-400 uppercase select-none py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                                    Sin Registro
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleAsistenciaChange(al.dni, 'Presente')}
                                      className={`flex items-center gap-1 px-3 py-1 rounded-lg border font-bold text-[10px] transition-all cursor-pointer ${
                                        controlValue === 'Presente'
                                          ? 'bg-accent-50 text-accent-700 border-accent-300 shadow-sm'
                                          : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                                      }`}
                                    >
                                      <Check size={10} />
                                      Presente
                                    </button>
                                    
                                    <button
                                      type="button"
                                      onClick={() => handleAsistenciaChange(al.dni, 'Ausente')}
                                      className={`flex items-center gap-1 px-3 py-1 rounded-lg border font-bold text-[10px] transition-all cursor-pointer ${
                                        controlValue === 'Ausente'
                                          ? 'bg-red-50 text-red-700 border-red-300 shadow-sm'
                                          : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                                      }`}
                                    >
                                      <X size={10} />
                                      Ausente
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            ) : (
              // RENDERIZADO DINÁMICO CONDICIONAL: SI NO HUBO CLASES
              <div className="bg-red-50/50 border border-red-200 p-6 rounded-3xl space-y-4 animate-pulse-once">
                <div className="flex items-start gap-3">
                  <AlertOctagon className="text-red-500 shrink-0 mt-0.5" size={24} />
                  <div>
                    <h3 className="text-base font-bold text-red-800 font-display">Clase No Dictada (Carga de Asistencias Anulada)</h3>
                    <p className="text-xs text-red-650 text-red-700 mt-1 leading-relaxed">
                      Ha indicado que no hubo clases el día de hoy. El sistema ha **bloqueado y anulado** la carga de asistencia individual de los alumnos. Por favor, establezca los motivos de la suspensión escolar.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Motivo de Suspensión de Clases <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={motivoSuspension}
                      onChange={(e) => setMotivoSuspension(e.target.value)}
                      className="w-full bg-white border border-slate-350 focus:border-red-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none transition-all font-bold cursor-pointer border-slate-300"
                    >
                      {SUSPENSION_MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  {/* Campo para especificar en caso de "Otros" */}
                  {motivoSuspension === 'Otros' && (
                    <div className="animate-pulse-once">
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Especifique el Motivo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={otroMotivoText}
                        onChange={(e) => setOtroMotivoText(e.target.value)}
                        placeholder="Describa el motivo específico (ej: Jornada Institucional)..."
                        required
                        className="w-full bg-white border border-red-500/30 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all font-semibold"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Observaciones de Suspensión (Opcional)</label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Agregue información de respaldo sobre la suspensión de clases si es necesario..."
                    rows={2}
                    className="w-full bg-white border border-slate-300 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none transition-all font-sans leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* Visualizador de Sello de Firma */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
              
              <div>
                <div className="flex items-center gap-2 text-primary-500 font-bold text-xs uppercase tracking-wide">
                  <FileSignature size={14} className="animate-pulse" />
                  <span>Sello de Firma Digital Automática</span>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-bold text-slate-800">{user.nombre} {user.apellido}</p>
                  <p className="text-[10px] text-slate-500 font-mono font-semibold">Prof. de Educación Física • {user.correo}</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-center self-start sm:self-center font-mono text-[9px] text-slate-500 shadow-sm font-bold">
                <span className="block font-bold text-[8px] uppercase tracking-wider text-slate-400 mb-0.5">Sello Digital</span>
                <span>SECURE_AUTH_VERIFIED_EES28</span>
              </div>
            </div>

            <button
              type="submit"
              className={`w-full text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer uppercase tracking-wider text-xs ${
                isEditingParteId
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/10'
                  : huboClase === 'Sí' 
                    ? 'bg-primary-500 hover:bg-primary-600 shadow-primary-500/10' 
                    : 'bg-red-500 hover:bg-red-600 shadow-red-500/10'
              }`}
            >
              <FileSignature size={18} />
              {isEditingParteId 
                ? 'Guardar Cambios y Actualizar Libro'
                : huboClase === 'Sí' 
                  ? 'Firmar y Registrar en Libro de Temas' 
                  : 'Firmar Acta de Clase Suspendida'}
            </button>
          </form>

        </div>
      )}

      {/* MODAL ÉXITO AL GENERAR PARTE */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 relative overflow-hidden animate-zoom-in text-center animate-fade-in">
            {/* Glowing background decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent-500/5 rounded-full blur-xl -mr-6 -mt-6"></div>

            {/* Check/Success Icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-accent-50 border border-accent-200 flex items-center justify-center text-accent-600 mb-4 shadow-sm">
              <CheckCircle2 size={32} className="animate-pulse" />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 font-display">
              {successModalTitle}
            </h3>
            <p className="text-xs text-slate-550 text-slate-500 mt-2.5 leading-relaxed font-semibold text-center">
              {successModalDescription}
            </p>

            <button
              type="button"
              onClick={handleCloseSuccessModal}
              className="mt-6 w-full bg-accent-500 hover:bg-accent-600 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-md shadow-accent-500/10 cursor-pointer active:scale-95 uppercase tracking-wider"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* MODAL REPORTAR INASISTENCIA */}
      {showInasistenciaModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 md:p-8 relative overflow-hidden animate-zoom-in max-h-[90vh] overflow-y-auto">
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between border-b border-slate-150 pb-4 mb-5">
              <div>
                <span className="text-[10px] font-bold text-red-650 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full uppercase">
                  Reporte de Inasistencia Docente
                </span>
                <h3 className="text-xl font-bold text-slate-900 font-display mt-1">
                  Declarar Inasistencia
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInasistenciaModal(false)}
                className="text-slate-400 hover:text-slate-650 bg-slate-50 hover:bg-slate-100 p-2 rounded-full border border-slate-200 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-5 text-left text-xs font-semibold">
              <p className="text-slate-550 text-slate-500 font-medium leading-relaxed">
                Seleccione la fecha y los cursos en los que no dictará clases. Se registrará automáticamente la inasistencia y se inyectará en el Libro de Temas de cada curso.
              </p>

              {/* Fecha de Inasistencia */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">Fecha de la Inasistencia</label>
                  <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                    Día: <strong className="text-slate-800">{getNombreDiaSemana(fechaInasistencia)}</strong>
                  </span>
                </div>
                <input
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  value={fechaInasistencia}
                  onChange={(e) => setFechaInasistencia(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-red-500 transition-all"
                />
              </div>

              {/* Selección de Cursos */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">Cursos Afectados <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  {cursosAsignados.map(curso => {
                    const isChecked = selectedCursosInasistencia.includes(curso);
                    const config = cursosConfig[curso];
                    const dateObj = new Date(fechaInasistencia + 'T00:00:00');
                    const dayOfWeek = dateObj.getDay();
                    const isScheduledToday = config?.dias?.includes(dayOfWeek);

                    return (
                      <label
                        key={curso}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'bg-red-50 border-red-200 text-red-700 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleCursoInasistenciaToggle(curso)}
                            className="w-3.5 h-3.5 accent-red-500 rounded cursor-pointer"
                          />
                          <span>Curso {curso}</span>
                        </div>
                        {isScheduledToday && (
                          <span className="text-[9px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded-md border border-red-200 font-extrabold font-sans">
                            PROGRAMADO
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>

                {/* Advertencia si no tiene cursos programados para este día de la semana */}
                {fechaInasistencia && (() => {
                  const dateObj = new Date(fechaInasistencia + 'T00:00:00');
                  const dayOfWeek = dateObj.getDay();
                  const anyScheduled = cursosAsignados.some(curso => cursosConfig[curso]?.dias?.includes(dayOfWeek));
                  if (!anyScheduled) {
                    return (
                      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-2xl flex gap-2.5 items-start mt-2">
                        <AlertCircle className="shrink-0 text-yellow-600 mt-0.5" size={16} />
                        <p className="text-[10px] leading-relaxed font-medium">
                          <strong>Aviso:</strong> No tiene cursos programados habitualmente para los días <strong>{getNombreDiaSemana(fechaInasistencia)}</strong>.
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Motivo de Inasistencia */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Motivo del Reporte</label>
                <select
                  value={motivoInasistencia}
                  onChange={(e) => setMotivoInasistencia(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500 transition-all font-bold cursor-pointer"
                >
                  <option value="Licencia Médica">Licencia Médica</option>
                  <option value="Razones Personales">Razones Personales</option>
                  <option value="Trámites">Trámites</option>
                  <option value="Otros">Otros (Especificar)</option>
                </select>
              </div>

              {/* Comentario Adicional */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Observaciones / Comentarios {motivoInasistencia === 'Otros' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={comentarioInasistencia}
                  onChange={(e) => setComentarioInasistencia(e.target.value)}
                  placeholder={motivoInasistencia === 'Otros' ? 'Escriba obligatoriamente el motivo aquí...' : 'Añada algún detalle adicional... (Opcional)'}
                  rows={2}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500 transition-all leading-relaxed font-semibold"
                />
              </div>

              {/* Advertencia Premium */}
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-3 flex gap-2.5 items-start">
                <AlertOctagon className="shrink-0 text-red-550 mt-0.5" size={16} />
                <p className="text-[10px] leading-relaxed font-medium">
                  <strong>IMPORTANTE:</strong> Al registrar la inasistencia, se generará automáticamente un parte con estado <strong>Clase Suspendida</strong> para los cursos seleccionados, registrándose en sus Libros de Temas.
                </p>
              </div>
            </div>

            {/* Acciones */}
            <div className="mt-6 pt-4 border-t border-slate-150 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowInasistenciaModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-750 font-bold text-xs px-5 py-2.5 rounded-xl border border-slate-200 transition-all cursor-pointer active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarInasistencia}
                className="bg-red-500 hover:bg-red-650 hover:bg-red-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-red-500/10 cursor-pointer active:scale-95 uppercase tracking-wide"
              >
                Confirmar Reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocenteAsistencia;
