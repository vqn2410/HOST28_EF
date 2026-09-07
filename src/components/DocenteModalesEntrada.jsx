import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchoolData } from '../context/SchoolDataContext';
import { Info, AlertOctagon, X, ArrowRight, ListChecks } from 'lucide-react';

const DocenteModalesEntrada = ({ onDocenteNav }) => {
  const { user, isAuthenticated } = useAuth();
  const { solicitudesFaltantes = [], cursosConfig = {} } = useSchoolData();

  // 0 = cerrado, 1 = aviso de normativa, 2 = partes pendientes
  const [step, setStep] = useState(0);

  const cursosAsignados = useMemo(() => {
    if (!user) return [];
    return Object.keys(cursosConfig).filter(
      curso => cursosConfig[curso].docenteDni === user.dni
    );
  }, [cursosConfig, user]);

  const notificacionesFaltantes = useMemo(() => {
    return solicitudesFaltantes.filter(
      sol => cursosAsignados.includes(sol.curso) && !sol.completada
    );
  }, [solicitudesFaltantes, cursosAsignados]);

  // Al ingresar a la plataforma (login o recarga) mostrar el aviso de normativa
  useEffect(() => {
    if (isAuthenticated && user?.rol === 'Docente') {
      setStep(1);
    }
  }, [isAuthenticated, user?.dni]);

  if (step === 0) return null;

  const cerrar = () => setStep(0);
  const continuar = () => {
    if (notificacionesFaltantes.length > 0) setStep(2);
    else setStep(0);
  };
  const irACompletar = () => {
    setStep(0);
    if (onDocenteNav) onDocenteNav('asistencia');
  };

  return (
    <>
      {/* VENTANA 1: NORMATIVA DE CARGAS POR AUSENCIA / CLASES NO DICTADAS */}
      {step === 1 && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-amber-200 shadow-2xl max-w-md w-full p-6 relative overflow-hidden animate-zoom-in text-center">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl -mr-6 -mt-6"></div>

            <button
              type="button"
              onClick={cerrar}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full border border-slate-200 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <X size={14} />
            </button>

            <div className="mx-auto w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-sm animate-pulse">
              <Info size={26} />
            </div>

            <h3 className="text-lg font-bold text-amber-800 font-display">
              Aviso Importante para Docentes
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed font-semibold">
              Si por <strong>ausencia, licencia o cualquier otra causa no hubo clases</strong>, igualmente debes generar el parte de ese día en tus cursos.
            </p>

            <div className="my-4 bg-amber-50 border border-amber-200 rounded-2xl p-3 text-left text-xs font-semibold space-y-2 text-slate-700 shadow-inner">
              <span className="block text-[9px] uppercase tracking-wider text-amber-700 font-extrabold mb-1">¿Cómo proceder?</span>
              <ol className="list-decimal pl-4 space-y-1.5">
                <li>Ingresá a <strong>Crear Parte Diario</strong> y seleccioná el curso y la fecha.</li>
                <li>Marcá la opción <strong className="text-red-600">«No hubo clases»</strong>.</li>
                <li>Registrá el <strong>motivo</strong> de la suspensión (licencia, jornada, clima, etc.).</li>
                <li>Enviá y firmá el parte.</li>
              </ol>
              <p className="text-[10px] text-amber-800 bg-white/70 rounded-xl p-2 border border-amber-200 font-bold">
                Esto genera automáticamente el reporte en el módulo de asistencia, dejando el registro oficial del día.
              </p>
            </div>

            <button
              type="button"
              onClick={continuar}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer active:scale-[0.98] uppercase tracking-wide flex items-center justify-center gap-2"
            >
              {notificacionesFaltantes.length > 0 ? 'Continuar' : 'Entendido'}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* VENTANA 2: PARTES PENDIENTES */}
      {step === 2 && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-red-200 shadow-2xl max-w-md w-full p-6 relative overflow-hidden animate-zoom-in text-center">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl -mr-6 -mt-6"></div>

            <button
              type="button"
              onClick={cerrar}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full border border-slate-200 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <X size={14} />
            </button>

            <div className="mx-auto w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-500 mb-4 shadow-sm animate-pulse">
              <AlertOctagon size={26} />
            </div>

            <h3 className="text-lg font-bold text-red-800 font-display">
              ¡Tiene Partes Pendientes!
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed font-semibold">
              Se han detectado <strong className="text-red-600 font-extrabold">{notificacionesFaltantes.length}</strong> solicitudes de partes diarios requeridas por la preceptora o la dirección escolar.
            </p>

            <div className="my-4 bg-slate-50 border border-slate-200 rounded-2xl p-3 max-h-36 overflow-y-auto text-left text-xs font-semibold space-y-1.5 text-slate-700 shadow-inner">
              <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-extrabold mb-1">Listado de partes solicitados:</span>
              {notificacionesFaltantes.map(sol => (
                <div key={sol.id} className="border-b border-slate-100 pb-1.5 last:border-0 last:pb-0 space-y-0.5">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-800 font-bold whitespace-nowrap">Curso {sol.curso}</span>
                    <span className="font-mono text-primary-500 whitespace-nowrap">{new Date(sol.fecha + 'T00:00:00').toLocaleDateString('es-AR')}</span>
                  </div>
                  {sol.comentario && (
                    <p className="text-[10px] text-slate-500 italic font-medium ml-2 bg-white/50 px-2 py-0.5 rounded border border-slate-200">
                      <strong>Nota preceptor:</strong> {sol.comentario}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                type="button"
                onClick={cerrar}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl border border-slate-200 transition-all cursor-pointer active:scale-95"
              >
                Más Tarde
              </button>
              <button
                type="button"
                onClick={irACompletar}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md shadow-red-500/10 cursor-pointer active:scale-95 uppercase tracking-wide flex items-center justify-center gap-1.5"
              >
                <ListChecks size={14} />
                Ir a Completar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DocenteModalesEntrada;