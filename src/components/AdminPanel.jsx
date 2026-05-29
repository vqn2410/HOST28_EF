import React, { useState, useMemo } from 'react';
import { useSchoolData } from '../context/SchoolDataContext';
import { useAuth } from '../context/AuthContext';
import { UserPlus, GraduationCap, CheckCircle2, AlertTriangle, Users, BookOpen, CalendarRange, Edit, Trash2 } from 'lucide-react';

const AdminPanel = () => {
  const { alumnos, agregarEstudiante, actualizarEstudiante, eliminarEstudiante, cursosConfig, actualizarCursoConfig, solicitudesFaltantes = [], informes = [] } = useSchoolData();
  const { user, usuarios, registrarUsuario, actualizarUsuario, eliminarUsuario } = useAuth();

  // Estados para el modo de edición
  const [editingUsrDni, setEditingUsrDni] = useState(null);
  const [editingEstDni, setEditingEstDni] = useState(null);


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
  const [estForm, setEstForm] = useState({
    apellido: '',
    nombre: '',
    dni: '',
    cursoOrigen: '1°1°',
    turno: 'Mañana',
    asignarDiferenteEF: false,
    cursoEF: '1°1°'
  });
  const [estError, setEstError] = useState('');
  const [estSuccess, setEstSuccess] = useState('');

  // Estados del Formulario de Configuración de Cursos EF (con turno auto-calculado)
  const [cursoConfigForm, setCursoConfigForm] = useState({
    curso: '1°1°',
    docenteDni: '',
    dias: [1, 3],
    horario: '08:00 - 09:30',
    turno: 'Mañana'
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

  React.useEffect(() => {
    if (docentesDisponibles.length > 0 && !cursoConfigForm.docenteDni) {
      setCursoConfigForm(prev => ({
        ...prev,
        docenteDni: docentesDisponibles[0].dni
      }));
    }
  }, [docentesDisponibles, cursoConfigForm.docenteDni]);

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
    const turnoCalculado = determinarTurno(cursoValue);
    const horarioEstimado = turnoCalculado === 'Mañana' ? '08:00 - 09:30' : '13:30 - 15:00';
    setCursoConfigForm(prev => ({
      ...prev,
      curso: cursoValue,
      turno: turnoCalculado,
      horario: horarioEstimado
    }));
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

    const { apellido, nombre, dni, cursoOrigen, turno, asignarDiferenteEF, cursoEF } = estForm;

    if (!apellido.trim() || !nombre.trim() || !dni.trim() || !cursoOrigen || !turno) {
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

    const cursoEFDefinitivo = asignarDiferenteEF ? cursoEF : cursoOrigen;

    const datosEstudiante = {
      apellido: apellido.trim(),
      nombre: nombre.trim(),
      dni: dni.trim(),
      cursoOrigen,
      turno,
      cursoEF: cursoEFDefinitivo
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
      setEstSuccess(`¡Estudiante "${nombre} ${apellido}" actualizado con éxito!`);
      setEditingEstDni(null);
    } else {
      agregarEstudiante(datosEstudiante);
      setEstSuccess(`¡Estudiante "${nombre} ${apellido}" matriculado con éxito!`);
    }

    setEstForm({
      apellido: '',
      nombre: '',
      dni: '',
      cursoOrigen: '1°1°',
      turno: 'Mañana',
      asignarDiferenteEF: false,
      cursoEF: '1°1°'
    });
  };

  // 3. Manejo de Carga de Configuración de Cursos EF
  const handleCursoConfigSubmit = (e) => {
    e.preventDefault();
    setCursoConfigError('');
    setCursoConfigSuccess('');

    const { curso, docenteDni, dias, horario, turno } = cursoConfigForm;

    if (!curso || !docenteDni || dias.length === 0 || !horario.trim() || !turno) {
      setCursoConfigError("Todos los campos son obligatorios. Seleccione al menos un día de clase.");
      return;
    }

    const docente = docentesDisponibles.find(d => d.dni === docenteDni);
    if (!docente) {
      setCursoConfigError("El docente seleccionado no es válido o no está registrado.");
      return;
    }

    const nuevaConfig = {
      docenteDni,
      docenteNombre: `${docente.nombre} ${docente.apellido}`,
      dias: dias.sort((a,b) => a - b),
      horario: horario.trim(),
      turno
    };

    actualizarCursoConfig(curso, nuevaConfig);
    setCursoConfigSuccess(`¡Curso ${curso} configurado con éxito!`);
  };

  const handleDiaCheckboxChange = (diaValue, isChecked) => {
    setCursoConfigForm(prev => {
      let nuevosDias = [...prev.dias];
      if (isChecked) {
        if (!nuevosDias.includes(diaValue)) nuevosDias.push(diaValue);
      } else {
        nuevosDias = nuevosDias.filter(d => d !== diaValue);
      }
      return { ...prev, dias: nuevosDias };
    });
  };

  return (
    <div className="space-y-10 py-6 max-w-7xl mx-auto px-4">
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
            <span>Alumnos: <strong className="text-slate-900">{alumnos.length}</strong></span>
          </div>
          <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5">
            <CalendarRange className="text-primary-500" size={14} />
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

      {/* Formularios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
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
                  <label className="block text-[10px] font-bold text-slate-650 text-slate-600 uppercase mb-1">F. Nacimiento</label>
                  <input
                    type="date"
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
                  className="w-full bg-white border border-slate-300 focus:border-primary-500 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
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
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[10px] font-bold text-slate-700 max-h-32 overflow-y-auto">
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

            <form onSubmit={handleEstSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nombre</label>
                  <input
                    type="text"
                    value={estForm.nombre}
                    onChange={e => setEstForm({...estForm, nombre: e.target.value})}
                    placeholder="Lucas"
                    className="w-full bg-white border border-slate-300 focus:border-accent-500 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Apellido</label>
                  <input
                    type="text"
                    value={estForm.apellido}
                    onChange={e => setEstForm({...estForm, apellido: e.target.value})}
                    placeholder="Cardozo"
                    className="w-full bg-white border border-slate-300 focus:border-accent-500 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                </div>
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

              <div className="pt-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-700 leading-tight">
                    ¿Cursada EF Alternativa?
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
                      onChange={e => setEstForm({...estForm, cursoEF: e.target.value})}
                      className="w-full bg-white border border-accent-500/20 focus:border-accent-500 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none font-bold"
                    >
                      {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {editingEstDni && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEstDni(null);
                      setEstForm({
                        apellido: '',
                        nombre: '',
                        dni: '',
                        cursoOrigen: '1°1°',
                        turno: 'Mañana',
                        asignarDiferenteEF: false,
                        cursoEF: '1°1°'
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
          </div>
        </div>

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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Horario Cursada</label>
                  <input
                    type="text"
                    value={cursoConfigForm.horario}
                    onChange={e => setCursoConfigForm({...cursoConfigForm, horario: e.target.value})}
                    placeholder="08:00 - 09:30"
                    className="w-full bg-white border border-slate-300 focus:border-primary-500 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-655 text-slate-605 text-slate-600 uppercase mb-1">Turno *(Auto)</label>
                  <input
                    type="text"
                    value={cursoConfigForm.turno}
                    disabled
                    className="w-full bg-slate-50 border border-slate-200 text-slate-500 rounded-lg px-3 py-1.5 text-xs font-bold cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">Días de Cursada Semanal</label>
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[10px] text-slate-700 font-bold">
                  {DIAS_SEMANA.map(dia => {
                    const isChecked = cursoConfigForm.dias.includes(dia.value);
                    return (
                      <label key={dia.value} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => handleDiaCheckboxChange(dia.value, e.target.checked)}
                          className="rounded text-primary-500 focus:ring-primary-500 cursor-pointer w-3.5 h-3.5 border-slate-300"
                        />
                        <span>{dia.label}</span>
                      </label>
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

      {/* Tablas de Datos */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pt-4">
        
        {/* Tabla Configuración Cursos */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CalendarRange className="text-primary-500" size={18} />
              <h3 className="text-lg font-bold text-slate-800 font-display">Cursos de Educación Física</h3>
            </div>
            <span className="text-[10px] text-slate-500 uppercase bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-bold font-sans">Consola</span>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                  <th className="py-2.5 px-3">Curso</th>
                  <th className="py-2.5 px-3">Docente</th>
                  <th className="py-2.5 px-3">Días de Clase</th>
                  <th className="py-2.5 px-3 text-right">Horario</th>
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
                      <td className="py-2.5 px-3 font-extrabold text-slate-900">{curso}</td>
                      <td className="py-2.5 px-3 font-semibold text-primary-600">{c.docenteNombre}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-600">
                        <span className="inline-block bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px]">
                          {diasLabel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">{c.horario}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla Personal */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="text-primary-500" size={18} />
              <h3 className="text-lg font-bold text-slate-800 font-display">Personal Registrado</h3>
            </div>
            <span className="text-[10px] text-slate-500 uppercase bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-bold">Vite Live State</span>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left border-collapse text-xs">
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
                {usuarios.map((u, i) => (
                  <tr key={i} className="hover:bg-slate-50 text-slate-700">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{u.apellido}, {u.nombre}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{u.dni}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{u.correo}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        u.rol === "Equipo de Conducción" ? "bg-red-50 text-red-700 border border-red-200" :
                        u.rol === "Preceptor" ? "bg-primary-50 text-primary-700 border border-primary-200" :
                        "bg-accent-50 text-accent-700 border border-accent-200"
                      }`}>
                        {u.rol === 'Docente' && u.situacionRevista ? `${u.rol} (${u.situacionRevista})` : u.rol}
                      </span>
                      {u.cursosAsignados && u.cursosAsignados.length > 0 && (
                        <div className="text-[9px] text-slate-500 font-semibold mt-1">
                          Cursos: {u.cursosAsignados.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
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

        {/* Tabla Alumnos */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BookOpen className="text-accent-500" size={18} />
              <h3 className="text-lg font-bold text-slate-800 font-display">Estudiantes Matriculados</h3>
            </div>
            <span className="text-[10px] text-slate-500 uppercase bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-bold">Vite Live State</span>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left border-collapse text-xs">
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
                {alumnos.map((a, i) => (
                  <tr key={i} className="hover:bg-slate-50 text-slate-700">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{a.apellido}, {a.nombre}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{a.dni}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-700">{a.cursoOrigen}</td>
                    <td className="py-2.5 px-3 text-slate-600">{a.turno}</td>
                    <td className="py-2.5 px-3 text-right">
                      {a.cursoEF !== a.cursoOrigen ? (
                        <span className="inline-block bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded text-[9px] font-bold">
                          {a.cursoEF} (Externo)
                        </span>
                      ) : (
                        <span className="inline-block bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold">
                          {a.cursoEF}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setEditingEstDni(a.dni);
                            setEstForm({
                              apellido: a.apellido,
                              nombre: a.nombre,
                              dni: a.dni,
                              cursoOrigen: a.cursoOrigen,
                              turno: a.turno,
                              asignarDiferenteEF: a.cursoEF !== a.cursoOrigen,
                              cursoEF: a.cursoEF
                            });
                            setEstError('');
                            setEstSuccess('');
                          }}
                          className="p-1 text-accent-500 hover:text-accent-700 hover:bg-accent-500/10 rounded transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Está seguro de que desea eliminar al alumno ${a.nombre} ${a.apellido} (DNI: ${a.dni})?`)) {
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
    </div>
  );
};

export default AdminPanel;
