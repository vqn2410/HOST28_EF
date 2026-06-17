import React, { createContext, useState, useContext, useEffect } from 'react';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

const SchoolDataContext = createContext(null);

// Alumnos Semilla
const INITIAL_ALUMNOS = [
  // 1°1° - Turno Mañana
  { dni: "10001", nombre: "Álvarez, Martín", cursoOrigen: "1°1°", turno: "Mañana", cursoEF: "1°1°" },
  { dni: "10002", nombre: "Benítez, Camila", cursoOrigen: "1°1°", turno: "Mañana", cursoEF: "1°1°" },
  { dni: "10003", nombre: "Cardozo, Lucas", cursoOrigen: "1°1°", turno: "Mañana", cursoEF: "1°1°" },
  { dni: "10004", nombre: "Díaz, Florencia", cursoOrigen: "1°1°", turno: "Mañana", cursoEF: "1°1°" },
  
  // 1°2° - Turno Tarde
  { dni: "10101", nombre: "Herrera, Julieta", cursoOrigen: "1°2°", turno: "Tarde", cursoEF: "1°2°" },
  { dni: "10102", nombre: "Giménez, Ignacio", cursoOrigen: "1°2°", turno: "Tarde", cursoEF: "1°2°" },
  
  // 2°1° - Turno Mañana
  { dni: "20001", nombre: "Esquivel, Facundo", cursoOrigen: "2°1°", turno: "Mañana", cursoEF: "2°1°" },
  { dni: "20002", nombre: "Flores, Martina", cursoOrigen: "2°1°", turno: "Mañana", cursoEF: "2°1°" },
  
  // Alumnos externos asignados a Educación Física en un curso diferente
  { dni: "20003", nombre: "Gómez, Alan", cursoOrigen: "2°2°", turno: "Tarde", cursoEF: "1°1°" },
  { dni: "30001", nombre: "López, Sofía", cursoOrigen: "3°2°", turno: "Tarde", cursoEF: "1°1°" },
  
  // 3°2° - Turno Tarde
  { dni: "30002", nombre: "Rodríguez, Mateo", cursoOrigen: "3°2°", turno: "Tarde", cursoEF: "3°2°" },
  { dni: "30003", nombre: "Sánchez, Valentina", cursoOrigen: "3°2°", turno: "Tarde", cursoEF: "3°2°" },

  // 6°1° - Turno Mañana
  { dni: "60001", nombre: "Ortega, Gonzalo", cursoOrigen: "6°1°", turno: "Mañana", cursoEF: "6°1°" },
  { dni: "60002", nombre: "Peralta, Agostina", cursoOrigen: "6°1°", turno: "Mañana", cursoEF: "6°1°" }
];

// Configuración inicial de Cursos
const INITIAL_CURSOS_CONFIG = {
  "1°1°": {
    docenteDni: "333",
    docenteNombre: "Roberto Fernández",
    dias: [1, 3],
    horario: "08:00 - 09:30",
    turno: "Mañana"
  },
  "1°2°": {
    docenteDni: "333",
    docenteNombre: "Roberto Fernández",
    dias: [1, 3],
    horario: "13:30 - 15:00",
    turno: "Tarde"
  },
  "2°1°": {
    docenteDni: "333",
    docenteNombre: "Roberto Fernández",
    dias: [2, 4],
    horario: "09:40 - 11:10",
    turno: "Mañana"
  },
  "3°2°": {
    docenteDni: "333",
    docenteNombre: "Roberto Fernández",
    dias: [2, 4],
    horario: "13:30 - 15:00",
    turno: "Tarde"
  }
};

// Partes semilla
const INITIAL_PARTES = [
  {
    id: "p1",
    fecha: "2026-05-11",
    dia: "11",
    mes: "Mayo",
    claseNum: "1",
    unidad: "I",
    caracter: "Práctica",
    dinamica: "Grupal",
    observaciones: "Torcedura leve de tobillo de Lucas Cardozo, se confeccionó informe.",
    curso: "1°1°",
    turno: "Mañana",
    horario: "08:00 - 09:30",
    docenteNombre: "Roberto Fernández",
    huboClase: "Sí",
    motivoSuspension: "",
    asistencia: {
      "10001": "Presente",
      "10002": "Presente",
      "10003": "Ausente",
      "10004": "Presente",
      "20003": "Presente",
      "30001": "Presente"
    },
    contenido: "Iniciación al Voley: saques bajos, golpes de manos altas y recepción básica. Trabajo recreativo final.",
    actividades: "Ejercicios en parejas de golpe de manos altas, saques desde zona corta y mini-partidos de 3 vs 3.",
    firmaDigital: {
      apellido: "Fernández",
      nombre: "Roberto",
      cargo: "Prof. de Educación Física",
      correo: "roberto.fernandez@abc.gob.ar",
      fechaFirma: "2026-05-11T09:35:00.000Z"
    },
    firmaAutoridad: null
  },
  {
    id: "p2",
    fecha: "2026-05-13",
    dia: "13",
    mes: "Mayo",
    claseNum: "2",
    unidad: "I",
    caracter: "Práctica",
    dinamica: "Circuito de Estaciones",
    observaciones: "Clase sin incidentes.",
    curso: "1°1°",
    turno: "Mañana",
    horario: "08:00 - 09:30",
    docenteNombre: "Roberto Fernández",
    huboClase: "Sí",
    motivoSuspension: "",
    asistencia: {
      "10001": "Presente",
      "10002": "Presente",
      "10003": "Presente",
      "10004": "Presente",
      "20003": "Ausente",
      "30001": "Presente"
    },
    contenido: "Voley escolar: práctica formal de partidos, rotaciones y sistemas de puntuación simple.",
    actividades: "Ejercicios de rotación en cancha y partidos formales de 6 vs 6 aplicando reglas básicas.",
    firmaDigital: {
      apellido: "Fernández",
      nombre: "Roberto",
      cargo: "Prof. de Educación Física",
      correo: "roberto.fernandez@abc.gob.ar",
      fechaFirma: "2026-05-13T09:32:00.000Z"
    },
    firmaAutoridad: {
      apellido: "González",
      nombre: "Patricia",
      cargo: "Directora",
      correo: "patricia.gonzalez@abc.gob.ar",
      fechaFirma: "2026-05-14T10:00:00.000Z"
    }
  },
  {
    id: "p3",
    fecha: "2026-05-12",
    dia: "12",
    mes: "Mayo",
    claseNum: "1",
    unidad: "I",
    caracter: "Teórica-Práctica",
    dinamica: "Individual / Parejas",
    observaciones: "Buen desempeño del grupo en pista.",
    curso: "2°1°",
    turno: "Mañana",
    horario: "09:40 - 11:10",
    docenteNombre: "Roberto Fernández",
    huboClase: "Sí",
    motivoSuspension: "",
    asistencia: {
      "20001": "Presente",
      "20002": "Presente"
    },
    contenido: "Atletismo: velocidad (50 metros llanos), partidas bajas y técnicas de braceo.",
    actividades: "Trabajo en parejas para corregir braceo, salidas en velocidad desde taco bajo y carreras cronometradas.",
    firmaDigital: {
      apellido: "Fernández",
      nombre: "Roberto",
      cargo: "Prof. de Educación Física",
      correo: "roberto.fernandez@abc.gob.ar",
      fechaFirma: "2026-05-12T11:15:00.000Z"
    },
    firmaAutoridad: null
  }
];

// Solicitudes semilla de partes faltantes (generados por preceptor) para probar las notificaciones
const INITIAL_SOLICITUDES = [
  {
    id: "sol1",
    curso: "1°1°",
    fecha: "2026-05-20",
    solicitanteNombre: "Javier Martínez",
    solicitanteRol: "Preceptor",
    completada: false,
    fechaSolicitud: "2026-05-22T10:30:00.000Z",
    comentario: "Por favor registrar el parte correspondiente al día del censo nacional."
  },
  {
    id: "sol2",
    curso: "3°2°",
    fecha: "2026-05-28",
    solicitanteNombre: "Patricia González",
    solicitanteRol: "Directora",
    completada: false,
    fechaSolicitud: "2026-05-28T16:00:00.000Z",
    comentario: "Falta cargar la recuperación del día feriado."
  }
];

// Informes/Actas
const INITIAL_INFORMES = [
  {
    id: "inf1",
    estudianteDni: "10003",
    estudianteNombre: "Cardozo, Lucas",
    curso: "1°1°",
    titulo: "Esguince leve de tobillo durante práctica",
    contenido: "El alumno Lucas Cardozo sufrió una torcedura leve de tobillo derecho al pisar defectuosamente durante el partido de voley escolar. Se le aplicó hielo de inmediato y se dio aviso al preceptor de turno. Se retira caminando con dificultad leve.",
    docenteNombre: "Roberto Fernández",
    firmaDigital: {
      apellido: "Fernández",
      nombre: "Roberto",
      cargo: "Prof. de Educación Física",
      correo: "roberto.fernandez@abc.gob.ar",
      fechaFirma: "2026-05-11T09:40:00.000Z"
    }
  }
];

export const SchoolDataProvider = ({ children }) => {
  const [alumnos, setAlumnos] = useState([]);
  const [cursosConfig, setCursosConfig] = useState({});
  const [partes, setPartes] = useState([]);
  const [solicitudesFaltantes, setSolicitudesFaltantes] = useState([]);
  const [informes, setInformes] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sincronizar todos los datos con Firebase Firestore al montar el componente
  useEffect(() => {
    const fetchSchoolData = async () => {
      try {
        // 1. Cargar Alumnos
        const snapAlumnos = await getDocs(collection(db, "alumnos"));
        const listAlumnos = [];
        snapAlumnos.forEach(doc => listAlumnos.push(doc.data()));
        setAlumnos(listAlumnos);

        // 2. Cargar Cursos Config
        const snapCursos = await getDocs(collection(db, "cursosConfig"));
        const configMap = {};
        snapCursos.forEach(doc => {
          configMap[doc.id] = doc.data();
        });
        setCursosConfig(configMap);

        // 3. Cargar Partes
        const snapPartes = await getDocs(collection(db, "partes"));
        const listPartes = [];
        snapPartes.forEach(doc => listPartes.push(doc.data()));
        // Ordenar por fecha descendente
        listPartes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        setPartes(listPartes);

        // 4. Cargar Solicitudes
        const snapSolicitudes = await getDocs(collection(db, "solicitudes"));
        const listSolicitudes = [];
        snapSolicitudes.forEach(doc => listSolicitudes.push(doc.data()));
        listSolicitudes.sort((a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud));
        setSolicitudesFaltantes(listSolicitudes);

        // 5. Cargar Informes
        const snapInformes = await getDocs(collection(db, "informes"));
        const listInformes = [];
        snapInformes.forEach(doc => listInformes.push(doc.data()));
        setInformes(listInformes);

        // 6. Cargar Notificaciones
        const snapNotif = await getDocs(collection(db, "notificaciones"));
        const listNotif = [];
        snapNotif.forEach(doc => listNotif.push(doc.data()));
        listNotif.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
        setNotificaciones(listNotif);

      } catch (error) {
        console.error("Error al cargar datos escolares desde Firebase:", error);
        
        // Fallback robusto a localStorage / Seeds
        const localAlumnos = localStorage.getItem('host28_alumnos');
        setAlumnos(localAlumnos ? JSON.parse(localAlumnos) : INITIAL_ALUMNOS);

        const localCursos = localStorage.getItem('host28_cursos_config');
        setCursosConfig(localCursos ? JSON.parse(localCursos) : INITIAL_CURSOS_CONFIG);

        const localPartes = localStorage.getItem('host28_partes');
        setPartes(localPartes ? JSON.parse(localPartes) : INITIAL_PARTES);

        const localSolicitudes = localStorage.getItem('host28_solicitudes');
        setSolicitudesFaltantes(localSolicitudes ? JSON.parse(localSolicitudes) : INITIAL_SOLICITUDES);

        const localInformes = localStorage.getItem('host28_informes');
        setInformes(localInformes ? JSON.parse(localInformes) : INITIAL_INFORMES);

        const localNotificaciones = localStorage.getItem('host28_notificaciones');
        setNotificaciones(localNotificaciones ? JSON.parse(localNotificaciones) : []);
      } finally {
        setLoading(false);
      }
    };

    fetchSchoolData();
  }, []);

  // Backups locales reactivos en LocalStorage
  useEffect(() => {
    if (alumnos.length > 0) localStorage.setItem('host28_alumnos', JSON.stringify(alumnos));
  }, [alumnos]);

  useEffect(() => {
    if (Object.keys(cursosConfig).length > 0) localStorage.setItem('host28_cursos_config', JSON.stringify(cursosConfig));
  }, [cursosConfig]);

  useEffect(() => {
    if (partes.length > 0) localStorage.setItem('host28_partes', JSON.stringify(partes));
  }, [partes]);

  useEffect(() => {
    if (solicitudesFaltantes.length > 0) localStorage.setItem('host28_solicitudes', JSON.stringify(solicitudesFaltantes));
  }, [solicitudesFaltantes]);

  useEffect(() => {
    if (informes.length > 0) localStorage.setItem('host28_informes', JSON.stringify(informes));
  }, [informes]);

  useEffect(() => {
    if (notificaciones.length > 0) localStorage.setItem('host28_notificaciones', JSON.stringify(notificaciones));
  }, [notificaciones]);


  const agregarEstudiante = async (nuevoEstudiante) => {
    const studentObj = {
      ...nuevoEstudiante,
      cursoEF: nuevoEstudiante.cursoEF || nuevoEstudiante.cursoOrigen
    };
    try {
      await setDoc(doc(db, "alumnos", studentObj.dni), studentObj);
      setAlumnos((prev) => [...prev, studentObj]);
    } catch (error) {
      console.error("Error al agregar estudiante en Firebase:", error);
      // Fallback
      setAlumnos((prev) => [...prev, studentObj]);
    }
  };

  const agregarEstudiantesBatch = async (nuevosEstudiantes) => {
    const studentObjs = nuevosEstudiantes.map(nuevoEstudiante => ({
      ...nuevoEstudiante,
      cursoEF: nuevoEstudiante.cursoEF || nuevoEstudiante.cursoOrigen
    }));
    try {
      await Promise.all(studentObjs.map(studentObj => setDoc(doc(db, "alumnos", studentObj.dni), studentObj)));
      setAlumnos((prev) => {
        const prevFiltered = prev.filter(p => !studentObjs.some(s => s.dni === p.dni));
        return [...prevFiltered, ...studentObjs];
      });
    } catch (error) {
      console.error("Error al agregar estudiantes en lote en Firebase:", error);
      setAlumnos((prev) => {
        const prevFiltered = prev.filter(p => !studentObjs.some(s => s.dni === p.dni));
        return [...prevFiltered, ...studentObjs];
      });
    }
  };

  const actualizarEstudiante = async (estudianteDni, datosActualizados) => {
    const studentObj = {
      ...datosActualizados,
      cursoEF: datosActualizados.cursoEF || datosActualizados.cursoOrigen
    };
    try {
      await setDoc(doc(db, "alumnos", estudianteDni), studentObj, { merge: true });
      setAlumnos(prev => prev.map(a => a.dni === estudianteDni ? studentObj : a));
    } catch (error) {
      console.error("Error al actualizar estudiante en Firebase:", error);
      // Fallback
      setAlumnos(prev => prev.map(a => a.dni === estudianteDni ? studentObj : a));
    }
  };

  const eliminarEstudiante = async (estudianteDni) => {
    try {
      await deleteDoc(doc(db, "alumnos", estudianteDni));
      setAlumnos(prev => prev.filter(a => a.dni !== estudianteDni));
    } catch (error) {
      console.error("Error al eliminar estudiante en Firebase:", error);
      // Fallback
      setAlumnos(prev => prev.filter(a => a.dni !== estudianteDni));
    }
  };

  const guardarParteEF = async (nuevoParte) => {
    const id = `p_${Date.now()}`;
    const parteObj = { id, ...nuevoParte };

    const notifId = `notif_${Date.now()}`;
    const fechaFormateada = new Date(nuevoParte.fecha + 'T00:00:00').toLocaleDateString('es-AR');
    const notifObj = {
      id: notifId,
      curso: nuevoParte.curso,
      fecha: nuevoParte.fecha,
      mensaje: `El Prof. ${nuevoParte.firmaDigital.nombre} ${nuevoParte.firmaDigital.apellido} ha cargado la asistencia de ${nuevoParte.curso} (${nuevoParte.turno}) para la fecha ${fechaFormateada}.`,
      tipo: 'asistencia_cargada',
      fechaCreacion: new Date().toISOString(),
      leidaPor: []
    };

    // Actualizar estados locales y localstorage inmediatamente para garantizar la reactividad local robusta
    setPartes((prev) => [parteObj, ...prev]);
    setNotificaciones((prev) => [notifObj, ...prev]);
    setSolicitudesFaltantes((prev) => {
      return prev.map((s) => {
        if (s.curso === nuevoParte.curso && s.fecha === nuevoParte.fecha) {
          return { ...s, completada: true };
        }
        return s;
      });
    });

    // Intentar persistencia asíncrona en Firebase Firestore
    try {
      await setDoc(doc(db, "partes", id), parteObj);
      await setDoc(doc(db, "notificaciones", notifId), notifObj);

      const matchingSol = solicitudesFaltantes.find(
        s => s.curso === nuevoParte.curso && s.fecha === nuevoParte.fecha
      );
      if (matchingSol) {
        await setDoc(doc(db, "solicitudes", matchingSol.id), { ...matchingSol, completada: true });
      }
    } catch (error) {
      console.error("Error al guardar el parte en Firebase (se mantiene copia local robusta):", error);
    }
  };

  const actualizarParteEF = async (parteId, datosActualizados) => {
    try {
      await setDoc(doc(db, "partes", parteId), datosActualizados, { merge: true });
      setPartes((prev) => prev.map((p) => (p.id === parteId ? { ...p, ...datosActualizados } : p)));
    } catch (error) {
      console.error("Error al actualizar el parte en Firebase:", error);
      setPartes((prev) => prev.map((p) => (p.id === parteId ? { ...p, ...datosActualizados } : p)));
    }
  };

  const eliminarParteEF = async (parteId) => {
    try {
      await deleteDoc(doc(db, "partes", parteId));
      setPartes((prev) => prev.filter((p) => p.id !== parteId));
    } catch (error) {
      console.error("Error al eliminar el parte en Firebase:", error);
      setPartes((prev) => prev.filter((p) => p.id !== parteId));
    }
  };

  const guardarInforme = async (nuevoInforme) => {
    const id = `inf_${Date.now()}`;
    const informeObj = { id, ...nuevoInforme };
    try {
      await setDoc(doc(db, "informes", id), informeObj);
      setInformes((prev) => [informeObj, ...prev]);
    } catch (error) {
      console.error("Error al guardar informe en Firebase:", error);
      // Fallback
      setInformes((prev) => [informeObj, ...prev]);
    }
  };

  const firmarAutoridadParte = async (parteId, firmaAutoridadObj) => {
    try {
      await updateDoc(doc(db, "partes", parteId), { firmaAutoridad: firmaAutoridadObj });
      setPartes((prev) =>
        prev.map((p) =>
          p.id === parteId
            ? { ...p, firmaAutoridad: firmaAutoridadObj }
            : p
        )
      );
    } catch (error) {
      console.error("Error al firmar parte en Firebase:", error);
      // Fallback
      setPartes((prev) =>
        prev.map((p) =>
          p.id === parteId
            ? { ...p, firmaAutoridad: firmaAutoridadObj }
            : p
        )
      );
    }
  };

  const actualizarCursoConfig = async (curso, config) => {
    try {
      await setDoc(doc(db, "cursosConfig", curso), config);
      setCursosConfig((prev) => ({
        ...prev,
        [curso]: config
      }));
    } catch (error) {
      console.error("Error al actualizar configuración de curso en Firebase:", error);
      // Fallback
      setCursosConfig((prev) => ({
        ...prev,
        [curso]: config
      }));
    }
  };

  const eliminarCursoConfig = async (curso) => {
    try {
      await deleteDoc(doc(db, "cursosConfig", curso));
      setCursosConfig((prev) => {
        const copy = { ...prev };
        delete copy[curso];
        return copy;
      });
    } catch (error) {
      console.error("Error al eliminar configuración de curso en Firebase:", error);
      // Fallback
      setCursosConfig((prev) => {
        const copy = { ...prev };
        delete copy[curso];
        return copy;
      });
    }
  };

  const agregarSolicitudParteFaltante = async (curso, fecha, solicitanteNombre, solicitanteRol, comentario = "") => {
    const id = `sol_${Date.now()}`;
    const solObj = {
      id,
      curso,
      fecha,
      solicitanteNombre,
      solicitanteRol,
      completada: false,
      fechaSolicitud: new Date().toISOString(),
      comentario
    };
    try {
      await setDoc(doc(db, "solicitudes", id), solObj);
      setSolicitudesFaltantes((prev) => [solObj, ...prev]);
    } catch (error) {
      console.error("Error al crear solicitud en Firebase:", error);
      // Fallback
      setSolicitudesFaltantes((prev) => [solObj, ...prev]);
    }
  };

  const marcarNotificacionLeida = async (notifId, userDni) => {
    try {
      const notifRef = doc(db, "notificaciones", notifId);
      const notif = notificaciones.find(n => n.id === notifId);
      if (notif) {
        const updatedLeidaPor = [...(notif.leidaPor || []), userDni];
        await updateDoc(notifRef, { leidaPor: updatedLeidaPor });
        setNotificaciones((prev) =>
          prev.map((n) =>
            n.id === notifId ? { ...n, leidaPor: updatedLeidaPor } : n
          )
        );
      }
    } catch (error) {
      console.error("Error al marcar notificación como leída en Firebase:", error);
      // Fallback
      setNotificaciones((prev) =>
        prev.map((n) =>
          n.id === notifId ? { ...n, leidaPor: [...(n.leidaPor || []), userDni] } : n
        )
      );
    }
  };

  return (
    <SchoolDataContext.Provider value={{
      alumnos,
      cursosConfig,
      partes,
      solicitudesFaltantes,
      informes,
      notificaciones,
      agregarEstudiante,
      agregarEstudiantesBatch,
      actualizarEstudiante,
      eliminarEstudiante,
      guardarParteEF,
      actualizarParteEF,
      eliminarParteEF,
      guardarInforme,
      firmarAutoridadParte,
      actualizarCursoConfig,
      eliminarCursoConfig,
      agregarSolicitudParteFaltante,
      marcarNotificacionLeida,
      loading
    }}>
      {children}
    </SchoolDataContext.Provider>
  );
};

export const useSchoolData = () => {
  const context = useContext(SchoolDataContext);
  if (!context) {
    throw new Error('useSchoolData debe usarse dentro de un SchoolDataProvider');
  }
  return context;
};
