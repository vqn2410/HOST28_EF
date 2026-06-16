import React, { useState, useMemo } from 'react';
import { useSchoolData } from '../context/SchoolDataContext';
import { useAuth } from '../context/AuthContext';
import { UserPlus, GraduationCap, CheckCircle2, AlertTriangle, Users, BookOpen, CalendarRange, Edit, Trash2, Upload, Download, Search } from 'lucide-react';

const AdminPanel = () => {
  const { alumnos, agregarEstudiante, agregarEstudiantesBatch, actualizarEstudiante, eliminarEstudiante, cursosConfig, actualizarCursoConfig, eliminarCursoConfig, solicitudesFaltantes = [], informes = [] } = useSchoolData();
  const { user, usuarios, registrarUsuario, actualizarUsuario, eliminarUsuario } = useAuth();

  // Estados para el modo de edición
  const [editingUsrDni, setEditingUsrDni] = useState(null);
  const [editingEstDni, setEditingEstDni] = useState(null);
  const [activeTab, setActiveTab] = useState('usuarios_carga');

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
    noCursaEF: false
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
        const turnoCalculado = determinarTurno(initialCurso);
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
        dias: [1, 3],
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

    const { nombre, dni, cursoOrigen, turno, asignarDiferenteEF, cursoEF, noCursaEF } = estForm;

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

    const cursoEFDefinitivo = noCursaEF ? 'No cursa' : (asignarDiferenteEF ? cursoEF : cursoOrigen);

    const datosEstudiante = {
      nombre: nombre.trim(),
      dni: dni.trim(),
      cursoOrigen,
      turno,
      cursoEF: cursoEFDefinitivo,
      noCursaEF: !!noCursaEF
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
      noCursaEF: false
    });
  };

  const descargarCSVTemplate = () => {
    const csvContent = "\uFEFF" + "nombre,dni,cursoOrigen,cursoEF\n" +
      "Perez Juan,12345678,1°1°,1°1°\n" +
      "Gomez Maria,87654321,1°2°,1°2°\n" +
      "Rodriguez Luis,45678901,2°1°,1°1°\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "ejemplo_matricula_estudiantes.csv");
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
        const studentObj = {
          nombre,
          dni,
          cursoOrigen,
          turno: turnoCalculado,
          cursoEF: cursoEF || cursoOrigen,
          noCursaEF: noCursaEF
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

  const tabs = [
    { id: 'usuarios_carga', label: 'Carga de Usuarios', icon: UserPlus, color: 'text-primary-500' },
    { id: 'usuarios_lista', label: 'Personal Registrado', icon: Users, color: 'text-primary-500' },
    { id: 'estudiantes_carga', label: 'Matrícula Estudiantes', icon: GraduationCap, color: 'text-accent-500' },
    { id: 'estudiantes_lista', label: 'Estudiantes Matriculados', icon: BookOpen, color: 'text-accent-500' },
    { id: 'cursos_carga', label: 'Asignación Curricular EF', icon: CalendarRange, color: 'text-yellow-600' },
    { id: 'cursos_lista', label: 'Cursos de Educación Física', icon: CalendarRange, color: 'text-yellow-600' }
  ];

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

      {/* Selector de Pantallas */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
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
                  {usuariosOrdenados.map((u, i) => (
                    <tr key={i} className="hover:bg-slate-50 text-slate-700">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{u.apellido}, {u.nombre}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{u.dni}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{u.correo}</td>
                      <td className="py-2.5 px-3 text-right">
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
                              setActiveTab('usuarios_carga');
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
                                asignarDiferenteEF: checked ? false : estForm.asignarDiferenteEF
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
                                onChange={e => setEstForm({...estForm, cursoEF: e.target.value})}
                                className="w-full bg-white border border-accent-500/20 focus:border-accent-500 rounded-lg px-2.5 py-1 text-xs text-slate-855 focus:outline-none font-bold"
                              >
                                {CURSOS.map(c => <option key={c} value={c}>Curso {c}</option>)}
                              </select>
                            </div>
                          )}
                        </>
                      )}
                    </div>

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
                              noCursaEF: false
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
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="text-accent-500" size={18} />
                <h3 className="text-lg font-bold text-slate-800 font-display">Estudiantes Matriculados</h3>
              </div>
              <span className="text-[10px] text-slate-500 uppercase bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-bold">Vite Live State</span>
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
                  {alumnosFiltradosYOrdenados.map((a, i) => (
                    <tr key={i} className="hover:bg-slate-50 text-slate-700">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{a.nombre}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{a.dni}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-700">{a.cursoOrigen}</td>
                      <td className="py-2.5 px-3 text-slate-600">{a.turno}</td>
                      <td className="py-2.5 px-3 text-right">
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
                      </td>
                      <td className="py-2.5 px-3 text-center">
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
                                noCursaEF: !!a.noCursaEF
                              });
                              setEstError('');
                              setEstSuccess('');
                              setActiveTab('estudiantes_carga');
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
              <table className="w-full text-left border-collapse text-xs">
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
                        <td className="py-2.5 px-3 font-extrabold text-slate-900">{curso}</td>
                        <td className="py-2.5 px-3 font-semibold text-primary-600">{c.docenteNombre}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-600">
                          <span className="inline-block bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px]">
                            {diasLabel}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">{c.horario}</td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                handleCursoConfigChange(curso);
                                setActiveTab('cursos_carga');
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
    </div>
  );
};

export default AdminPanel;
