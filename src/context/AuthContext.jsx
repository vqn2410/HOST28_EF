import React, { createContext, useState, useContext, useEffect } from 'react';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

const AuthContext = createContext(null);

// Datos semilla de usuarios con diferentes roles para pruebas
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
    cursosAsignados: ["1°1°", "2°1°", "3°2°"], // Cursos de EF asignados al docente
    situacionRevista: "Titular"
  }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('host28_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('host28_auth') === 'true';
  });

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar usuarios desde Firebase Firestore
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "usuarios"));
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push(doc.data());
        });
        setUsuarios(list);
      } catch (error) {
        console.error("Error al cargar usuarios desde Firebase:", error);
        // Fallback local en caso de error de red
        const saved = localStorage.getItem('host28_usuarios');
        setUsuarios(saved ? JSON.parse(saved) : SEED_USERS);
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, []);

  // Persistir localmente como respaldo
  useEffect(() => {
    if (usuarios.length > 0) {
      localStorage.setItem('host28_usuarios', JSON.stringify(usuarios));
    }
  }, [usuarios]);

  const login = (dni, password) => {
    // Buscar primero en los usuarios reales de Firestore
    let foundUser = usuarios.find(u => u.dni === dni && u.password === password);
    
    // Si la base de datos de usuarios está vacía, permite usar las cuentas semilla locales
    if (!foundUser && usuarios.length === 0) {
      foundUser = SEED_USERS.find(u => u.dni === dni && u.password === password);
    }

    if (foundUser) {
      setUser(foundUser);
      setIsAuthenticated(true);
      localStorage.setItem('host28_user', JSON.stringify(foundUser));
      localStorage.setItem('host28_auth', 'true');
      return { success: true, user: foundUser };
    }
    return { success: false, message: "DNI o Contraseña incorrectos" };
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('host28_user');
    localStorage.removeItem('host28_auth');
  };

  const registrarUsuario = async (nuevoUsuario) => {
    const userObj = { ...nuevoUsuario, password: nuevoUsuario.dni }; // Contraseña inicial es su DNI
    try {
      await setDoc(doc(db, "usuarios", nuevoUsuario.dni), userObj);
      setUsuarios(prev => {
        if (prev.some(u => u.dni === nuevoUsuario.dni)) return prev;
        return [...prev, userObj];
      });
    } catch (error) {
      console.error("Error al registrar usuario en Firebase:", error);
      // Fallback
      setUsuarios(prev => {
        if (prev.some(u => u.dni === nuevoUsuario.dni)) return prev;
        return [...prev, userObj];
      });
    }
  };

  const actualizarUsuario = async (userDni, datosActualizados) => {
    try {
      await setDoc(doc(db, "usuarios", userDni), datosActualizados, { merge: true });
      setUsuarios(prev => prev.map(u => u.dni === userDni ? { ...u, ...datosActualizados } : u));
    } catch (error) {
      console.error("Error al actualizar usuario en Firebase:", error);
      // Fallback
      setUsuarios(prev => prev.map(u => u.dni === userDni ? { ...u, ...datosActualizados } : u));
    }
  };

  const eliminarUsuario = async (userDni) => {
    try {
      await deleteDoc(doc(db, "usuarios", userDni));
      setUsuarios(prev => prev.filter(u => u.dni !== userDni));
    } catch (error) {
      console.error("Error al eliminar usuario en Firebase:", error);
      // Fallback
      setUsuarios(prev => prev.filter(u => u.dni !== userDni));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, usuarios, registrarUsuario, actualizarUsuario, eliminarUsuario, seedUsers: SEED_USERS, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
