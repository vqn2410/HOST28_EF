import React, { useState, useMemo, useEffect } from 'react';
import { useSchoolData } from '../context/SchoolDataContext';
import { useAuth } from '../context/AuthContext';
import { UserPlus, GraduationCap, CheckCircle2, AlertTriangle, Users, BookOpen, CalendarRange, Edit, Trash2, Upload, Download, Search } from 'lucide-react';

const AdminPanel = ({ activeTabOverride, onNavigate }) => {
  const { alumnos, agregarEstudiante, agregarEstudiantesBatch, actualizarEstudiante, eliminarEstudiante, cursosConfig, actualizarCursoConfig, eliminarCursoConfig, solicitudesFaltantes = [], informes = [], partes = [], guardarParteEF, actualizarParteEF, eliminarParteEF, parteToEditGlobal, setParteToEditGlobal, feriados, agregarFeriado, agregarRecesoInvierno, eliminarFeriado } = useSchoolData();
  const { user, usuarios, registrarUsuario, actualizarUsuario, eliminarUsuario } = useAuth();

  // Estados para el modo de edición
  const [editingUsrDni, setEditingUsrDni] = useState(null);
  const [editingEstDni, setEditingEstDni] = useState(null);
  const [localActiveTab, setLocalActiveTab] = useState(() => {
    return user?.rol === 'Preceptor' ? 'estudiantes_carga' : 'usuarios_carga';
  });
  
  const activeTab = activeTabOverride || localActiveTab;
  const setActiveTab = setLocalActiveTab;
  const navigateToAdminTab = (tab) => {
    if (onNavigate) {
      onNavigate(`/admin/${tab}`);
      return;
    }
    setActiveTab(tab);
  };

  // Estados para Feriados
  const [feriadoFecha, setFeriadoFecha] = useState('');
  const [feriadoDesc, setFeriadoDesc] = useState('');
  const [recesoInicio, setRecesoInicio] = useState('');
  const [recesoFin, setRecesoFin] = useState('');
  const [feriadoSuccess, setFeriadoSuccess] = useState('');

  // Estados para la carga del CSV en tiempo real
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    total: 0,
    current: 0,
    processingName: '',
    logs: [],
    completed: false,
    successCount: 0,
    errorCount: 0,
    warningCount: 0
  });

  // Estados para la carga masiva de partes diarios
  const [partesUploadError, setPartesUploadError] = useState('');
  const [partesUploadSuccess, setPartesUploadSuccess] = useState('');
  const [showPartesUploadModal, setShowPartesUploadModal] = useState(false);
  const [partesUploadProgress, setPartesUploadProgress] = useState({
    total: 0,
    current: 0,
    processingName: '',
    logs: [],
    completed: false,
    successCount: 0,
    errorCount: 0,
    warningCount: 0
  });

  // ─────────── Estados para el formulario de Creación de Parte (Admin) ───────────
  const PARTE_CARACTERES = ['Práctica', 'Teórica', 'Teórica-Práctica', 'Evaluativa', 'Recreativa'];
  const PARTE_SUSPENSION_MOTIVOS = ['Licencia Médica', 'Causas climáticas', 'Jornada Institucional', 'Otros'];

  const [adminParteSelectedCurso, setAdminParteSelectedCurso] = useState(null);
  const [adminParteEditingId, setAdminParteEditingId] = useState(null);
  const [adminParteFecha, setAdminParteFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [adminParteHorario, setAdminParteHorario] = useState('08:00 - 09:30');
  const [adminParteHuboClase, setAdminParteHuboClase] = useState('Sí');
  const [adminParteMotivoSuspension, setAdminParteMotivoSuspension] = useState('Causas climáticas');
  const [adminParteOtroMotivo, setAdminParteOtroMotivo] = useState('');
  const [adminParteClaseNum, setAdminParteClaseNum] = useState('');
  const [adminParteUnidad, setAdminParteUnidad] = useState('');
  const [adminParteCaracter, setAdminParteCaracter] = useState('Práctica');
  const [adminParteDinamica, setAdminParteDinamica] = useState('Grupal');
  const [adminParteContenido, setAdminParteContenido] = useState('');
  const [adminParteActividades, setAdminParteActividades] = useState('');
  const [adminParteObservaciones, setAdminParteObservaciones] = useState('');
  const [adminParteDocenteDni, setAdminParteDocenteDni] = useState('');
  const [adminParteAsistencia, setAdminParteAsistencia] = useState({});
  const [adminParteSuccessMsg, setAdminParteSuccessMsg] = useState('');
  const [adminParteErrorMsg, setAdminParteErrorMsg] = useState('');
  const [adminParteShowSuccessModal, setAdminParteShowSuccessModal] = useState(false);
  const [adminParteSuccessModalTitle, setAdminParteSuccessModalTitle] = useState('');
  const [adminParteSuccessModalDescription, setAdminParteSuccessModalDescription] = useState('');

  // Cursos Oficiales según las especificaciones de la E.E.S N° 28:
  // - 1° y 2° año: 3 divisiones (1°, 2° y 3° -> 1°1°, 1°2°, 1°3°)
  // - 3° a 6° año: 2 divisiones (1° y 2° -> 3°1°, 3°2°, etc.)
  const CURSOS = useMemo(() => [
    '1°1°', '1°2°', '1°3°',
    '2°1°', '2°2°', '2°3°',
    '3°1°', '3°2°',
    '4°1°', '4°2°',
    '5°1°', '5°2°',
    '6°1°', '6°2°'
  ], []);

  // Función para determinar el turno automáticamente en base a la división:
  // - Las 1° divisiones (terminadas en 1°) son del Turno Mañana
  // - El resto (terminadas en 2° o 3°) son del Turno Tarde
  const determinarTurno = (curso) => {
    return curso.endsWith('1°') ? 'Mañana' : 'Tarde';
  };

  // Estados del Formulario de Carga de Usuario
  const [usrForm, setUsrForm] = useState({
    apellido: '',
    nombre: '',
    dni: '',
    fechaNac: '',
    correo: '',
    rol: 'Docente',
    situacionRevista: 'Titular',
    cursosAsignados: []
  });
  const [usrError, setUsrError] = useState('');
  const [usrSuccess, setUsrSuccess] = useState('');

  // Estados del Formulario de Carga de Estudiante (con turno auto-calculado)
  const [enrollMode, setEnrollMode] = useState('individual'); // 'individual' o 'csv'
  const [estForm, setEstForm] = useState({
    nombre: '',
    dni: '',
    cursoOrigen: '1°1°',
    turno: 'Mañana',
    asignarDiferenteEF: false,
    cursoEF: '1°1°',
    noCursaEF: false,
    recursaCursos: []
  });
  const [estError, setEstError] = useState('');
  const [estSuccess, setEstSuccess] = useState('');

  // Estados de Filtros para la pestaña de Estudiantes Matriculados
  const [filterCurso, setFilterCurso] = useState('Todos');
  const [filterTurno, setFilterTurno] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Estados del Formulario de Configuración de Cursos EF (con turno auto-calculado y desglose de horarios)
  const [cursoConfigForm, setCursoConfigForm] = useState({
    curso: '1°1°',
    docenteDni: '',
    dias: [1, 3],
    horariosPorDia: {
      1: '08:00 - 09:30',
      2: '08:00 - 09:30',
      3: '08:00 - 09:30',
      4: '08:00 - 09:30',
      5: '08:00 - 09:30'
    },
    turno: 'Mañana',
    horario: ''
  });
  const [cursoConfigError, setCursoConfigError] = useState('');
  const [cursoConfigSuccess, setCursoConfigSuccess] = useState('');

  const DIAS_SEMANA = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' }
  ];

  // Listar dinámicamente docentes
  const docentesDisponibles = useMemo(() => {
    return usuarios.filter(u => u.rol === 'Docente');
  }, [usuarios]);

  // Ordenar alfabéticamente a los usuarios del Personal Registrado por Apellido y Nombre
  const usuariosOrdenados = useMemo(() => {
    return [...usuarios].sort((a, b) => {
      const apellidoA = (a.apellido || '').trim().toLowerCase();
      const apellidoB = (b.apellido || '').trim().toLowerCase();
      const comp = apellidoA.localeCompare(apellidoB, 'es', { sensitivity: 'base' });
      if (comp !== 0) return comp;
      const nombreA = (a.nombre || '').trim().toLowerCase();
      const nombreB = (b.nombre || '').trim().toLowerCase();
      return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
    });
  }, [usuarios]);

  // Filtrar y ordenar alfabéticamente a los alumnos Matriculados por Nombre
  const alumnosFiltradosYOrdenados = useMemo(() => {
    let result = [...alumnos];
    if (filterCurso !== 'Todos') {
      result = result.filter(a => a.cursoOrigen === filterCurso);
    }
    if (filterTurno !== 'Todos') {
      result = result.filter(a => a.turno === filterTurno);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(a => 
        (a.nombre || '').toLowerCase().includes(q) || 
        (a.dni || '').includes(q)
      );
    }
    return result.sort((a, b) => {
      const nombreA = (a.nombre || '').trim().toLowerCase();
      const nombreB = (b.nombre || '').trim().toLowerCase();
      return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
    });
  }, [alumnos, filterCurso, filterTurno, searchQuery]);

  // Cargar la configuración inicial del curso '1°1°' una vez que los datos de cursosConfig y docentes estén disponibles
  React.useEffect(() => {
    if (cursosConfig && Object.keys(cursosConfig).length > 0 && docentesDisponibles.length > 0) {
      const initialCurso = cursoConfigForm.curso;
      const existingConfig = cursosConfig[initialCurso];
      if (existingConfig) {
        const dias = existingConfig.dias || [];
        const schoolTurno = determinarTurno(initialCurso);
        const turnoCalculado = schoolTurno === 'Mañana' ? 'Tarde' : 'Mañana';
        const defaultHorario = turnoCalculado === 'Mañana' ? '08:00 - 09:30' : '13:30 - 15:00';
        const horariosPorDia = {
          1: defaultHorario,
          2: defaultHorario,
          3: defaultHorario,
          4: defaultHorario,
          5: defaultHorario
        };
        if (existingConfig.horariosPorDia) {
          Object.assign(horariosPorDia, existingConfig.horariosPorDia);
        } else if (existingConfig.horario) {
          dias.forEach(d => {
            horariosPorDia[d] = existingConfig.horario;
          });
        }
        setCursoConfigForm(prev => {
          // Si el docente ya está configurado para la sesión y coincide con el actual, omitir para no sobreescribir entradas del usuario
          if (prev.docenteDni && prev.docenteDni !== docentesDisponibles[0]?.dni && prev.curso === initialCurso) {
            return prev;
          }
          return {
            ...prev,
            docenteDni: existingConfig.docenteDni || docentesDisponibles[0]?.dni || '',
            dias: dias,
            horariosPorDia: horariosPorDia,
            turno: existingConfig.turno || turnoCalculado,
            horario: existingConfig.horario || ''
          };
        });
      } else if (!cursoConfigForm.docenteDni && docentesDisponibles.length > 0) {
        setCursoConfigForm(prev => ({
          ...prev,
          docenteDni: docentesDisponibles[0].dni
        }));
      }
    } else if (docentesDisponibles.length > 0 && !cursoConfigForm.docenteDni) {
      setCursoConfigForm(prev => ({
        ...prev,
        docenteDni: docentesDisponibles[0].dni
      }));
    }
  }, [cursosConfig, docentesDisponibles]);

  // Calcular número de clase automáticamente según fecha y temario en el panel de administración
  React.useEffect(() => {
    if (adminParteHuboClase === 'No') {
      setAdminParteClaseNum('-');
      return;
    }
    if (!adminParteSelectedCurso || !adminParteFecha) {
      setAdminParteClaseNum('');
      return;
    }

    // Filtrar otros partes del mismo curso que sí tuvieron clase
    const otherParts = partes
      .filter(p => p.curso === adminParteSelectedCurso && p.huboClase === 'Sí' && p.id !== adminParteEditingId)
      .map(p => ({ id: p.id, fecha: p.fecha }));

    // Crear ítem virtual del formulario actual
    const virtualItem = { id: adminParteEditingId || 'temp', fecha: adminParteFecha };
    const allItems = [...otherParts, virtualItem];

    // Ordenar cronológicamente por fecha y estabilizar por ID
    allItems.sort((a, b) => {
      if (a.fecha !== b.fecha) {
        return a.fecha.localeCompare(b.fecha);
      }
      return (a.id || '').localeCompare(b.id || '');
    });

    const index = allItems.findIndex(item => item.id === (adminParteEditingId || 'temp'));
    setAdminParteClaseNum(String(index + 1));
  }, [adminParteSelectedCurso, adminParteFecha, adminParteHuboClase, partes, adminParteEditingId]);

  // Validar si ya existe un parte para este curso y fecha (Admin Panel)
  React.useEffect(() => {
    if (!adminParteSelectedCurso || !adminParteFecha) return;
    
    const yaExiste = partes.some(p => 
      p.curso === adminParteSelectedCurso && 
      p.fecha === adminParteFecha && 
      p.id !== adminParteEditingId
    );
    
    if (yaExiste) {
      setAdminParteErrorMsg(`Ya existe un parte diario registrado para el curso ${adminParteSelectedCurso} en la fecha ${new Date(adminParteFecha + 'T00:00:00').toLocaleDateString('es-AR')}. No se permiten duplicados.`);
    } else {
      setAdminParteErrorMsg('');
    }
  }, [adminParteSelectedCurso, adminParteFecha, adminParteEditingId, partes]);

  // Manejar el cambio de curso de origen en matrícula de estudiantes para auto-calcular el turno
  const handleEstCursoOrigenChange = (cursoValue) => {
    const turnoCalculado = determinarTurno(cursoValue);
    setEstForm(prev => ({
      ...prev,
      cursoOrigen: cursoValue,
      turno: turnoCalculado,
      // Si no tiene asignación diferente, el cursoEF sigue al origen
      cursoEF: prev.asignarDiferenteEF ? prev.cursoEF : cursoValue
    }));
  };

  // Manejar el cambio de curso en la configuración curricular para auto-calcular el turno y el horario estimado
  const handleCursoConfigChange = (cursoValue) => {
    const schoolTurno = determinarTurno(cursoValue);
    const turnoCalculado = schoolTurno === 'Mañana' ? 'Tarde' : 'Mañana';
    const defaultHorario = turnoCalculado === 'Mañana' ? '08:00 - 09:30' : '13:30 - 15:00';
    
    const existingConfig = cursosConfig?.[cursoValue];
    if (existingConfig) {
      const dias = existingConfig.dias || [];
      const horariosPorDia = {
        1: defaultHorario,
        2: defaultHorario,
        3: defaultHorario,
        4: defaultHorario,
        5: defaultHorario
      };
      
      if (existingConfig.horariosPorDia) {
        Object.assign(horariosPorDia, existingConfig.horariosPorDia);
      } else if (existingConfig.horario) {
        dias.forEach(d => {
          horariosPorDia[d] = existingConfig.horario;
        });
      }
      
      setCursoConfigForm({
        curso: cursoValue,
        docenteDni: existingConfig.docenteDni || (docentesDisponibles[0]?.dni || ''),
        dias: dias,
        horariosPorDia: horariosPorDia,
        turno: existingConfig.turno || turnoCalculado,
        horario: existingConfig.horario || ''
      });
    } else {
      setCursoConfigForm({
        curso: cursoValue,
        docenteDni: docentesDisponibles[0]?.dni || '',
        dias: schoolTurno === 'Mañana' ? [2, 4] : [1, 3],
        horariosPorDia: {
          1: defaultHorario,
          2: defaultHorario,
          3: defaultHorario,
          4: defaultHorario,
          5: defaultHorario
        },
        turno: turnoCalculado,
        horario: ''
      });
    }
  };

  // 1. Manejo y validación de FormCargaUsuario
  const handleUsrSubmit = (e) => {
    e.preventDefault();
    setUsrError('');
    setUsrSuccess('');

    const { apellido, nombre, dni, fechaNac, correo, rol, situacionRevista } = usrForm;

    if (!apellido.trim() || !nombre.trim() || !dni.trim() || !fechaNac || !correo.trim() || !rol) {
      setUsrError("Todos los campos son obligatorios.");
      return;
    }

    if (!/^\d+$/.test(dni)) {
      setUsrError("El DNI debe contener únicamente números.");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@abc\.gob\.ar$/;
    if (!emailRegex.test(correo)) {
      setUsrError("El correo electrónico debe ser institucional y terminar en @abc.gob.ar");
      return;
    }

    if (!editingUsrDni && usuarios.some(u => u.dni === dni)) {
      setUsrError("Ya existe un usuario registrado con este DNI.");
      return;
    }

    const datosUsuario = {
      apellido: apellido.trim(),
      nombre: nombre.trim(),
      dni: dni.trim(),
      fechaNac,
      correo: correo.trim(),
      rol,
      situacionRevista: rol === 'Docente' ? situacionRevista : '',
      cursosAsignados: (rol === 'Docente' || rol === 'Preceptor') ? usrForm.cursosAsignados : []
    };

    if (editingUsrDni) {
      if (editingUsrDni !== dni) {
        if (usuarios.some(u => u.dni === dni)) {
          setUsrError("El nuevo DNI ingresado ya está asignado a otro usuario.");
          return;
        }
        eliminarUsuario(editingUsrDni);
        registrarUsuario(datosUsuario);
      } else {
        actualizarUsuario(editingUsrDni, datosUsuario);
      }
      setUsrSuccess(`¡Usuario "${nombre} ${apellido}" actualizado con éxito!`);
      setEditingUsrDni(null);
    } else {
      registrarUsuario(datosUsuario);
      setUsrSuccess(`¡Usuario "${nombre} ${apellido}" cargado con éxito!`);
    }
    
    setUsrForm({
      apellido: '',
      nombre: '',
      dni: '',
      fechaNac: '',
      correo: '',
      rol: 'Docente',
      situacionRevista: 'Titular',
      cursosAsignados: []
    });
  };

  // 2. Manejo y validación de FormCargaEstudiante
  const handleEstSubmit = (e) => {
    e.preventDefault();
    setEstError('');
    setEstSuccess('');

    const { nombre, dni, cursoOrigen, turno, asignarDiferenteEF, cursoEF, noCursaEF, recursaCursos } = estForm;

    if (!nombre.trim() || !dni.trim() || !cursoOrigen || !turno) {
      setEstError("Todos los campos son obligatorios.");
      return;
    }

    if (!/^\d+$/.test(dni)) {
      setEstError("El DNI debe contener únicamente números.");
      return;
    }

    if (!editingEstDni && alumnos.some(a => a.dni === dni)) {
      setEstError("Ya existe un estudiante matriculado con este DNI.");
      return;
    }

    if (!noCursaEF && recursaCursos.includes(cursoEF)) {
      setEstError("No podés marcar como recursada la misma división donde ya cursa EF.");
      return;
    }

    const cursoEFDefinitivo = noCursaEF ? 'No cursa' : (asignarDiferenteEF ? cursoEF : cursoOrigen);

    const datosEstudiante = {
      nombre: nombre.trim(),
      dni: dni.trim(),
      cursoOrigen,
      turno,
      cursoEF: cursoEFDefinitivo,
      noCursaEF: !!noCursaEF,
      recursaCursos: noCursaEF ? [] : recursaCursos
    };

    if (editingEstDni) {
      if (editingEstDni !== dni) {
        if (alumnos.some(a => a.dni === dni)) {
          setEstError("El nuevo DNI ingresado ya está asignado a otro estudiante.");
          return;
        }
        eliminarEstudiante(editingEstDni);
        agregarEstudiante(datosEstudiante);
      } else {
        actualizarEstudiante(editingEstDni, datosEstudiante);
      }
      setEstSuccess(`¡Estudiante "${nombre}" actualizado con éxito!`);
      setEditingEstDni(null);
    } else {
      agregarEstudiante(datosEstudiante);
      setEstSuccess(`¡Estudiante "${nombre}" matriculado con éxito!`);
    }

    setEstForm({
      nombre: '',
      dni: '',
      cursoOrigen: '1°1°',
      turno: 'Mañana',
      asignarDiferenteEF: false,
      cursoEF: '1°1°',
      noCursaEF: false,
      recursaCursos: []
    });
  };

  // ─────────── Handlers para el formulario de Creación de Parte (Admin) ───────────

  const handleFeriadoSubmit = async (e) => {
    e.preventDefault();
    if (!feriadoFecha || !feriadoDesc.trim()) return;
    await agregarFeriado({ fecha: feriadoFecha, descripcion: feriadoDesc.trim() });
    setFeriadoSuccess('Feriado agregado con éxito.');
    setFeriadoFecha('');
    setFeriadoDesc('');
    setTimeout(() => setFeriadoSuccess(''), 3000);
  };

  const handleRecesoSubmit = async (e) => {
    e.preventDefault();
    if (!recesoInicio || !recesoFin) return;

    try {
      await agregarRecesoInvierno({ fechaInicio: recesoInicio, fechaFin: recesoFin });
      setFeriadoSuccess('Receso de invierno agregado. Sus fechas no se considerarán para asistencia.');
      setRecesoInicio('');
      setRecesoFin('');
      setTimeout(() => setFeriadoSuccess(''), 3000);
    } catch (error) {
      setFeriadoSuccess(error.message);
    }
  };

  const handleCloseAdminParteSuccessModal = () => {
    setAdminParteShowSuccessModal(false);
    setAdminParteSelectedCurso(null);
    setAdminParteEditingId(null);
    setAdminParteSuccessMsg('');
    setAdminParteErrorMsg('');
  };

  const handleAdminParteSelectCurso = (curso) => {
    setAdminParteSelectedCurso(curso);
    setAdminParteEditingId(null);
    setAdminParteSuccessMsg('');
    setAdminParteErrorMsg('');
    setAdminParteHuboClase('Sí');
    setAdminParteMotivoSuspension('Causas climáticas');
    setAdminParteOtroMotivo('');
    setAdminParteClaseNum('');
    setAdminParteUnidad('I');
    setAdminParteCaracter('Práctica');
    setAdminParteDinamica('Grupal');
    setAdminParteContenido('');
    setAdminParteActividades('');
    setAdminParteObservaciones('');
    setAdminParteFecha(new Date().toISOString().split('T')[0]);

    const config = cursosConfig[curso];
    // Pre-fill docente from cursosConfig
    setAdminParteDocenteDni(config?.docenteDni || '');
    // Pre-fill horario from config
    const turnoEscolar = curso.endsWith('1°') ? 'Mañana' : 'Tarde';
    const turnoEF = turnoEscolar === 'Mañana' ? 'Tarde' : 'Mañana';
    const defaultHorario = config?.horario || (turnoEF === 'Mañana' ? '08:00 - 09:30' : '13:30 - 15:00');
    setAdminParteHorario(defaultHorario);

    // Init asistencia (solo alumnos activos en este curso EF)
    const initialAsistencia = {};
    alumnos.filter(al => (al.cursoEF === curso || (al.recursaCursos || []).includes(curso)) && !al.noCursaEF).forEach(al => {
      initialAsistencia[al.dni] = 'Presente';
    });
    setAdminParteAsistencia(initialAsistencia);
  };

  useEffect(() => {
    if (parteToEditGlobal && activeTab !== 'partes_crear') {
      navigateToAdminTab('partes_crear');
      handleAdminParteEditClick(parteToEditGlobal);
      setParteToEditGlobal(null);
    } else if (parteToEditGlobal && activeTab === 'partes_crear') {
      handleAdminParteEditClick(parteToEditGlobal);
      setParteToEditGlobal(null);
    }
  }, [parteToEditGlobal, activeTab, setParteToEditGlobal, onNavigate]);

  const handleAdminParteEditClick = (parte) => {
    setAdminParteSelectedCurso(parte.curso);
    setAdminParteEditingId(parte.id);
    setAdminParteFecha(parte.fecha);
    setAdminParteHorario(parte.horario || '08:00 - 09:30');
    setAdminParteHuboClase(parte.huboClase || 'Sí');
    setAdminParteMotivoSuspension(parte.motivoSuspension || 'Causas climáticas');
    setAdminParteOtroMotivo('');
    setAdminParteClaseNum(parte.claseNum || '');
    setAdminParteUnidad(parte.unidad || '');
    setAdminParteCaracter(parte.caracter || 'Práctica');
    setAdminParteDinamica(parte.dinamica || 'Grupal');
    setAdminParteContenido(parte.contenido || '');
    setAdminParteActividades(parte.actividades || '');
    setAdminParteObservaciones(parte.observaciones || '');
    setAdminParteDocenteDni(parte.firmaDigital?.correo ? 
      (usuarios.find(u => u.correo === parte.firmaDigital.correo)?.dni || '') : 
      (cursosConfig[parte.curso]?.docenteDni || ''));
    setAdminParteAsistencia(parte.asistencia || {});
    setAdminParteSuccessMsg('');
    setAdminParteErrorMsg('');
  };

  const handleAdminParteDeleteClick = async (parteId) => {
    if (window.confirm('¿Está seguro de que desea eliminar permanentemente este parte diario? Esta acción no se puede deshacer.')) {
      await eliminarParteEF(parteId);
    }
  };

  const handleAdminParteSubmit = (e) => {
    e.preventDefault();
    setAdminParteSuccessMsg('');
    setAdminParteErrorMsg('');

    // Validar duplicado antes de guardar
    const yaExiste = partes.some(p => 
      p.curso === adminParteSelectedCurso && 
      p.fecha === adminParteFecha && 
      p.id !== adminParteEditingId
    );
    if (yaExiste) {
      setAdminParteErrorMsg(`Ya existe un parte diario registrado para el curso ${adminParteSelectedCurso} en la fecha ${new Date(adminParteFecha + 'T00:00:00').toLocaleDateString('es-AR')}. No se permiten duplicados.`);
      return;
    }

    // Resolver docente
    const docenteObj = usuarios.find(u => u.dni === adminParteDocenteDni && u.rol === 'Docente');
    if (!docenteObj) {
      setAdminParteErrorMsg('No se encontró ningún docente con ese DNI. Verifique el campo Docente.');
      return;
    }

    let contenidoFinal = adminParteContenido.trim();
    let actividadesFinal = '';
    let observacionesFinal = adminParteObservaciones.trim() || 'Sin observaciones.';
    let asistenciaFinal = { ...adminParteAsistencia };
    let claseNumFinal = adminParteClaseNum.trim();
    let unidadFinal = adminParteUnidad.trim();
    let caracterFinal = adminParteCaracter;
    let dinamicaFinal = adminParteDinamica.trim();

    if (adminParteHuboClase === 'No') {
      const motivoCompleto = adminParteMotivoSuspension === 'Otros'
        ? (adminParteOtroMotivo.trim() || 'Motivo no especificado')
        : adminParteMotivoSuspension;
      if (adminParteMotivoSuspension === 'Otros' && !adminParteOtroMotivo.trim()) {
        setAdminParteErrorMsg('Por favor, especifique el motivo de la suspensión.');
        return;
      }
      contenidoFinal = `[CLASE NO DICTADA] - Motivo: ${motivoCompleto}`;
      observacionesFinal = `Clase suspendida. Motivo: ${motivoCompleto}`;
      claseNumFinal = '-';
      unidadFinal = '-';
      caracterFinal = '-';
      dinamicaFinal = '-';
      actividadesFinal = '-';
      // Marcar todos como "-"
      alumnos.filter(al => (al.cursoEF === adminParteSelectedCurso || (al.recursaCursos || []).includes(adminParteSelectedCurso)) && !al.noCursaEF).forEach(al => {
        asistenciaFinal[al.dni] = '-';
      });
    } else {
      if (!claseNumFinal) { setAdminParteErrorMsg('El número de Clase es obligatorio.'); return; }
      if (!unidadFinal) { setAdminParteErrorMsg('La Unidad es obligatoria.'); return; }
      if (!contenidoFinal) { setAdminParteErrorMsg('El Tema Abordado es obligatorio.'); return; }
      if (!adminParteActividades.trim()) { setAdminParteErrorMsg('Las Actividades que se desarrollan son obligatorias.'); return; }
      actividadesFinal = adminParteActividades.trim();
    }

    const dateObj = new Date(adminParteFecha + 'T00:00:00');
    const diaString = String(dateObj.getDate()).padStart(2, '0');
    const mesesNombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const mesString = mesesNombres[dateObj.getMonth()];
    const turnoEscolar = adminParteSelectedCurso.endsWith('1°') ? 'Mañana' : 'Tarde';
    const turnoEF = turnoEscolar === 'Mañana' ? 'Tarde' : 'Mañana';

    const firmaDigital = {
      apellido: docenteObj.apellido,
      nombre: docenteObj.nombre,
      cargo: 'Prof. de Educación Física',
      correo: docenteObj.correo,
      fechaFirma: new Date().toISOString()
    };

    const nuevoParte = {
      fecha: adminParteFecha,
      dia: diaString,
      mes: mesString,
      claseNum: claseNumFinal,
      unidad: unidadFinal,
      caracter: caracterFinal,
      dinamica: dinamicaFinal,
      observaciones: observacionesFinal,
      curso: adminParteSelectedCurso,
      turno: turnoEF,
      horario: adminParteHorario,
      docenteNombre: `${docenteObj.nombre} ${docenteObj.apellido}`,
      huboClase: adminParteHuboClase,
      motivoSuspension: adminParteHuboClase === 'No'
        ? (adminParteMotivoSuspension === 'Otros' ? adminParteOtroMotivo.trim() : adminParteMotivoSuspension)
        : '',
      asistencia: asistenciaFinal,
      contenido: contenidoFinal,
      actividades: actividadesFinal,
      firmaDigital,
      firmaAutoridad: adminParteEditingId ? (partes.find(p => p.id === adminParteEditingId)?.firmaAutoridad || null) : null
    };

    if (adminParteEditingId) {
      actualizarParteEF(adminParteEditingId, nuevoParte);
      setAdminParteSuccessModalTitle('¡Parte Actualizado!');
      setAdminParteSuccessModalDescription('El parte diario de asistencia ha sido modificado y guardado con éxito.');
      setAdminParteShowSuccessModal(true);
    } else {
      guardarParteEF(nuevoParte);
      setAdminParteSuccessModalTitle('Parte registrado con éxito');
      setAdminParteSuccessModalDescription(
        adminParteHuboClase === 'Sí'
          ? `El parte de asistencia para el curso ${adminParteSelectedCurso} correspondiente a la fecha ${new Date(adminParteFecha + 'T00:00:00').toLocaleDateString('es-AR')} ha sido registrado e inyectado correctamente en el Libro de Temas.`
          : `El acta de clase suspendida para el curso ${adminParteSelectedCurso} correspondiente a la fecha ${new Date(adminParteFecha + 'T00:00:00').toLocaleDateString('es-AR')} ha sido registrada correctamente.`
      );
      setAdminParteShowSuccessModal(true);
    }
  };

  const descargarPartesCSVTemplate = () => {
    const csvContent = "\uFEFF" + "fecha,curso,huboClase,claseNum,unidad,caracter,dinamica,contenido,actividades,observaciones,motivoSuspension,docenteDni,asistencia\n" +
      "2026-05-20,1°1°,Sí,3,I,Práctica,Grupal,Iniciación al Voley: saques bajos y recepción,Ejercicios de saque de arriba y saques de abajo con recepción en parejas,Sin incidentes,,333,10001:Presente;10002:Presente;10003:Ausente;10004:Presente\n" +
      "2026-05-22,1°1°,No,,,,,,,Clase suspendida por tormenta,Causas climáticas,333,\n" +
      "2026-05-26,3°2°,Sí,1,I,Práctica,Parejas,Handball: pases y lanzamientos,Ejercicios de pases sobre hombro a la carrera y lanzamientos suspendidos,Buen desempeño,,333,30002:Presente;30003:Ausente\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "ejemplo_carga_partes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePartesCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPartesUploadError('');
    setPartesUploadSuccess('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      
      const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length < 2) {
        setPartesUploadError("El archivo CSV está vacío o no tiene registros.");
        return;
      }

      const firstLine = lines[0];
      const delimiter = firstLine.includes(';') ? ';' : ',';
      
      const parseCSVRow = (lineStr, delim) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < lineStr.length; i++) {
          const char = lineStr[i];
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if (char === delim && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result.map(cell => cell.replace(/^["']|["']$/g, '').trim());
      };

      const headers = parseCSVRow(firstLine, delimiter).map(h => h.toLowerCase().replace(/\s+/g, ''));
      
      const idxFecha = headers.indexOf('fecha');
      const idxCurso = headers.indexOf('curso');
      const idxHuboClase = headers.indexOf('huboclase');
      const idxClaseNum = headers.indexOf('clasenum');
      const idxUnidad = headers.indexOf('unidad');
      const idxCaracter = headers.indexOf('caracter');
      const idxDinamica = headers.indexOf('dinamica');
      const idxContenido = headers.indexOf('contenido');
      const idxActividades = headers.indexOf('actividades');
      const idxObservaciones = headers.indexOf('observaciones');
      const idxMotivoSuspension = headers.indexOf('motivosuspension');
      const idxDocenteDni = headers.indexOf('docentedni');
      const idxAsistencia = headers.indexOf('asistencia');

      if (idxFecha === -1 || idxCurso === -1 || idxHuboClase === -1 || idxDocenteDni === -1) {
        setPartesUploadError("El CSV debe contener al menos las columnas obligatorias: fecha, curso, huboClase, docenteDni");
        return;
      }

      const totalRows = lines.length - 1;
      setShowPartesUploadModal(true);

      const initialLogs = [{ text: 'Iniciando carga masiva de partes diarios...', type: 'info' }];
      setPartesUploadProgress({
        total: totalRows,
        current: 0,
        processingName: '',
        logs: initialLogs,
        completed: false,
        successCount: 0,
        errorCount: 0,
        warningCount: 0
      });

      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      const sleepMs = totalRows > 150 ? 10 : 80;

      let successCount = 0;
      let errorCount = 0;
      let warningCount = 0;
      const currentLogs = [...initialLogs];

      for (let i = 1; i < lines.length; i++) {
        const lineNum = i + 1;
        const row = parseCSVRow(lines[i], delimiter);
        if (row.length === 1 && row[0] === '') continue;

        const fecha = row[idxFecha];
        let curso = row[idxCurso]?.replace(/\s+/g, '').replace(/º/g, '°');
        let huboClase = row[idxHuboClase];
        const docenteDni = row[idxDocenteDni];

        // Opcionales
        const claseNumVal = idxClaseNum !== -1 ? row[idxClaseNum] : '';
        const unidadVal = idxUnidad !== -1 ? row[idxUnidad] : '';
        const caracterVal = idxCaracter !== -1 ? row[idxCaracter] : '';
        const dinamicaVal = idxDinamica !== -1 ? row[idxDinamica] : '';
        const contenidoVal = idxContenido !== -1 ? row[idxContenido] : '';
        const actividadesVal = idxActividades !== -1 ? row[idxActividades] : '';
        const observacionesVal = idxObservaciones !== -1 ? row[idxObservaciones] : '';
        const motivoSuspensionVal = idxMotivoSuspension !== -1 ? row[idxMotivoSuspension] : '';
        const asistenciaVal = idxAsistencia !== -1 ? row[idxAsistencia] : '';

        // Actualizar progreso
        setPartesUploadProgress(prev => ({
          ...prev,
          current: i - 1,
          processingName: `Fecha: ${fecha} - Curso: ${curso}`,
          logs: [...currentLogs]
        }));

        setTimeout(() => {
          const terminal = document.getElementById('partes-upload-terminal');
          if (terminal) terminal.scrollTop = terminal.scrollHeight;
        }, 10);

        await sleep(sleepMs);

        // Validaciones básicas
        if (!fecha || !curso || !huboClase || !docenteDni) {
          errorCount++;
          currentLogs.push({ text: `❌ Fila ${lineNum}: Faltan campos obligatorios (fecha, curso, huboClase o docenteDni).`, type: 'error' });
          continue;
        }

        // Validar formato fecha YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
          errorCount++;
          currentLogs.push({ text: `❌ Fila ${lineNum}: Formato de fecha inválido "${fecha}". Debe ser YYYY-MM-DD.`, type: 'error' });
          continue;
        }

        // Validar curso oficial
        if (!CURSOS.includes(curso)) {
          errorCount++;
          currentLogs.push({ text: `❌ Fila ${lineNum}: El curso "${curso}" no es un curso oficial válido de la institución.`, type: 'error' });
          continue;
        }

        // Validar huboClase
        const huboClaseNorm = huboClase.trim().toLowerCase();
        if (huboClaseNorm !== 'sí' && huboClaseNorm !== 'si' && huboClaseNorm !== 'no') {
          errorCount++;
          currentLogs.push({ text: `❌ Fila ${lineNum}: El campo huboClase "${huboClase}" debe ser "Sí" o "No".`, type: 'error' });
          continue;
        }
        const huboClaseFinal = (huboClaseNorm === 'sí' || huboClaseNorm === 'si') ? 'Sí' : 'No';

        // Buscar Docente en usuarios
        const docenteObj = usuarios.find(u => u.dni === docenteDni && u.rol === 'Docente');
        if (!docenteObj) {
          errorCount++;
          currentLogs.push({ text: `❌ Fila ${lineNum}: No se encontró ningún usuario Docente con DNI "${docenteDni}".`, type: 'error' });
          continue;
        }

        // Calcular dia, mes y turno
        const dateObj = new Date(fecha + 'T00:00:00');
        const diaString = String(dateObj.getDate()).padStart(2, '0');
        const mesesNombres = [
          "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];
        const mesString = mesesNombres[dateObj.getMonth()];
        const configCurso = cursosConfig[curso];
        const turnoCalculado = configCurso?.turno || ((curso.endsWith('2°') || curso.endsWith('3°')) ? "Tarde" : "Mañana");
        const horarioCalculado = configCurso?.horario || (curso.endsWith('1°') ? '08:00 - 09:30' : '13:30 - 15:00');

        // Parsear asistencia (formato: "DNI:Estado;DNI:Estado")
        const asistenciaMap = {};
        if (huboClaseFinal === 'Sí' && asistenciaVal) {
          const tokens = asistenciaVal.split(';');
          tokens.forEach(tok => {
            const partsOfTok = tok.split(':');
            if (partsOfTok.length === 2) {
              const sDni = partsOfTok[0].trim();
              const sState = partsOfTok[1].trim();
              if (sState === 'Presente' || sState === 'Ausente') {
                asistenciaMap[sDni] = sState;
              }
            }
          });
        }

        // Armar el nuevo parte
        const firmaDigital = {
          apellido: docenteObj.apellido,
          nombre: docenteObj.nombre,
          cargo: "Prof. de Educación Física",
          correo: docenteObj.correo,
          fechaFirma: new Date().toISOString()
        };

        const nuevoParte = {
          fecha,
          dia: diaString,
          mes: mesString,
          claseNum: huboClaseFinal === 'Sí' ? (claseNumVal || '1') : '',
          unidad: huboClaseFinal === 'Sí' ? (unidadVal || 'I') : '',
          caracter: huboClaseFinal === 'Sí' ? (caracterVal || 'Práctica') : '',
          dinamica: huboClaseFinal === 'Sí' ? (dinamicaVal || 'Grupal') : '',
          observaciones: observacionesVal || '',
          curso,
          turno: turnoCalculado,
          horario: horarioCalculado,
          docenteNombre: `${docenteObj.nombre} ${docenteObj.apellido}`,
          huboClase: huboClaseFinal,
          motivoSuspension: huboClaseFinal === 'No' ? (motivoSuspensionVal || 'Causas climáticas') : '',
          asistencia: asistenciaMap,
          contenido: huboClaseFinal === 'Sí' ? (contenidoVal || 'Contenido de clase') : '',
          actividades: huboClaseFinal === 'Sí' ? (actividadesVal || 'Actividades de clase') : '-',
          firmaDigital,
          firmaAutoridad: null
        };

        // Comprobar si ya existe un parte para ese curso y fecha
        const parteExistente = partes.find(p => p.fecha === fecha && p.curso === curso);
        if (parteExistente) {
          try {
            await actualizarParteEF(parteExistente.id, nuevoParte);
            successCount++;
            currentLogs.push({ text: `✔ Fila ${lineNum}: Parte de ${curso} para la fecha ${fecha} actualizado correctamente.`, type: 'success' });
          } catch (error) {
            errorCount++;
            currentLogs.push({ text: `❌ Fila ${lineNum}: Error al actualizar el parte existente de ${curso} (${fecha}).`, type: 'error' });
          }
        } else {
          try {
            await guardarParteEF(nuevoParte);
            successCount++;
            currentLogs.push({ text: `✔ Fila ${lineNum}: Parte de ${curso} para la fecha ${fecha} creado correctamente.`, type: 'success' });
          } catch (error) {
            errorCount++;
            currentLogs.push({ text: `❌ Fila ${lineNum}: Error al registrar el nuevo parte de ${curso} (${fecha}).`, type: 'error' });
          }
        }
      }

      currentLogs.push({ text: 'Carga masiva de partes finalizada.', type: 'info' });
      setPartesUploadProgress(prev => ({
        ...prev,
        current: totalRows,
        processingName: '',
        logs: currentLogs,
        completed: true,
        successCount,
        errorCount,
        warningCount
      }));

      setTimeout(() => {
        const terminal = document.getElementById('partes-upload-terminal');
        if (terminal) terminal.scrollTop = terminal.scrollHeight;
      }, 50);

      if (e.target) e.target.value = '';
    };

    reader.readAsText(file);
  };

  const descargarCSVTemplate = () => {
    const csvContent = "\uFEFF" + "nombre,dni,cursoOrigen,cursoEF,recursaCursos\n" +
      "Perez Juan,12345678,1°1°,1°1°,\n" +
      "Gomez Maria,87654321,1°2°,1°2°,\n" +
      "Rodriguez Luis,45678901,2°1°,1°1°,1°2°\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "ejemplo_matricula_estudiantes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const descargarEstudiantesExcel = () => {
    const headers = ["Nombre", "DNI", "Curso Origen", "Turno", "Curso EF", "Estado EF", "Recursa Cursos"];
    const rows = alumnosFiltradosYOrdenados.map(a => [
      a.nombre,
      a.dni,
      a.cursoOrigen,
      a.turno,
      a.noCursaEF ? 'No cursa' : a.cursoEF,
      a.noCursaEF ? 'No cursa EF' : (a.cursoEF !== a.cursoOrigen ? 'Alumno Externo' : 'Regular'),
      (a.recursaCursos || []).join(', ')
    ]);
    const csvContent = "\uFEFF" + 
      [headers.join(";"), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";"))].join("\n");
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `estudiantes_matriculados_${filterCurso}_${filterTurno}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setEstError('');
    setEstSuccess('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      
      const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length < 2) {
        setEstError("El archivo CSV está vacío o no tiene registros.");
        return;
      }

      const firstLine = lines[0];
      const delimiter = firstLine.includes(';') ? ';' : ',';
      
      // Función auxiliar para parsear una fila de CSV respetando las comillas
      const parseCSVRow = (lineStr, delim) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < lineStr.length; i++) {
          const char = lineStr[i];
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if (char === delim && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result.map(cell => cell.replace(/^["']|["']$/g, '').trim());
      };

      const headers = parseCSVRow(firstLine, delimiter).map(h => h.toLowerCase());
      
      const idxNombre = headers.indexOf('nombre');
      const idxDni = headers.indexOf('dni');
      const idxCursoOrigen = headers.indexOf('cursoorigen');
      const idxCursoEF = headers.indexOf('cursoef');
      const idxRecursa = headers.indexOf('recursacursos');

      if (idxNombre === -1 || idxDni === -1 || idxCursoOrigen === -1) {
        setEstError("El CSV debe contener las columnas: nombre, dni, cursoOrigen");
        return;
      }

      const totalRows = lines.length - 1;
      setShowUploadModal(true);

      const initialLogs = [{ text: 'Iniciando carga de estudiantes...', type: 'info' }];
      setUploadProgress({
        total: totalRows,
        current: 0,
        processingName: '',
        logs: initialLogs,
        completed: false,
        successCount: 0,
        errorCount: 0,
        warningCount: 0
      });

      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      const sleepMs = totalRows > 150 ? 10 : 80;

      let successCount = 0;
      let errorCount = 0;
      let warningCount = 0;
      const currentLogs = [...initialLogs];
      const localNuevosDnis = new Set();
      const currentAlumnos = [...alumnos];

      for (let i = 1; i < lines.length; i++) {
        const lineNum = i + 1;
        const row = parseCSVRow(lines[i], delimiter);
        if (row.length === 1 && row[0] === '') continue;

        let nombre = row[idxNombre];
        const dni = row[idxDni];
        let cursoOrigen = row[idxCursoOrigen];
        let cursoEF = idxCursoEF !== -1 && row[idxCursoEF] ? row[idxCursoEF] : '';

        // Actualizar el progreso en tiempo real
        setUploadProgress(prev => ({
          ...prev,
          current: i - 1,
          processingName: nombre || `DNI: ${dni}` || `Fila ${lineNum}`,
          logs: [...currentLogs]
        }));

        // Scroll al fondo del terminal
        setTimeout(() => {
          const terminal = document.getElementById('upload-terminal');
          if (terminal) terminal.scrollTop = terminal.scrollHeight;
        }, 10);

        await sleep(sleepMs);

        if (!nombre || !dni || !cursoOrigen) {
          errorCount++;
          currentLogs.push({ text: `❌ Fila ${lineNum}: Faltan campos obligatorios (nombre, dni o cursoOrigen).`, type: 'error' });
          continue;
        }

        // Normalizar nombre: si tiene coma (ej: "Pérez, Juan"), la convertimos a espacio simple ("Pérez Juan")
        nombre = nombre.replace(/,\s*/g, ' ');

        // Normalizar curso de origen y EF (eliminar espacios y corregir ordinal º a °)
        cursoOrigen = cursoOrigen.replace(/\s+/g, '').replace(/º/g, '°');
        let noCursaEF = false;
        if (cursoEF) {
          const normEF = cursoEF.replace(/\s+/g, '').toLowerCase();
          if (normEF === 'nocursa' || normEF === 'no') {
            noCursaEF = true;
            cursoEF = 'No cursa';
          } else {
            cursoEF = cursoEF.replace(/\s+/g, '').replace(/º/g, '°');
          }
        } else {
          cursoEF = cursoOrigen;
        }

        if (!/^\d+$/.test(dni)) {
          errorCount++;
          currentLogs.push({ text: `❌ Fila ${lineNum}: El DNI "${dni}" de "${nombre}" debe contener únicamente números.`, type: 'error' });
          continue;
        }

        if (localNuevosDnis.has(dni)) {
          warningCount++;
          currentLogs.push({ text: `⚠ Fila ${lineNum}: El DNI "${dni}" (${nombre}) está duplicado en el mismo archivo.`, type: 'warning' });
          continue;
        }

        if (!CURSOS.includes(cursoOrigen)) {
          errorCount++;
          currentLogs.push({ text: `❌ Fila ${lineNum}: El curso de origen "${cursoOrigen}" para "${nombre}" no es un curso oficial válido.`, type: 'error' });
          continue;
        }

        if (cursoEF && !noCursaEF && !CURSOS.includes(cursoEF)) {
          errorCount++;
          currentLogs.push({ text: `❌ Fila ${lineNum}: El curso de Educación Física "${cursoEF}" para "${nombre}" no es un curso oficial válido.`, type: 'error' });
          continue;
        }

        const turnoCalculado = determinarTurno(cursoOrigen);
        const recursaCursos = (idxRecursa !== -1 && row[idxRecursa])
          ? row[idxRecursa]
              .split(/[|;]/)
              .map(c => c.trim().replace(/\s+/g, '').replace(/º/g, '°'))
              .filter(c => c && CURSOS.includes(c) && c !== (cursoEF || cursoOrigen))
          : [];
        const studentObj = {
          nombre,
          dni,
          cursoOrigen,
          turno: turnoCalculado,
          cursoEF: cursoEF || cursoOrigen,
          noCursaEF: noCursaEF,
          recursaCursos
        };

        if (currentAlumnos.some(a => a.dni === dni)) {
          try {
            await actualizarEstudiante(dni, studentObj);
            const idx = currentAlumnos.findIndex(a => a.dni === dni);
            if (idx !== -1) currentAlumnos[idx] = studentObj;
            successCount++;
            currentLogs.push({ text: `✔ Fila ${lineNum}: ${nombre} actualizado correctamente.`, type: 'success' });
          } catch (error) {
            errorCount++;
            currentLogs.push({ text: `❌ Fila ${lineNum}: Error al actualizar a ${nombre}.`, type: 'error' });
          }
          continue;
        }

        try {
          await agregarEstudiante(studentObj);
          localNuevosDnis.add(dni);
          currentAlumnos.push(studentObj);
          successCount++;
          currentLogs.push({ text: `✔ Fila ${lineNum}: ${nombre} matriculado correctamente.`, type: 'success' });
        } catch (error) {
          errorCount++;
          currentLogs.push({ text: `❌ Fila ${lineNum}: Error al guardar a ${nombre} en el servidor.`, type: 'error' });
        }
      }

      currentLogs.push({ text: 'Carga masiva finalizada.', type: 'info' });
      setUploadProgress({
        total: totalRows,
        current: totalRows,
        processingName: '',
        logs: currentLogs,
        completed: true,
        successCount,
        errorCount,
        warningCount
      });

      // Scroll final al fondo del terminal
      setTimeout(() => {
        const terminal = document.getElementById('upload-terminal');
        if (terminal) terminal.scrollTop = terminal.scrollHeight;
      }, 50);

      if (e.target) e.target.value = '';
    };

    reader.readAsText(file);
  };

  // 3. Manejo de Carga de Configuración de Cursos EF
  const handleCursoConfigSubmit = (e) => {
    e.preventDefault();
    setCursoConfigError('');
    setCursoConfigSuccess('');

    const { curso, docenteDni, dias, horariosPorDia, turno } = cursoConfigForm;

    if (!curso || !docenteDni || !turno) {
      setCursoConfigError("Todos los campos son obligatorios.");
      return;
    }

    if (dias.length === 0) {
      setCursoConfigError("Debe seleccionar al menos un día de cursada semanal.");
      return;
    }

    // Validar que los días seleccionados tengan horario asignado
    const diasFaltantesDeHorario = [];
    dias.forEach(d => {
      if (!horariosPorDia[d] || !horariosPorDia[d].trim()) {
        const label = DIAS_SEMANA.find(ds => ds.value === d)?.label || d;
        diasFaltantesDeHorario.push(label);
      }
    });

    if (diasFaltantesDeHorario.length > 0) {
      setCursoConfigError(`Debe ingresar un horario para los siguientes días: ${diasFaltantesDeHorario.join(', ')}.`);
      return;
    }

    const docente = docentesDisponibles.find(d => d.dni === docenteDni);
    if (!docente) {
      setCursoConfigError("El docente seleccionado no es válido o no está registrado.");
      return;
    }

    // Ordenar los días seleccionados
    const diasOrdenados = [...dias].sort((a, b) => a - b);

    // Formatear el horario consolidado: e.g. "Lunes 13:00 a 15:00 • Jueves 16:00 a 17:00"
    const partesHorario = diasOrdenados.map(d => {
      const diaLabel = DIAS_SEMANA.find(ds => ds.value === d)?.label || '';
      const hVal = horariosPorDia[d].trim();
      return `${diaLabel} ${hVal}`;
    });
    const horarioConsolidado = partesHorario.join(' • ');

    // Filtrar horariosPorDia para guardar solo los seleccionados
    const horariosPorDiaFiltrado = {};
    diasOrdenados.forEach(d => {
      horariosPorDiaFiltrado[d] = horariosPorDia[d].trim();
    });

    const nuevaConfig = {
      docenteDni,
      docenteNombre: `${docente.nombre} ${docente.apellido}`,
      dias: diasOrdenados,
      horariosPorDia: horariosPorDiaFiltrado,
      horario: horarioConsolidado,
      turno
    };

    actualizarCursoConfig(curso, nuevaConfig);
    setCursoConfigSuccess(`¡Curso ${curso} configurado con éxito!`);
  };

  const handleDiaCheckboxChange = (diaValue, isChecked) => {
    setCursoConfigForm(prev => {
      let nuevosDias = [...prev.dias];
      const horariosPorDia = { ...prev.horariosPorDia };
      
      if (isChecked) {
        if (!nuevosDias.includes(diaValue)) nuevosDias.push(diaValue);
        // Si al seleccionar el día está vacío, auto-completar con el horario estándar según el turno actual
        if (!horariosPorDia[diaValue] || !horariosPorDia[diaValue].trim()) {
          horariosPorDia[diaValue] = prev.turno === 'Mañana' ? '08:00 - 09:30' : '13:30 - 15:00';
        }
      } else {
        nuevosDias = nuevosDias.filter(d => d !== diaValue);
      }
      return { ...prev, dias: nuevosDias, horariosPorDia };
    });
  };

  const handleHorarioPorDiaChange = (diaValue, newHorario) => {
    setCursoConfigForm(prev => ({
      ...prev,
      horariosPorDia: {
        ...prev.horariosPorDia,
        [diaValue]: newHorario
      }
    }));
  };

  const tabs = useMemo(() => {
    const allTabs = [
      { id: 'usuarios_carga', label: 'Carga de Usuarios', icon: UserPlus, color: 'text-primary-500' },
      { id: 'usuarios_lista', label: 'Personal Registrado', icon: Users, color: 'text-primary-500' },
      { id: 'estudiantes_carga', label: 'Matrícula Estudiantes', icon: GraduationCap, color: 'text-accent-500' },
      { id: 'estudiantes_lista', label: 'Estudiantes Matriculados', icon: BookOpen, color: 'text-accent-500' },
      { id: 'cursos_carga', label: 'Asignación Curricular EF', icon: CalendarRange, color: 'text-yellow-600' },
      { id: 'cursos_lista', label: 'Cursos de Educación Física', icon: CalendarRange, color: 'text-yellow-600' },
      { id: 'partes_carga_masiva', label: 'Carga Masiva de Partes', icon: Upload, color: 'text-red-500' },
      { id: 'partes_crear', label: 'Crear Parte', icon: UserPlus, color: 'text-indigo-500' },
      { id: 'feriados_carga', label: 'Carga de Feriados', icon: CalendarRange, color: 'text-green-500' }
    ];

    if (user?.rol === 'Preceptor') {
      return allTabs.filter(tab => tab.id === 'estudiantes_carga' || tab.id === 'estudiantes_lista');
    }
    return allTabs;
  }, [user]);

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto px-4">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display">
            Consola de Configuración Institucional
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Matriculación de alumnos, creación de usuarios y asignación de asignaturas para Educación Física de E.E.S N° 28.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
          <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5">
            <Users className="text-accent-500" size={14} />
            <span>Cursos Config: <strong className="text-slate-900">{Object.keys(cursosConfig).length}</strong></span>
          </div>
          <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5">
            <CalendarRange className="text-red-500" size={14} />
            <span>Solicitudes: <strong className="text-slate-900">{solicitudesFaltantes.filter(s=>!s.completada).length}</strong></span>
          </div>
          <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5">
            <CalendarRange className="text-yellow-600" size={14} />
            <span>Actas: <strong className="text-slate-900">{informes.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Selector de Pantallas oculto (navegación por Sidebar) */}
      <div className="hidden">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isActive
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                  : 'bg-white border-slate-200 text-slate-650 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : tab.color} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Vista de la Pantalla Activa */}
      <div className="pt-2">
        {activeTab === 'usuarios_carga' && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            {/* FormCargaUsuario */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-200 shadow-lg bg-white flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-500">
                    <UserPlus size={20} />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 font-display">
                    {editingUsrDni ? 'Editar Usuario' : 'Carga de Usuarios'}
                  </h2>
                </div>

                {usrError && (
                  <div className="mb-4 p-3 bg-red-500/5 border border-red-500/15 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0 text-red-655 text-red-600" />
                    <span>{usrError}</span>
                  </div>
                )}

                {usrSuccess && (
                  <div className="mb-4 p-3 bg-accent-500/5 border border-accent-500/15 text-accent-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <CheckCircle2 size={14} className="shrink-0 text-accent-600" />
                    <span>{usrSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleUsrSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-650 text-slate-600 uppercase mb-1">Nombre</label>
                      <input
                        type="text"
                        value={usrForm.nombre}
                        onChange={e => setUsrForm({...usrForm, nombre: e.target.value})}
                        placeholder="Patricia"
                        className="w-full bg-white border border-slate-300 focus:border-primary-500 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-650 text-slate-600 uppercase mb-1">Apellido</label>
                      <input
                        type="text"
                        value={usrForm.apellido}
                        onChange={e => setUsrForm({...usrForm, apellido: e.target.value})}
                        placeholder="González"
                        className="w-full bg-white border border-slate-300 focus:border-primary-500 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-650 text-slate-600 uppercase mb-1">DNI</label>
                      <input
                        type="text"
                        value={usrForm.dni}
                        onChange={e => setUsrForm({...usrForm, dni: e.target.value})}
                        placeholder="Números"
                        className="w-full bg-white border border-slate-300 focus:border-primary-500 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-655 text-slate-600 uppercase mb-1">F. Nacimiento</label>
                      <input
                        type="date"
                        max={new Date().toISOString().split('T')[0]}
                        value={usrForm.fechaNac}
                        onChange={e => setUsrForm({...usrForm, fechaNac: e.target.value})}
                        className="w-full bg-white border border-slate-300 focus:border-primary-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-650 text-slate-600 uppercase mb-1">Correo Inst. (@abc.gob.ar)</label>
                    <input
                      type="text"
                      value={usrForm.correo}
                      onChange={e => setUsrForm({...usrForm, correo: e.target.value})}
                      placeholder="usuario@abc.gob.ar"
                      className="w-full bg-white border border-slate-300 focus:border-primary-500 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-655 text-slate-600 uppercase mb-1">Rol</label>
                    <select
                      value={usrForm.rol}
                      onChange={e => setUsrForm({...usrForm, rol: e.target.value})}
                      className="w-full bg-white border border-slate-300 focus:border-primary-500 rounded-lg px-3 py-1.5 text-xs text-slate-805 focus:outline-none"
                    >
                      <option value="Docente">Docente</option>
                      <option value="Preceptor">Preceptor</option>
                      <option value="Equipo de Conducción">Equipo de Conducción</option>
                    </select>
                  </div>

                  {usrForm.rol === 'Docente' && (
                    <div className="animate-pulse-once">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Situación de Revista *</label>
                      <select
                        value={usrForm.situacionRevista}
                        onChange={e => setUsrForm({...usrForm, situacionRevista: e.target.value})}
                        className="w-full bg-white border border-slate-300 focus:border-primary-500 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none font-bold"
                      >
                        <option value="Titular">Titular</option>
                        <option value="Provisional">Provisional</option>
                        <option value="Interino">Interino</option>
                        <option value="Suplente">Suplente</option>
                      </select>
                    </div>
                  )}

                  {(usrForm.rol === 'Preceptor' || usrForm.rol === 'Docente') && (
                    <div className="animate-pulse-once">
                      <label className="block text-[10px] font-bold text-slate-650 text-slate-600 uppercase mb-1.5">Asignar Cursos</label>
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[10px] font-bold text-slate-700 max-h-32 overflow-y-auto font-sans">
                        {CURSOS.map(curso => {
                          const isChecked = usrForm.cursosAsignados.includes(curso);
                          return (
                            <label key={curso} className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => {
                                  const checked = e.target.checked;
                                  setUsrForm(prev => {
                                    let list = [...prev.cursosAsignados];
                                    if (checked) {
                                      if (!list.includes(curso)) list.push(curso);
                                    } else {
                                      list = list.filter(c => c !== curso);
                                    }
                                    return { ...prev, cursosAsignados: list };
                                  });
                                }}
                                className="rounded text-primary-500 focus:ring-primary-500 cursor-pointer w-3.5 h-3.5 border-slate-300"
                              />
                              <span>{curso}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {editingUsrDni && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUsrDni(null);
                          setUsrForm({
                            apellido: '',
                            nombre: '',
                            dni: '',
                            fechaNac: '',
                            correo: '',
                            rol: 'Docente',
                            situacionRevista: 'Titular',
                            cursosAsignados: []
                          });
                          setUsrError('');
                          setUsrSuccess('');
                        }}
                        className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold py-2.5 px-4 rounded-xl transition-all uppercase tracking-wider cursor-pointer font-sans border border-slate-200"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      className={`${editingUsrDni ? 'w-2/3' : 'w-full'} bg-primary-500 hover:bg-primary-600 text-white text-[10px] font-bold py-2.5 px-4 rounded-xl transition-all uppercase tracking-wider cursor-pointer font-sans`}
                    >
                      {editingUsrDni ? 'Guardar Cambios' : 'Guardar Usuario'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'usuarios_lista' && (
          <div className="glass-panel rounded-3xl p-6 border border-slate-200 bg-white shadow-sm w-full animate-fade-in">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="text-primary-500" size={18} />
                <h3 className="text-lg font-bold text-slate-800 font-display">Personal Registrado</h3>
              </div>
              <span className="text-[10px] text-slate-500 uppercase bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-bold">Vite Live State</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs table-stack">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                    <th className="py-2.5 px-3">Apellido, Nombre</th>
                    <th className="py-2.5 px-3">DNI</th>
                    <th className="py-2.5 px-3">Correo</th>
                    <th className="py-2.5 px-3 text-right">Rol</th>
                    <th className="py-2.5 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usuariosOrdenados.map((u, i) => (
                    <tr key={i} className="hover:bg-slate-50 text-slate-700">
                      <td data-label="Apellido, Nombre" className="py-2.5 px-3 font-semibold text-slate-800">{u.apellido}, {u.nombre}</td>
                      <td data-label="DNI" className="py-2.5 px-3 font-mono text-slate-500">{u.dni}</td>
                      <td data-label="Correo" className="py-2.5 px-3 font-mono text-slate-500">{u.correo}</td>
                      <td data-label="Rol" className="py-2.5 px-3 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          u.rol === "Equipo de Conducción" ? "bg-red-50 text-red-750 border border-red-200" :
                          u.rol === "Preceptor" ? "bg-primary-50 text-primary-705 border border-primary-200" :
                          "bg-accent-50 text-accent-705 border border-accent-200"
                        }`}>
                          {u.rol === 'Docente' && u.situacionRevista ? `${u.rol} (${u.situacionRevista})` : u.rol}
                        </span>
                        {u.cursosAsignados && u.cursosAsignados.length > 0 && (
                          <div className="text-[9px] text-slate-500 font-semibold mt-1">
                            Cursos: {u.cursosAsignados.join(', ')}
                          </div>
                        )}
                      </td>
                      <td data-label="Acciones" className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingUsrDni(u.dni);
                              setUsrForm({
                                apellido: u.apellido,
                                nombre: u.nombre,
                                dni: u.dni,
                                fechaNac: u.fechaNac || '',
                                correo: u.correo,
                                rol: u.rol,
                                situacionRevista: u.situacionRevista || 'Titular',
                                cursosAsignados: u.cursosAsignados || []
                              });
                              setUsrError('');
                              setUsrSuccess('');
                              navigateToAdminTab('usuarios_carga');
                            }}
                            className="p-1 text-primary-500 hover:text-primary-700 hover:bg-primary-500/10 rounded transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => {
                              if (u.dni === user?.dni) {
                                alert("No puedes eliminar tu propio usuario activo.");
                                return;
                              }
                              if (window.confirm(`¿Está seguro de que desea eliminar al usuario ${u.nombre} ${u.apellido} (DNI: ${u.dni})?`)) {
                                eliminarUsuario(u.dni);
                              }
                            }}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'estudiantes_carga' && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            {/* FormCargaEstudiante */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-200 shadow-lg bg-white flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-accent-500/10 border border-accent-500/20 text-accent-500">
                    <GraduationCap size={20} />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 font-display">
                    {editingEstDni ? 'Editar Estudiante' : 'Matrícula Estudiantes'}
                  </h2>
                </div>

                {estError && (
                  <div className="mb-4 p-3 bg-red-500/5 border border-red-500/15 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0 text-red-655 text-red-600" />
                    <span>{estError}</span>
                  </div>
                )}

                {estSuccess && (
                  <div className="mb-4 p-3 bg-accent-500/5 border border-accent-500/15 text-accent-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <CheckCircle2 size={14} className="shrink-0 text-accent-600" />
                    <span>{estSuccess}</span>
                  </div>
                )}

                {!editingEstDni && (
                  <div className="flex border-b border-slate-200 mb-4 text-[10px] font-bold uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => setEnrollMode('individual')}
                      className={`flex-1 pb-2 text-center border-b-2 transition-all cursor-pointer ${
                        enrollMode === 'individual'
                          ? 'border-accent-500 text-accent-600'
                          : 'border-transparent text-slate-400 hover:text-slate-605'
                      }`}
                    >
                      Individual
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnrollMode('csv')}
                      className={`flex-1 pb-2 text-center border-b-2 transition-all cursor-pointer ${
                        enrollMode === 'csv'
                          ? 'border-accent-500 text-accent-600'
                          : 'border-transparent text-slate-400 hover:text-slate-605'
                      }`}
                    >
                      Subir CSV
                    </button>
                  </div>
                )}

                {enrollMode === 'csv' && !editingEstDni ? (
                  <div className="space-y-4 font-sans">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2 text-slate-650">
                      <p className="font-bold text-slate-700">Instrucciones para matricular por CSV:</p>
                      <ul className="list-disc pl-4 space-y-1 text-slate-500">
                        <li>El archivo debe estar en formato <strong>CSV</strong> (valores separados por coma o punto y coma).</li>
                        <li>Debe incluir las siguientes columnas: <strong>nombre, dni, cursoOrigen</strong>.</li>
                        <li>Opcionalmente, puede incluir la columna <strong>cursoEF</strong> si cursa Educación Física en un grupo diferente al de origen.</li>
                        <li>El turno se calculará automáticamente en base a la división de origen.</li>
                      </ul>
                      <button
                        type="button"
                        onClick={descargarCSVTemplate}
                        className="flex items-center gap-1.5 text-accent-600 hover:text-accent-700 font-bold transition-colors mt-2 cursor-pointer font-sans"
                      >
                        <Download size={14} />
                        Descargar plantilla de ejemplo
                      </button>
                    </div>

                    <div className="border-2 border-dashed border-slate-300 hover:border-accent-500/50 rounded-2xl p-6 text-center transition-colors bg-slate-50/50 relative cursor-pointer group">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCSVUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-3 bg-white rounded-full shadow-sm text-slate-400 group-hover:text-accent-500 transition-colors">
                          <Upload size={20} className="text-slate-400 group-hover:text-accent-500" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">Haga clic o arrastre un archivo CSV</span>
                          <span className="text-[10px] text-slate-400">Tamaño máximo recomendado: 5MB</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleEstSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nombre Completo (Apellido, Nombre)</label>
                      <input
                        type="text"
                        value={estForm.nombre}
                        onChange={e => setEstForm({...estForm, nombre: e.target.value})}
                        placeholder="Cardozo, Lucas"
                        className="w-full bg-white border border-slate-300 focus:border-accent-500 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">DNI</label>
                        <input
                          type="text"
                          value={estForm.dni}
                          onChange={e => setEstForm({...estForm, dni: e.target.value})}
                          placeholder="Solo números"
                          className="w-full bg-white border border-slate-300 focus:border-accent-500 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-655 text-slate-600 uppercase mb-1">Turno *(Auto)</label>
                        <input
                          type="text"
                          value={estForm.turno}
                          disabled
                          className="w-full bg-slate-50 border border-slate-200 text-slate-500 rounded-lg px-3 py-1.5 text-xs font-bold cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Curso Origen</label>
                      <select
                        value={estForm.cursoOrigen}
                        onChange={e => handleEstCursoOrigenChange(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-accent-500 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none font-bold"
                      >
                        {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div className="pt-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                      {/* Checkbox No Cursa EF */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-700 leading-tight font-display">
                          ¿No cursa Educación Física? (Exceptuado)
                        </span>
                        <label className="inline-flex relative items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={estForm.noCursaEF || false}
                            onChange={e => {
                              const checked = e.target.checked;
                              setEstForm({
                                ...estForm,
                                noCursaEF: checked,
                                // Si no cursa, forzar asignarDiferenteEF a false
                                asignarDiferenteEF: checked ? false : estForm.asignarDiferenteEF,
                                recursaCursos: checked ? [] : estForm.recursaCursos
                              });
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-red-500"></div>
                        </label>
                      </div>

                      {/* Asignación Diferente EF (solo si cursa materia) */}
                      {!estForm.noCursaEF && (
                        <>
                          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                            <span className="text-[10px] font-bold text-slate-700 leading-tight">
                              ¿Cursada EF Alternativa? (Otro Curso)
                            </span>
                            <label className="inline-flex relative items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={estForm.asignarDiferenteEF}
                                onChange={e => setEstForm({...estForm, asignarDiferenteEF: e.target.checked})}
                                className="sr-only peer"
                              />
                              <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-accent-500"></div>
                            </label>
                          </div>

                          {estForm.asignarDiferenteEF && (
                            <div className="mt-2.5 pt-2.5 border-t border-slate-200 animate-pulse-once">
                              <label className="block text-[9px] font-bold text-accent-600 uppercase mb-1">Curso de Educación Física Destino</label>
                              <select
                                value={estForm.cursoEF}
                                onChange={e => setEstForm({
                                  ...estForm,
                                  cursoEF: e.target.value,
                                  recursaCursos: estForm.recursaCursos.filter(x => x !== e.target.value)
                                })}
                                className="w-full bg-white border border-accent-500/20 focus:border-accent-500 rounded-lg px-2.5 py-1 text-xs text-slate-855 focus:outline-none font-bold"
                              >
                                {CURSOS.map(c => <option key={c} value={c}>Curso {c}</option>)}
                              </select>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Cursada Adicional: recursar otra división EF (multi-matriculación) */}
                    {!estForm.noCursaEF && (
                      <div className="pt-2 bg-purple-50/50 p-3.5 rounded-xl border border-purple-200 space-y-3 animate-pulse-once">
                        <div>
                          <span className="text-[10px] font-bold text-purple-900 leading-tight block">
                            Cursada Adicional (Recursar otra división)
                          </span>
                          <p className="text-[9px] text-slate-500 font-semibold mt-1 leading-relaxed">
                            Si además <strong>recursa</strong> otra división EF, marcá esa división. El estudiante figurará en las planillas de <strong>todos</strong> los cursos seleccionados, sin necesidad de que sean su curso de origen.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {CURSOS.filter(c => c !== estForm.cursoEF).map(c => {
                            const activo = estForm.recursaCursos.includes(c);
                            return (
                              <button
                                key={c}
                                type="button"
                                onClick={() => {
                                  setEstForm(prev => ({
                                    ...prev,
                                    recursaCursos: activo
                                      ? prev.recursaCursos.filter(x => x !== c)
                                      : [...prev.recursaCursos, c]
                                  }));
                                }}
                                className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer active:scale-95 ${
                                  activo
                                    ? 'bg-purple-500 text-white border-purple-500 shadow-sm'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-purple-300 hover:text-purple-700'
                                }`}
                              >
                                {activo ? '✓ ' : '+ '}{c}
                              </button>
                            );
                          })}
                        </div>
                        {estForm.recursaCursos.length > 0 && (
                          <p className="text-[9px] font-bold text-purple-700 uppercase tracking-wide">
                            Recursando: {estForm.recursaCursos.join(', ')}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {editingEstDni && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEstDni(null);
                            setEstForm({
                              nombre: '',
                              dni: '',
                              cursoOrigen: '1°1°',
                              turno: 'Mañana',
                              asignarDiferenteEF: false,
                              cursoEF: '1°1°',
                              noCursaEF: false,
                              recursaCursos: []
                            });
                            setEstError('');
                            setEstSuccess('');
                          }}
                          className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold py-2.5 px-4 rounded-xl transition-all uppercase tracking-wider cursor-pointer font-sans border border-slate-200"
                        >
                          Cancelar
                        </button>
                      )}
                      <button
                        type="submit"
                        className={`${editingEstDni ? 'w-2/3' : 'w-full'} bg-accent-500 hover:bg-accent-600 text-white text-[10px] font-bold py-2.5 px-4 rounded-xl transition-all uppercase tracking-wider cursor-pointer font-sans`}
                      >
                        {editingEstDni ? 'Guardar Cambios' : 'Matricular Alumno'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'estudiantes_lista' && (
          <div className="glass-panel rounded-3xl p-6 border border-slate-200 bg-white shadow-sm w-full animate-fade-in">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="text-accent-500" size={18} />
                <h3 className="text-lg font-bold text-slate-800 font-display">Estudiantes Matriculados</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={descargarEstudiantesExcel}
                  className="flex items-center gap-1.5 bg-accent-500 hover:bg-accent-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
                >
                  <Download size={14} />
                  <span>Exportar Estudiantes (Excel)</span>
                </button>
                <span className="text-[10px] text-slate-500 uppercase bg-slate-100 border border-slate-200 px-2 py-1 rounded-md font-bold">Vite Live State</span>
              </div>
            </div>

            {/* Barra de Filtros interactiva */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4 text-xs font-semibold animate-fade-in">
              <div className="flex flex-wrap items-center gap-3.5 flex-1">
                {/* Buscador */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar estudiante o DNI..."
                    className="w-full bg-white border border-slate-300 focus:border-accent-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none font-medium placeholder-slate-400 transition-colors shadow-sm"
                  />
                </div>

                {/* Filtro por Curso */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Curso:</span>
                  <select
                    value={filterCurso}
                    onChange={e => setFilterCurso(e.target.value)}
                    className="bg-white border border-slate-300 focus:border-accent-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none font-bold cursor-pointer shadow-sm"
                  >
                    <option value="Todos">Todos</option>
                    {CURSOS.map(c => (
                      <option key={c} value={c}>Curso {c}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Turno */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Turno:</span>
                  <select
                    value={filterTurno}
                    onChange={e => setFilterTurno(e.target.value)}
                    className="bg-white border border-slate-300 focus:border-accent-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none font-bold cursor-pointer shadow-sm"
                  >
                    <option value="Todos">Todos</option>
                    <option value="Mañana">Mañana</option>
                    <option value="Tarde">Tarde</option>
                  </select>
                </div>

                {/* Botón Limpiar */}
                {(filterCurso !== 'Todos' || filterTurno !== 'Todos' || searchQuery.trim() !== '') && (
                  <button
                    onClick={() => {
                      setFilterCurso('Todos');
                      setFilterTurno('Todos');
                      setSearchQuery('');
                    }}
                    className="text-[10px] font-extrabold text-red-500 hover:text-red-750 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition-colors uppercase cursor-pointer"
                  >
                    Limpiar Filtros
                  </button>
                )}
              </div>

              <div className="text-[10px] text-slate-500 uppercase font-extrabold select-none shrink-0 text-right">
                Mostrando <strong className="text-slate-900">{alumnosFiltradosYOrdenados.length}</strong> de <strong className="text-slate-900">{alumnos.length}</strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs table-stack">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                    <th className="py-2.5 px-3">Apellido, Nombre</th>
                    <th className="py-2.5 px-3">DNI</th>
                    <th className="py-2.5 px-3">Curso Origen</th>
                    <th className="py-2.5 px-3">Turno</th>
                    <th className="py-2.5 px-3 text-right">Curso EF</th>
                    <th className="py-2.5 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {alumnosFiltradosYOrdenados.map((a, i) => (
                    <tr key={i} className="hover:bg-slate-50 text-slate-700">
                      <td data-label="Apellido, Nombre" className="py-2.5 px-3 font-semibold text-slate-800">{a.nombre}</td>
                      <td data-label="DNI" className="py-2.5 px-3 font-mono text-slate-500">{a.dni}</td>
                      <td data-label="Curso Origen" className="py-2.5 px-3 font-bold text-slate-700">{a.cursoOrigen}</td>
                      <td data-label="Turno" className="py-2.5 px-3 text-slate-600">{a.turno}</td>
                      <td data-label="Curso EF" className="py-2.5 px-3 text-right">
                        <div className="flex flex-col items-end gap-1">
                          {a.noCursaEF ? (
                            <span className="inline-block bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                              No cursa EF
                            </span>
                          ) : a.cursoEF !== a.cursoOrigen ? (
                            <span className="inline-block bg-yellow-50 text-yellow-750 border border-yellow-250 px-2 py-0.5 rounded text-[9px] font-bold">
                              {a.cursoEF} (Externo)
                            </span>
                          ) : (
                            <span className="inline-block bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold">
                              {a.cursoEF}
                            </span>
                          )}
                          {(a.recursaCursos || []).length > 0 && (
                            <div className="flex flex-wrap justify-end gap-1">
                              {(a.recursaCursos || []).map(c => (
                                <span key={c} className="inline-block bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                  Recursa {c}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td data-label="Acciones" className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingEstDni(a.dni);
                              setEstForm({
                                nombre: a.nombre,
                                dni: a.dni,
                                cursoOrigen: a.cursoOrigen,
                                turno: a.turno,
                                asignarDiferenteEF: !a.noCursaEF && a.cursoEF !== a.cursoOrigen,
                                cursoEF: a.cursoEF,
                                noCursaEF: !!a.noCursaEF,
                                recursaCursos: a.recursaCursos || []
                              });
                              setEstError('');
                              setEstSuccess('');
                              navigateToAdminTab('estudiantes_carga');
                            }}
                            className="p-1 text-accent-500 hover:text-accent-700 hover:bg-accent-500/10 rounded transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Está seguro de que desea eliminar al alumno ${a.nombre} (DNI: ${a.dni})?`)) {
                                eliminarEstudiante(a.dni);
                              }
                            }}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'cursos_carga' && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            {/* FormCargaCursoEF */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-200 shadow-lg bg-white flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-gold-500/10 border border-gold-500/30 text-slate-800">
                    <CalendarRange size={20} className="text-yellow-600 animate-float" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 font-display">Asignación Curricular EF</h2>
                </div>

                {cursoConfigError && (
                  <div className="mb-4 p-3 bg-red-500/5 border border-red-500/15 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0 text-red-655 text-red-600" />
                    <span>{cursoConfigError}</span>
                  </div>
                )}

                {cursoConfigSuccess && (
                  <div className="mb-4 p-3 bg-accent-500/5 border border-accent-500/15 text-accent-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <CheckCircle2 size={14} className="shrink-0 text-accent-600" />
                    <span>{cursoConfigSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleCursoConfigSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Curso a Configurar</label>
                    <select
                      value={cursoConfigForm.curso}
                      onChange={e => handleCursoConfigChange(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-primary-500 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none font-bold"
                    >
                      {CURSOS.map(c => <option key={c} value={c}>Curso {c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Docente a Cargo</label>
                    <select
                      value={cursoConfigForm.docenteDni}
                      onChange={e => setCursoConfigForm({...cursoConfigForm, docenteDni: e.target.value})}
                      className="w-full bg-white border border-slate-300 focus:border-primary-500 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                    >
                      {docentesDisponibles.length === 0 ? (
                        <option value="">No hay docentes registrados</option>
                      ) : (
                        docentesDisponibles.map(d => (
                          <option key={d.dni} value={d.dni}>
                            Prof. {d.apellido}, {d.nombre}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Turno de Cursada</span>
                    <span className="text-xs font-extrabold text-primary-600 uppercase bg-primary-50 border border-primary-200 px-2.5 py-0.5 rounded-md">
                      {cursoConfigForm.turno}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase">
                      Días y Horarios de Cursada
                    </label>
                    <div className="space-y-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                      {DIAS_SEMANA.map(dia => {
                        const isChecked = cursoConfigForm.dias.includes(dia.value);
                        const scheduleValue = cursoConfigForm.horariosPorDia?.[dia.value] || '';
                        return (
                          <div
                            key={dia.value}
                            className={`flex items-center gap-3 bg-white p-2 rounded-xl border shadow-sm transition-all duration-200 ${
                              isChecked ? 'border-primary-100 ring-1 ring-primary-50/50' : 'border-slate-150'
                            }`}
                          >
                            <label className="flex items-center gap-2 cursor-pointer w-24 shrink-0 select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => handleDiaCheckboxChange(dia.value, e.target.checked)}
                                className="rounded text-primary-500 focus:ring-primary-500 cursor-pointer w-4 h-4 border-slate-350"
                              />
                              <span className={`text-xs font-bold transition-colors ${isChecked ? 'text-slate-900' : 'text-slate-400'}`}>
                                {dia.label}
                              </span>
                            </label>
                            <input
                              type="text"
                              value={scheduleValue}
                              disabled={!isChecked}
                              onChange={e => handleHorarioPorDiaChange(dia.value, e.target.value)}
                              placeholder={isChecked ? "Ej: 13:00 a 15:00" : "Día no seleccionado"}
                              className={`w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none font-mono transition-all duration-200 ${
                                isChecked
                                  ? 'bg-white border-slate-300 focus:border-primary-500 text-slate-900'
                                  : 'bg-slate-50/50 border-slate-200 text-slate-400 cursor-not-allowed placeholder-slate-350'
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white text-[10px] font-bold py-2.5 px-4 rounded-xl transition-all uppercase tracking-wider cursor-pointer font-sans"
                  >
                    Establecer Curso EF
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cursos_lista' && (
          <div className="glass-panel rounded-3xl p-6 border border-slate-200 bg-white shadow-sm w-full animate-fade-in">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarRange className="text-primary-500" size={18} />
                <h3 className="text-lg font-bold text-slate-800 font-display">Cursos de Educación Física</h3>
              </div>
              <span className="text-[10px] text-slate-500 uppercase bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-bold font-sans">Consola</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs table-stack">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                    <th className="py-2.5 px-3">Curso</th>
                    <th className="py-2.5 px-3">Docente</th>
                    <th className="py-2.5 px-3">Días de Clase</th>
                    <th className="py-2.5 px-3 text-right">Horario</th>
                    <th className="py-2.5 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.keys(cursosConfig).map((curso) => {
                    const c = cursosConfig[curso];
                    const diasLabel = c.dias.map(d => 
                      d === 1 ? 'Lun' : d === 2 ? 'Mar' : d === 3 ? 'Mié' : d === 4 ? 'Jue' : 'Vie'
                    ).join(' y ');

                    return (
                      <tr key={curso} className="hover:bg-slate-50 text-slate-700">
                        <td data-label="Curso" className="py-2.5 px-3 font-extrabold text-slate-900">{curso}</td>
                        <td data-label="Docente" className="py-2.5 px-3 font-semibold text-primary-600">{c.docenteNombre}</td>
                        <td data-label="Días de Clase" className="py-2.5 px-3 font-bold text-slate-600">
                          <span className="inline-block bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px]">
                            {diasLabel}
                          </span>
                        </td>
                        <td data-label="Horario" className="py-2.5 px-3 text-right font-mono text-slate-500">{c.horario}</td>
                        <td data-label="Acciones" className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                handleCursoConfigChange(curso);
                                navigateToAdminTab('cursos_carga');
                              }}
                              className="p-1 text-primary-500 hover:text-primary-700 hover:bg-primary-500/10 rounded transition-colors cursor-pointer"
                              title="Editar Configuración"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`¿Está seguro de que desea eliminar la configuración curricular para el curso ${curso}?`)) {
                                  eliminarCursoConfig(curso);
                                }
                              }}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                              title="Eliminar Configuración"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'partes_carga_masiva' && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="glass-panel rounded-3xl p-6 border border-slate-200 shadow-lg bg-white flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
                    <Upload size={20} />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 font-display">
                    Carga Masiva de Partes Diarios (EF)
                  </h2>
                </div>

                {partesUploadError && (
                  <div className="mb-4 p-3 bg-red-500/5 border border-red-500/15 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0 text-red-600" />
                    <span>{partesUploadError}</span>
                  </div>
                )}

                {partesUploadSuccess && (
                  <div className="mb-4 p-3 bg-emerald-500/5 border border-emerald-500/15 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
                    <span>{partesUploadSuccess}</span>
                  </div>
                )}

                <div className="space-y-4 font-sans">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2 text-slate-650">
                    <p className="font-bold text-slate-700">Instrucciones para cargar partes por CSV:</p>
                    <ul className="list-disc pl-4 space-y-1 text-slate-500">
                      <li>El archivo debe estar en formato <strong>CSV</strong> (valores separados por coma o punto y coma).</li>
                      <li>Columnas obligatorias: <strong>fecha</strong> (formato AAAA-MM-DD), <strong>curso</strong> (ej: 1°1°), <strong>huboClase</strong> (Sí/No) y <strong>docenteDni</strong>.</li>
                      <li>Columnas opcionales de clase: <strong>claseNum, unidad, caracter, dinamica, contenido, actividades, observaciones, motivoSuspension</strong>.</li>
                      <li>La columna <strong>asistencia</strong> debe contener la lista de alumnos con su estado en formato: <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px] font-mono">DNI:Estado</code> separados por punto y coma (ej: <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px] font-mono">10001:Presente;10002:Ausente</code>).</li>
                      <li>El docente con el DNI especificado debe existir en el sistema con el rol <strong>Docente</strong>.</li>
                      <li>Si ya existe un parte para la misma fecha y curso, se actualizará automáticamente; de lo contrario, se creará uno nuevo.</li>
                    </ul>
                    <button
                      type="button"
                      onClick={descargarPartesCSVTemplate}
                      className="flex items-center gap-1.5 text-red-600 hover:text-red-700 font-bold transition-colors mt-2 cursor-pointer font-sans"
                    >
                      <Download size={14} />
                      Descargar plantilla de ejemplo (ejemplo_carga_partes.csv)
                    </button>
                  </div>

                  <div className="border-2 border-dashed border-slate-300 hover:border-red-500/50 rounded-2xl p-6 text-center transition-colors bg-slate-50/50 relative cursor-pointer group">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handlePartesCSVUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-white rounded-full shadow-sm text-slate-400 group-hover:text-red-500 transition-colors">
                        <Upload size={20} className="text-slate-400 group-hover:text-red-500" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">Haga clic o arrastre un archivo CSV de partes</span>
                        <span className="text-[10px] text-slate-400">Tamaño máximo recomendado: 5MB</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'partes_crear' && (
          <div className="space-y-6 animate-fade-in">
            {!adminParteSelectedCurso ? (
              // ── PANTALLA 1: Selección de Curso ──────────────────────────────
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 font-display mb-1">Crear Parte Diario</h2>
                  <p className="text-slate-500 text-xs mb-6">Selecciona un curso configurado para confeccionar su parte diario de asistencia.</p>

                  {Object.keys(cursosConfig).length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed border-slate-300 rounded-3xl bg-white">
                      <AlertTriangle className="mx-auto text-slate-400 mb-2" size={32} />
                      <p className="text-slate-500 font-bold text-sm">No hay cursos de EF configurados.</p>
                      <p className="text-slate-400 text-xs mt-1">Configurá los cursos desde la pestaña "Asignación Curricular EF" primero.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.keys(cursosConfig).sort().map((curso) => {
                        const config = cursosConfig[curso];
                        const cantAlumnos = alumnos.filter(al => (al.cursoEF === curso || (al.recursaCursos || []).includes(curso)) && !al.noCursaEF).length;
                        const docenteNombre = config.docenteNombre || 'Sin docente';
                        return (
                          <button
                            key={curso}
                            onClick={() => handleAdminParteSelectCurso(curso)}
                            className="glass-panel text-left p-5 rounded-2xl border border-slate-200 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all duration-300 group relative overflow-hidden bg-white cursor-pointer"
                          >
                            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl -mr-6 -mt-6 group-hover:bg-indigo-500/10 transition-all"></div>
                            <span className="font-display font-extrabold text-2xl text-slate-800 tracking-tight block mb-1">{curso}</span>
                            <span className="text-[10px] text-slate-500 font-semibold block truncate">{docenteNombre}</span>
                            <span className="text-[10px] text-indigo-500 font-bold block mt-2">{cantAlumnos} alumnos activos</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Historial de todos los partes (editar / eliminar) */}
                <div className="glass-panel rounded-3xl p-6 border border-slate-200 shadow-lg bg-white">
                  <h2 className="text-base font-bold text-slate-850 font-display mb-4">Historial de Partes Registrados</h2>
                  {partes.length === 0 ? (
                    <div className="py-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                      <p className="text-xs text-slate-400 font-bold">No hay partes registrados aún.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto font-sans">
                      <table className="w-full text-left border-collapse text-xs table-stack">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase">
                            <th className="py-2.5 px-3">Curso</th>
                            <th className="py-2.5 px-3">Fecha</th>
                            <th className="py-2.5 px-3">Horario</th>
                            <th className="py-2.5 px-3 text-center">Clase N°</th>
                            <th className="py-2.5 px-3">Docente</th>
                            <th className="py-2.5 px-3 text-center">¿Hubo Clase?</th>
                            <th className="py-2.5 px-3 text-center">Presentes</th>
                            <th className="py-2.5 px-3 text-center">Ausentes</th>
                            <th className="py-2.5 px-3 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {[...partes].sort((a,b) => new Date(b.fecha) - new Date(a.fecha)).map((p) => {
                            const cantPresentes = Object.values(p.asistencia || {}).filter(a => a === 'Presente').length;
                            const cantAusentes  = Object.values(p.asistencia || {}).filter(a => a === 'Ausente').length;
                            return (
                              <tr key={p.id} className="hover:bg-slate-50 text-slate-700 transition-colors">
                                <td data-label="Curso" className="py-2.5 px-3 font-extrabold text-slate-900">{p.curso}</td>
                                <td data-label="Fecha" className="py-2.5 px-3 font-bold font-mono">{new Date(p.fecha + 'T00:00:00').toLocaleDateString('es-AR')}</td>
                                <td data-label="Horario" className="py-2.5 px-3 text-slate-500">{p.horario}</td>
                                <td data-label="Clase N°" className="py-2.5 px-3 text-center font-bold text-slate-600">{p.claseNum || '-'}</td>
                                <td data-label="Docente" className="py-2.5 px-3 text-slate-600 max-w-[130px] truncate" title={p.docenteNombre}>{p.docenteNombre}</td>
                                <td data-label="¿Hubo Clase?" className="py-2.5 px-3 text-center">
                                  <span className={`inline-block px-2 py-0.5 rounded-lg border font-bold text-[10px] ${p.huboClase === 'Sí' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                    {p.huboClase === 'Sí' ? 'Sí' : 'Suspendida'}
                                  </span>
                                </td>
                                <td data-label="Presentes" className="py-2.5 px-3 text-center">
                                  <span className="inline-block bg-accent-50 text-accent-700 px-2 py-0.5 rounded-lg border border-accent-200 font-bold">{cantPresentes}</span>
                                </td>
                                <td data-label="Ausentes" className="py-2.5 px-3 text-center">
                                  <span className="inline-block bg-red-50 text-red-700 px-2 py-0.5 rounded-lg border border-red-200 font-bold">{cantAusentes}</span>
                                </td>
                                <td data-label="Acciones" className="py-2.5 px-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleAdminParteEditClick(p)}
                                      className="p-1.5 text-primary-500 hover:text-primary-750 hover:bg-primary-500/10 rounded-lg transition-all cursor-pointer"
                                      title="Editar Parte"
                                    >
                                      <Edit size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleAdminParteDeleteClick(p.id)}
                                      className="p-1.5 text-red-500 hover:text-red-750 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                                      title="Eliminar Parte"
                                    >
                                      <Trash2 size={13} />
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
              // ── PANTALLA 2: Formulario del Parte ───────────────────────────────
              <div className="glass-panel rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xl relative bg-white">
                <div className="flex items-center justify-between border-b border-slate-150 pb-5 mb-6">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full uppercase">
                      {adminParteEditingId ? 'Edición de Parte' : 'Nuevo Parte'} — Administrador
                    </span>
                    <h2 className="text-2xl font-bold text-slate-900 font-display mt-1.5">
                      {adminParteEditingId ? `Editando Clase: ${adminParteSelectedCurso}` : `Confeccionar Parte: ${adminParteSelectedCurso}`}
                    </h2>
                  </div>
                  <button
                    onClick={() => { setAdminParteSelectedCurso(null); setAdminParteEditingId(null); }}
                    className="text-xs text-slate-650 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer font-bold"
                  >
                    Cancelar
                  </button>
                </div>

                {adminParteSuccessMsg && (
                  <div className="mb-6 p-4 bg-accent-500/10 border border-accent-500/20 text-accent-700 text-sm rounded-2xl flex items-center gap-3 font-semibold">
                    <CheckCircle2 className="text-accent-600 shrink-0" size={20} />
                    <span className="font-bold">{adminParteSuccessMsg}</span>
                  </div>
                )}

                {adminParteErrorMsg && (
                  <div className="mb-6 p-4 bg-red-500/5 border border-red-500/15 text-red-700 text-sm rounded-2xl flex items-center gap-3 font-semibold">
                    <AlertTriangle className="text-red-500 shrink-0" size={20} />
                    <span>{adminParteErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleAdminParteSubmit} className="space-y-6">

                  {/* ¿Hubo Clase? */}
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                    <span className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-3 text-center">
                      ¿Hubo clases de Educación Física? <span className="text-red-500">*</span>
                    </span>
                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                      <button
                        type="button"
                        onClick={() => setAdminParteHuboClase('Sí')}
                        className={`py-3.5 px-4 rounded-xl border font-bold text-xs uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          adminParteHuboClase === 'Sí'
                            ? 'bg-accent-500 border-accent-600 text-white shadow-md'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        ✓ SÍ, hubo clases
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminParteHuboClase('No')}
                        className={`py-3.5 px-4 rounded-xl border font-bold text-xs uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          adminParteHuboClase === 'No'
                            ? 'bg-red-500 border-red-600 text-white shadow-md'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        ✕ NO hubo clases
                      </button>
                    </div>
                  </div>

                  {/* Cabecera */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Docente <span className="text-red-500">*</span></label>
                      <select
                        value={adminParteDocenteDni}
                        onChange={(e) => setAdminParteDocenteDni(e.target.value)}
                        required
                        className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-all font-bold cursor-pointer"
                      >
                        <option value="">— Seleccionar —</option>
                        {docentesDisponibles.map(d => (
                          <option key={d.dni} value={d.dni}>{d.nombre} {d.apellido}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Fecha del Parte</label>
                      <input
                        type="date"
                        max={new Date().toISOString().split('T')[0]}
                        value={adminParteFecha}
                        onChange={(e) => setAdminParteFecha(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Turno EF</label>
                      <input
                        type="text"
                        value={adminParteSelectedCurso.endsWith('1°') ? 'Tarde' : 'Mañana'}
                        disabled
                        className="w-full bg-white border border-slate-200 text-slate-500 rounded-xl px-3 py-2 text-xs font-semibold cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Horario EF</label>
                      <input
                        type="text"
                        value={adminParteHorario}
                        onChange={(e) => setAdminParteHorario(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Si hubo clase */}
                  {adminParteHuboClase === 'Sí' ? (
                    <div className="space-y-6">
                      <div className="bg-indigo-500/5 p-5 rounded-2xl border border-indigo-500/10 space-y-4">
                        <span className="text-[11px] font-bold text-indigo-600 block uppercase tracking-wider">Campos del Libro de Temas</span>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Clase N°</label>
                            <input type="text" value={adminParteClaseNum} readOnly
                              placeholder="Autocalculado"
                              className="w-full bg-slate-50 border border-slate-200 text-slate-500 rounded-xl px-3 py-2 text-xs cursor-not-allowed font-mono font-bold" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Unidad <span className="text-red-500">*</span></label>
                            <input type="text" value={adminParteUnidad} onChange={e => setAdminParteUnidad(e.target.value)}
                              placeholder="Ej. I / II" required
                              className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-all font-mono" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Carácter</label>
                            <select value={adminParteCaracter} onChange={e => setAdminParteCaracter(e.target.value)}
                              className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-all font-bold cursor-pointer">
                              {PARTE_CARACTERES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Dinámica</label>
                            <input type="text" value={adminParteDinamica} onChange={e => setAdminParteDinamica(e.target.value)}
                              placeholder="Grupal, Parejas, Estaciones..."
                              className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-all" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tema Abordado <span className="text-red-500">*</span></label>
                            <textarea value={adminParteContenido} onChange={e => setAdminParteContenido(e.target.value)}
                              placeholder="Describa el contenido de la clase..." rows={2} required
                              className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-all leading-relaxed font-semibold" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Actividades que se desarrollan <span className="text-red-500">*</span></label>
                            <textarea value={adminParteActividades} onChange={e => setAdminParteActividades(e.target.value)}
                              placeholder="Describa las actividades físicas, ejercicios o juegos..." rows={2} required
                              className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-all leading-relaxed font-semibold" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Observaciones</label>
                            <textarea value={adminParteObservaciones} onChange={e => setAdminParteObservaciones(e.target.value)}
                              placeholder="Incidentes, conducta, justificaciones... (Opcional)" rows={2}
                              className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-all leading-relaxed font-semibold" />
                          </div>
                        </div>
                      </div>

                      {/* Tabla de Asistencia */}
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 mb-3 font-display">Tabla de Asistencia</h3>
                        {(() => {
                          const alumnosCurso = alumnos
                            .filter(al => (al.cursoEF === adminParteSelectedCurso || (al.recursaCursos || []).includes(adminParteSelectedCurso)) && !al.noCursaEF)
                            .sort((a,b) => (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' }));
                          return alumnosCurso.length === 0 ? (
                            <div className="py-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                              <p className="text-xs text-slate-400 font-bold">No hay alumnos matriculados activos en este curso EF.</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-inner">
                              <table className="w-full text-left border-collapse text-xs table-stack">
                                <thead>
                                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase">
                                    <th className="py-2.5 px-4">Estudiante</th>
                                    <th className="py-2.5 px-3">DNI</th>
                                    <th className="py-2.5 px-3">Curso Origen</th>
                                    <th className="py-2.5 px-4 text-center w-44">Asistencia</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {alumnosCurso.map(al => {
                                    const val = adminParteAsistencia[al.dni] || 'Presente';
                                    return (
                                      <tr key={al.dni} className="hover:bg-slate-50 text-slate-700">
                                        <td data-label="Estudiante" className="py-3 px-4 font-semibold text-slate-800">{al.nombre}</td>
                                        <td data-label="DNI" className="py-3 px-3 font-mono text-slate-500">{al.dni}</td>
                                        <td data-label="Curso Origen" className="py-3 px-3">
                                          {al.cursoOrigen !== adminParteSelectedCurso ? (
                                            <span className="inline-block bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[9px] font-bold">Externo ({al.cursoOrigen})</span>
                                          ) : <span className="text-slate-500">{al.cursoOrigen}</span>}
                                        </td>
                                        <td data-label="Asistencia" className="py-3 px-4">
                                          <div className="flex items-center justify-center gap-2">
                                            <button type="button"
                                              onClick={() => setAdminParteAsistencia(prev => ({ ...prev, [al.dni]: 'Presente' }))}
                                              className={`flex items-center gap-1 px-3 py-1 rounded-lg border font-bold text-[10px] transition-all cursor-pointer ${val === 'Presente' ? 'bg-accent-50 text-accent-700 border-accent-300 shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`}>
                                              ✓ Presente
                                            </button>
                                            <button type="button"
                                              onClick={() => setAdminParteAsistencia(prev => ({ ...prev, [al.dni]: 'Ausente' }))}
                                              className={`flex items-center gap-1 px-3 py-1 rounded-lg border font-bold text-[10px] transition-all cursor-pointer ${val === 'Ausente' ? 'bg-red-50 text-red-700 border-red-300 shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`}>
                                              ✕ Ausente
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    // Si NO hubo clase
                    <div className="bg-red-50/50 border border-red-200 p-6 rounded-3xl space-y-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={24} />
                        <div>
                          <h3 className="text-base font-bold text-red-800 font-display">Clase No Dictada — Asistencia Anulada</h3>
                          <p className="text-xs text-red-700 mt-1 leading-relaxed">
                            Se registrará el parte como clase suspendida. Especifique el motivo a continuación.
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Motivo de Suspensión <span className="text-red-500">*</span></label>
                          <select value={adminParteMotivoSuspension} onChange={e => setAdminParteMotivoSuspension(e.target.value)}
                            className="w-full bg-white border border-slate-300 focus:border-red-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none transition-all font-bold cursor-pointer">
                            {PARTE_SUSPENSION_MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                        {adminParteMotivoSuspension === 'Otros' && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Especifique <span className="text-red-500">*</span></label>
                            <input type="text" value={adminParteOtroMotivo} onChange={e => setAdminParteOtroMotivo(e.target.value)}
                              placeholder="Ej: Jornada Institucional..." required
                              className="w-full bg-white border border-red-500/30 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all" />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Observaciones (Opcional)</label>
                        <textarea value={adminParteObservaciones} onChange={e => setAdminParteObservaciones(e.target.value)}
                          placeholder="Información adicional sobre la suspensión..." rows={2}
                          className="w-full bg-white border border-slate-300 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none transition-all leading-relaxed" />
                      </div>
                    </div>
                  )}

                  {/* Firma Info */}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-wide mb-1">
                        <span>✍ Firma Digital en nombre de Docente</span>
                      </div>
                      {adminParteDocenteDni && (() => {
                        const d = usuarios.find(u => u.dni === adminParteDocenteDni);
                        return d ? (
                          <p className="text-sm font-bold text-slate-800">{d.nombre} {d.apellido} — <span className="text-[10px] text-slate-500 font-mono">Prof. de Educación Física</span></p>
                        ) : <p className="text-xs text-slate-400 italic">Seleccione un docente válido</p>;
                      })()}
                    </div>
                    <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-center self-start sm:self-center font-mono text-[9px] text-slate-500 shadow-sm">
                      <span className="block font-bold text-[8px] uppercase tracking-wider text-slate-400 mb-0.5">Cargado por Admin</span>
                      <span>{user.nombre} {user.apellido}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={`w-full text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer uppercase tracking-wider text-xs ${
                      adminParteEditingId ? 'bg-blue-600 hover:bg-blue-700' :
                      adminParteHuboClase === 'Sí' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    ✍ {adminParteEditingId ? 'Guardar Cambios y Actualizar Libro' : adminParteHuboClase === 'Sí' ? 'Registrar Parte y Guardar en Libro de Temas' : 'Registrar Acta de Clase Suspendida'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sección de Accesos Rápidos a Solicitudes y Actas */}
      <div className="bg-gradient-to-br from-primary-500/5 to-accent-500/5 p-6 rounded-3xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <CalendarRange className="text-primary-500" size={18} />
            Gestión de Solicitudes y Lectura de Actas
          </h4>
          <p className="text-slate-500 text-xs leading-relaxed max-w-2xl font-medium">
            Desde la sección de **Asistencia Mensual**, el Equipo de Conducción y los Preceptores pueden generar solicitudes de partes faltantes para docentes, seguir su estado de cumplimiento, y leer la totalidad de las actas de incidencias firmadas digitalmente por los profesores.
          </p>
        </div>
        <button
          onClick={() => window.location.hash = '#/asistencia-mensual'}
          className="bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs uppercase px-5 py-3 rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer shrink-0 self-start md:self-center"
        >
          Ir a Asistencia Mensual
        </button>
      </div>

      {/* Ventana Emergente de Progreso de Carga en Tiempo Real */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-500/10 text-accent-600 rounded-xl animate-pulse">
                  <Upload size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm font-display">Carga de Estudiantes</h3>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Procesamiento en tiempo real</p>
                </div>
              </div>
              {!uploadProgress.completed && (
                <span className="text-xs bg-accent-100 text-accent-700 font-extrabold px-2.5 py-1 rounded-full animate-pulse">
                  {uploadProgress.total > 0 ? Math.round((uploadProgress.current / uploadProgress.total) * 100) : 0}%
                </span>
              )}
            </div>

            {/* Progress and Stats */}
            <div className="p-6 space-y-4 border-b border-slate-100">
              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-accent-500 h-full transition-all duration-300 ease-out" 
                  style={{ width: `${uploadProgress.total > 0 ? (uploadProgress.current / uploadProgress.total) * 100 : 0}%` }}
                />
              </div>

              {/* Current action text */}
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-500">
                  {uploadProgress.completed 
                    ? 'Proceso finalizado' 
                    : `Procesando: ${uploadProgress.processingName || 'iniciando...'}`}
                </span>
                <span className="text-slate-700">
                  {uploadProgress.current} / {uploadProgress.total} registros
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2.5 pt-2 text-center text-xs font-bold font-sans">
                <div className="bg-emerald-50 border border-emerald-150 p-2 rounded-xl text-emerald-700">
                  <div className="text-lg">{uploadProgress.successCount}</div>
                  <div className="text-[9px] uppercase font-bold">Matriculados</div>
                </div>
                <div className="bg-amber-50 border border-amber-150 p-2 rounded-xl text-amber-700">
                  <div className="text-lg">{uploadProgress.warningCount}</div>
                  <div className="text-[9px] uppercase font-bold">Omitidos</div>
                </div>
                <div className="bg-rose-50 border border-rose-150 p-2 rounded-xl text-rose-700">
                  <div className="text-lg">{uploadProgress.errorCount}</div>
                  <div className="text-[9px] uppercase font-bold">Errores</div>
                </div>
              </div>
            </div>

            {/* Terminal Live Logs */}
            <div 
              id="upload-terminal" 
              className="p-4 bg-slate-950 flex-1 overflow-y-auto max-h-60 font-mono text-[10px] space-y-1.5 scrollbar-thin"
              style={{ minHeight: '150px' }}
            >
              {uploadProgress.logs.map((log, index) => (
                <div 
                  key={index} 
                  className={`leading-relaxed border-l-2 pl-2 ${
                    log.type === 'success' ? 'text-emerald-400 border-emerald-500' :
                    log.type === 'error' ? 'text-rose-400 border-rose-500' :
                    log.type === 'warning' ? 'text-amber-400 border-amber-500' :
                    'text-slate-350 border-slate-500'
                  }`}
                >
                  {log.text}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={!uploadProgress.completed}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  uploadProgress.completed 
                    ? 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer shadow-md' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {uploadProgress.completed ? 'Cerrar Ventana' : 'Matriculando...'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ventana Emergente de Progreso de Carga Masiva de Partes en Tiempo Real */}
      {showPartesUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 text-red-500 rounded-xl animate-pulse">
                  <Upload size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm font-display">Carga Masiva de Partes</h3>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Procesamiento en tiempo real</p>
                </div>
              </div>
              {!partesUploadProgress.completed && (
                <span className="text-xs bg-red-100 text-red-700 font-extrabold px-2.5 py-1 rounded-full animate-pulse">
                  {partesUploadProgress.total > 0 ? Math.round((partesUploadProgress.current / partesUploadProgress.total) * 100) : 0}%
                </span>
              )}
            </div>

            {/* Progress and Stats */}
            <div className="p-6 space-y-4 border-b border-slate-100">
              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-red-500 h-full transition-all duration-300 ease-out" 
                  style={{ width: `${partesUploadProgress.total > 0 ? (partesUploadProgress.current / partesUploadProgress.total) * 100 : 0}%` }}
                />
              </div>

              {/* Current action text */}
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-500">
                  {partesUploadProgress.completed 
                    ? 'Proceso finalizado' 
                    : `Procesando: ${partesUploadProgress.processingName || 'iniciando...'}`}
                </span>
                <span className="text-slate-700">
                  {partesUploadProgress.current} / {partesUploadProgress.total} registros
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 text-center text-xs font-bold font-sans">
                <div className="bg-emerald-50 border border-emerald-150 p-2 rounded-xl text-emerald-700">
                  <div className="text-lg">{partesUploadProgress.successCount}</div>
                  <div className="text-[9px] uppercase font-bold">Procesados con éxito</div>
                </div>
                <div className="bg-rose-50 border border-rose-150 p-2 rounded-xl text-rose-700">
                  <div className="text-lg">{partesUploadProgress.errorCount}</div>
                  <div className="text-[9px] uppercase font-bold">Errores</div>
                </div>
              </div>
            </div>

            {/* Terminal Live Logs */}
            <div 
              id="partes-upload-terminal" 
              className="p-4 bg-slate-950 flex-1 overflow-y-auto max-h-60 font-mono text-[10px] space-y-1.5 scrollbar-thin"
              style={{ minHeight: '150px' }}
            >
              {partesUploadProgress.logs.map((log, index) => (
                <div 
                  key={index} 
                  className={`leading-relaxed border-l-2 pl-2 ${
                    log.type === 'success' ? 'text-emerald-400 border-emerald-500' :
                    log.type === 'error' ? 'text-rose-400 border-rose-500' :
                    log.type === 'warning' ? 'text-amber-400 border-amber-500' :
                    'text-slate-350 border-slate-500'
                  }`}
                >
                  {log.text}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowPartesUploadModal(false)}
                disabled={!partesUploadProgress.completed}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  partesUploadProgress.completed 
                    ? 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer shadow-md' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {partesUploadProgress.completed ? 'Cerrar Ventana' : 'Procesando...'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ÉXITO AL REGISTRAR/ACTUALIZAR PARTE DESDE ADMIN */}
      {adminParteShowSuccessModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 relative overflow-hidden animate-zoom-in text-center animate-fade-in">
            {/* Glowing background decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent-500/5 rounded-full blur-xl -mr-6 -mt-6"></div>

            {/* Check/Success Icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-accent-50 border border-accent-200 flex items-center justify-center text-accent-600 mb-4 shadow-sm">
              <CheckCircle2 size={32} className="animate-pulse" />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 font-display">
              {adminParteSuccessModalTitle}
            </h3>
            <p className="text-xs text-slate-550 text-slate-500 mt-2.5 leading-relaxed font-semibold text-center font-sans">
              {adminParteSuccessModalDescription}
            </p>

            <button
              type="button"
              onClick={handleCloseAdminParteSuccessModal}
              className="mt-6 w-full bg-accent-500 hover:bg-accent-600 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-md shadow-accent-500/10 cursor-pointer active:scale-95 uppercase tracking-wider font-sans"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {activeTab === 'feriados_carga' && (
        <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
          <div className="glass-panel rounded-3xl p-6 border border-slate-200 shadow-lg bg-white">
            <h2 className="text-xl font-bold text-slate-900 font-display mb-4">Cargar Nuevo Feriado / Fecha Patria</h2>
            {feriadoSuccess && (
              <div className="mb-4 p-3 bg-accent-500/10 border border-accent-500/20 text-accent-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <CheckCircle2 size={14} />
                <span>{feriadoSuccess}</span>
              </div>
            )}
            <form onSubmit={handleFeriadoSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Fecha</label>
                <input type="date" value={feriadoFecha} onChange={(e) => setFeriadoFecha(e.target.value)} required className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary-500 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Descripción</label>
                <input type="text" value={feriadoDesc} onChange={(e) => setFeriadoDesc(e.target.value)} required placeholder="Ej: Revolución de Mayo" className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-500 transition-all" />
              </div>
              <div>
                <button type="submit" className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md cursor-pointer h-[38px]">
                  Agregar Feriado
                </button>
              </div>
            </form>
          </div>

          <div className="glass-panel rounded-3xl p-6 border border-slate-200 shadow-lg bg-white">
            <h2 className="text-xl font-bold text-slate-900 font-display mb-1">Cargar Receso de Invierno</h2>
            <p className="text-xs text-slate-500 mb-4">El rango completo quedará excluido de las planillas y de las solicitudes de asistencia.</p>
            <form onSubmit={handleRecesoSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Inicio</label>
                <input type="date" value={recesoInicio} onChange={(e) => setRecesoInicio(e.target.value)} required className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary-500 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Finalización</label>
                <input type="date" value={recesoFin} onChange={(e) => setRecesoFin(e.target.value)} min={recesoInicio || undefined} required className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary-500 transition-all" />
              </div>
              <div>
                <button type="submit" className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md cursor-pointer h-[38px]">
                  Agregar Receso
                </button>
              </div>
            </form>
          </div>
          
          <div className="glass-panel rounded-3xl p-6 border border-slate-200 shadow-lg bg-white">
            <h2 className="text-xl font-bold text-slate-900 font-display mb-4">Feriados Cargados</h2>
            {feriados && feriados.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs table-stack">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-650 font-bold uppercase">
                      <th className="py-3 px-3">Fecha</th>
                      <th className="py-3 px-3">Descripción</th>
                      <th className="py-3 px-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {feriados.map(f => (
                      <tr key={f.id} className="hover:bg-slate-50 text-slate-700 transition-colors">
                        <td data-label="Fecha" className="py-3 px-3 font-mono font-bold text-slate-900">{f.tipo === 'RECESO_INVIERNO' ? `${new Date(f.fechaInicio + 'T00:00:00').toLocaleDateString('es-AR')} al ${new Date(f.fechaFin + 'T00:00:00').toLocaleDateString('es-AR')}` : new Date(f.fecha + 'T00:00:00').toLocaleDateString('es-AR')}</td>
                        <td data-label="Descripción" className="py-3 px-3">{f.descripcion}</td>
                        <td data-label="Acciones" className="py-3 px-3 text-right">
                          <button onClick={() => eliminarFeriado(f.id)} className="p-1.5 text-red-500 hover:text-red-750 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer" title="Eliminar Feriado"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">No hay feriados cargados.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
