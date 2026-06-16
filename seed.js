import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Configuración de Firebase provista por el usuario
const firebaseConfig = {
  apiKey: "AIzaSyBPxiQ9fy-45q3clg-8oLoQTd8PneVIE10",
  authDomain: "partesees28.firebaseapp.com",
  projectId: "partesees28",
  storageBucket: "partesees28.firebasestorage.app",
  messagingSenderId: "769365076413",
  appId: "1:769365076413:web:a5dd2081c455a1f7cdcad4",
  measurementId: "G-HXK6B5L6C0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Usuarios Semilla
const SEED_USERS = [
  {
    dni: "43797089",
    password: "Cambia2410@",
    apellido: "Administrador",
    nombre: "Usuario",
    correo: "admin@abc.gob.ar",
    rol: "Equipo de Conducción",
  },
  {
    dni: "111",
    password: "111",
    apellido: "González",
    nombre: "Patricia",
    correo: "patricia.gonzalez@abc.gob.ar",
    rol: "Equipo de Conducción",
  },
  {
    dni: "222",
    password: "222",
    apellido: "Martínez",
    nombre: "Javier",
    correo: "javier.martinez@abc.gob.ar",
    rol: "Preceptor",
  },
  {
    dni: "333",
    password: "333",
    apellido: "Fernández",
    nombre: "Roberto",
    correo: "roberto.fernandez@abc.gob.ar",
    rol: "Docente",
    cursosAsignados: ["1°1°", "2°1°", "3°2°"],
    situacionRevista: "Titular"
  }
];

// Alumnos Semilla
const INITIAL_ALUMNOS = [
  { dni: "10001", nombre: "Álvarez, Martín", cursoOrigen: "1°1°", turno: "Mañana", cursoEF: "1°1°" },
  { dni: "10002", nombre: "Benítez, Camila", cursoOrigen: "1°1°", turno: "Mañana", cursoEF: "1°1°" },
  { dni: "10003", nombre: "Cardozo, Lucas", cursoOrigen: "1°1°", turno: "Mañana", cursoEF: "1°1°" },
  { dni: "10004", nombre: "Díaz, Florencia", cursoOrigen: "1°1°", turno: "Mañana", cursoEF: "1°1°" },
  { dni: "10101", nombre: "Herrera, Julieta", cursoOrigen: "1°2°", turno: "Tarde", cursoEF: "1°2°" },
  { dni: "10102", nombre: "Giménez, Ignacio", cursoOrigen: "1°2°", turno: "Tarde", cursoEF: "1°2°" },
  { dni: "20001", nombre: "Esquivel, Facundo", cursoOrigen: "2°1°", turno: "Mañana", cursoEF: "2°1°" },
  { dni: "20002", nombre: "Flores, Martina", cursoOrigen: "2°1°", turno: "Mañana", cursoEF: "2°1°" },
  { dni: "20003", nombre: "Gómez, Alan", cursoOrigen: "2°2°", turno: "Tarde", cursoEF: "1°1°" },
  { dni: "30001", nombre: "López, Sofía", cursoOrigen: "3°2°", turno: "Tarde", cursoEF: "1°1°" },
  { dni: "30002", nombre: "Rodríguez, Mateo", cursoOrigen: "3°2°", turno: "Tarde", cursoEF: "3°2°" },
  { dni: "30003", nombre: "Sánchez, Valentina", cursoOrigen: "3°2°", turno: "Tarde", cursoEF: "3°2°" },
  { dni: "60001", nombre: "Ortega, Gonzalo", cursoOrigen: "6°1°", turno: "Mañana", cursoEF: "6°1°" },
  { dni: "60002", nombre: "Peralta, Agostina", cursoOrigen: "6°1°", turno: "Mañana", cursoEF: "6°1°" }
];

// Configuración de Cursos
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

// Partes
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

// Solicitudes Semilla
const INITIAL_SOLICITUDES = [
  {
    id: "sol1",
    curso: "1°1°",
    fecha: "2026-05-20",
    solicitanteNombre: "Javier Martínez",
    solicitanteRol: "Preceptor",
    completada: false,
    fechaSolicitud: "2026-05-22T10:30:00.000Z"
  },
  {
    id: "sol2",
    curso: "3°2°",
    fecha: "2026-05-28",
    solicitanteNombre: "Patricia González",
    solicitanteRol: "Directora",
    completada: false,
    fechaSolicitud: "2026-05-28T16:00:00.000Z"
  }
];

// Informes Semilla
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

async function runSeeding() {
  console.log("=============================================================");
  console.log("Iniciando la siembra oficial (seeding) en Firebase Firestore...");
  console.log("=============================================================");

  try {
    // 1. Usuarios
    console.log("-> Creando colección 'usuarios' y sembrando perfiles...");
    for (const u of SEED_USERS) {
      await setDoc(doc(db, "usuarios", u.dni), u);
      console.log(`   [OK] Usuario: ${u.nombre} ${u.apellido}`);
    }

    // 2. Alumnos
    console.log("-> Creando colección 'alumnos' y sembrando matrícula...");
    for (const a of INITIAL_ALUMNOS) {
      await setDoc(doc(db, "alumnos", a.dni), a);
    }
    console.log(`   [OK] Sembrados ${INITIAL_ALUMNOS.length} alumnos.`);

    // 3. Cursos
    console.log("-> Creando colección 'cursosConfig' y sembrando cursos...");
    for (const c of Object.keys(INITIAL_CURSOS_CONFIG)) {
      await setDoc(doc(db, "cursosConfig", c), INITIAL_CURSOS_CONFIG[c]);
      console.log(`   [OK] Curso: ${c}`);
    }

    // 4. Partes
    console.log("-> Creando colección 'partes' y sembrando partes diarios...");
    for (const p of INITIAL_PARTES) {
      await setDoc(doc(db, "partes", p.id), p);
      console.log(`   [OK] Parte diario ID: ${p.id}`);
    }

    // 5. Solicitudes
    console.log("-> Creando colección 'solicitudes' y sembrando partes faltantes...");
    for (const s of INITIAL_SOLICITUDES) {
      await setDoc(doc(db, "solicitudes", s.id), s);
      console.log(`   [OK] Solicitud ID: ${s.id}`);
    }

    // 6. Informes
    console.log("-> Creando colección 'informes' y sembrando actas...");
    for (const inf of INITIAL_INFORMES) {
      await setDoc(doc(db, "informes", inf.id), inf);
      console.log(`   [OK] Informe ID: ${inf.id}`);
    }

    console.log("=============================================================");
    console.log("¡ÉXITO TOTAL! Todas las colecciones han sido creadas y pobladas");
    console.log("en tu consola de Firebase. Ya puedes usar la app.");
    console.log("=============================================================");
    process.exit(0);

  } catch (error) {
    console.error("Error crítico durante la siembra de la base de datos:", error);
    process.exit(1);
  }
}

runSeeding();
