import React, { useState } from 'react';
import { useSchoolData } from '../context/SchoolDataContext';
import { CheckCircle2, AlertCircle, X, GraduationCap, UserSquare, Info, RefreshCcw } from 'lucide-react';

const CURSOS = [
  '1°1°', '1°2°', '1°3°',
  '2°1°', '2°2°', '2°3°',
  '3°1°', '3°2°',
  '4°1°', '4°2°',
  '5°1°', '5°2°',
  '6°1°', '6°2°'
];

// Las 1° divisiones son del Turno Mañana; el resto del Turno Tarde
const determinarTurno = (curso) => curso.endsWith('1°') ? 'Mañana' : 'Tarde';

const ModalMatricularEstudiante = ({ open, onClose, cursoPredeterminado, onStudentAdded }) => {
  const { alumnos, agregarEstudiante, actualizarEstudiante } = useSchoolData();

  const [form, setForm] = useState(() => {
    const inicial = cursoPredeterminado || '1°1°';
    return {
      nombre: '',
      dni: '',
      cursoOrigen: inicial,
      turno: determinarTurno(inicial),
      asignarDiferenteEF: false,
      cursoEF: inicial,
      noCursaEF: false,
      recursaCursos: []
    };
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // true = modo "cambio de curso" para un alumno que ya existe por DNI
  const [editingExisting, setEditingExisting] = useState(false);

  if (!open) return null;

  const alumnoExistente = alumnos.find(a => a.dni === form.dni.trim());

  const resetForm = () => {
    const inicial = cursoPredeterminado || '1°1°';
    setForm({
      nombre: '',
      dni: '',
      cursoOrigen: inicial,
      turno: determinarTurno(inicial),
      asignarDiferenteEF: false,
      cursoEF: inicial,
      noCursaEF: false,
      recursaCursos: []
    });
    setError('');
    setSuccess('');
    setEditingExisting(false);
  };

  // Precargar los datos del alumno ya registrado para permitir el cambio de curso
  const cargarDatosExistentes = (al) => {
    setForm({
      nombre: al.nombre || '',
      dni: al.dni || '',
      cursoOrigen: al.cursoOrigen || '1°1°',
      turno: al.turno || determinarTurno(al.cursoOrigen || '1°1°'),
      asignarDiferenteEF: al.noCursaEF ? false : !!(al.cursoEF && al.cursoEF !== al.cursoOrigen),
      cursoEF: (al.cursoEF && al.cursoEF !== 'No cursa') ? al.cursoEF : al.cursoOrigen,
      noCursaEF: !!al.noCursaEF,
      recursaCursos: al.recursaCursos || []
    });
    setEditingExisting(true);
    setError('');
    setSuccess('');
  };

  const handleCursoOrigenChange = (cursoValue) => {
    const turnoCalculado = determinarTurno(cursoValue);
    setForm(prev => ({
      ...prev,
      cursoOrigen: cursoValue,
      turno: turnoCalculado,
      // Si no tiene asignación diferente, el cursoEF sigue al origen
      cursoEF: prev.asignarDiferenteEF ? prev.cursoEF : cursoValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { nombre, dni, cursoOrigen, turno, asignarDiferenteEF, cursoEF, noCursaEF, recursaCursos } = form;

    // Regla 1: campos obligatorios
    if (!nombre.trim() || !dni.trim() || !cursoOrigen || !turno) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    // Regla 2: el DNI debe contener únicamente números
    if (!/^\d+$/.test(dni)) {
      setError("El DNI debe contener únicamente números.");
      return;
    }

    // Regla 3: no puede recursar el mismo curso donde cursa EF
    if (!noCursaEF && recursaCursos.includes(cursoEF)) {
      setError("No podés marcar como recursada la misma división donde ya cursa EF.");
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

    const resumenCursada = noCursaEF
      ? 'No cursa'
      : [cursoEFDefinitivo, ...(recursaCursos.length > 0 ? recursaCursos : [])].join(', ');

    setIsSubmitting(true);
    try {
      if (editingExisting) {
        // Cambio de curso: actualizar el alumno existente (sin duplicarlo)
        await actualizarEstudiante(dni.trim(), datosEstudiante);
        setSuccess(`¡Cambio de curso registrado! "${nombre.trim()}" ahora cursa EF en ${resumenCursada}.`);
        if (onStudentAdded) onStudentAdded(datosEstudiante);
      } else {
        // Regla 3: no puede existir un estudiante con el mismo DNI
        if (alumnoExistente) {
          setError("Ya existe un estudiante matriculado con este DNI. Usá «Cambiar su curso» para reasignarle la cursada.");
          return;
        }

        await agregarEstudiante(datosEstudiante);
        setSuccess(`¡Estudiante "${nombre.trim()}" matriculado con éxito! Ya aparece en la tabla de asistencia.`);
        setForm(prev => ({
          ...prev,
          nombre: '',
          dni: ''
        }));
        if (onStudentAdded) onStudentAdded(datosEstudiante);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl border border-accent-200 shadow-2xl max-w-md w-full p-6 relative overflow-hidden animate-zoom-in max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="absolute top-0 right-0 w-24 h-24 bg-accent-500/5 rounded-full blur-xl -mr-6 -mt-6"></div>

        <button
          type="button"
          onClick={() => { onClose(); setEditingExisting(false); }}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full border border-slate-200 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <X size={14} />
        </button>

        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent-500/10 border border-accent-500/20 text-accent-600 mb-3">
            {editingExisting ? <RefreshCcw size={24} className="animate-pulse" /> : <GraduationCap size={24} />}
          </div>
          <h3 className="text-lg font-bold text-slate-900 font-display">
            {editingExisting ? 'Cambio de Curso / Cursada EF' : 'Matricular Estudiante'}
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 font-semibold leading-relaxed">
            {editingExisting
              ? 'Reasigná el curso de Educación Física del estudiante. No se crea otro registro, se actualiza su cursada.'
              : 'Usalo si el estudiante no figura en la matrícula. Si el DNI ya existe en el sistema, en vez de duplicarlo se generará un cambio de curso.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/5 border border-red-500/15 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
            <AlertCircle className="text-red-500 shrink-0" size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-accent-500/10 border border-accent-500/20 text-accent-700 text-xs font-semibold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="text-accent-600 shrink-0" size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* Aviso: DNI ya matriculado (modo cambio de curso disponible) */}
        {alumnoExistente && !editingExisting && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
            <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-800 font-semibold leading-relaxed">
              <span className="font-extrabold block mb-0.5">Este estudiante ya está matriculado</span>
              El DNI pertenece a <strong>{alumnoExistente.nombre}</strong> (Curso {alumnoExistente.cursoOrigen}{alumnoExistente.cursoEF && alumnoExistente.cursoEF !== alumnoExistente.cursoOrigen ? ` • EF: ${alumnoExistente.cursoEF}` : ''}{(alumnoExistente.recursaCursos || []).length > 0 ? ` • Recursa: ${alumnoExistente.recursaCursos.join(', ')}` : ''}). No se puede duplicar la matrícula.
              <button
                type="button"
                onClick={() => cargarDatosExistentes(alumnoExistente)}
                className="mt-2 inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer uppercase tracking-wide"
              >
                <RefreshCcw size={12} />
                Cambiar su curso
              </button>
            </div>
          </div>
        )}

        {editingExisting && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/25 text-amber-800 text-[11px] font-bold rounded-xl flex items-center gap-2">
            <RefreshCcw size={14} className="shrink-0" />
            <span>Modificando la cursada de <strong>{form.nombre}</strong> (DNI {form.dni}). Solo se actualizan los cursos.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="flex items-center gap-1 text-[10px] font-bold text-slate-600 uppercase mb-1">
              <UserSquare size={12} className="text-accent-500" />
              Nombre Completo (Apellido, Nombre) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              disabled={editingExisting}
              placeholder="Cardozo, Lucas"
              className="w-full bg-white border border-slate-300 focus:border-accent-500 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-accent-500/10 transition-all disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">DNI <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.dni}
                onChange={e => {
                  setForm({ ...form, dni: e.target.value });
                  setEditingExisting(false);
                  setSuccess('');
                }}
                disabled={editingExisting}
                placeholder="Solo números"
                className="w-full bg-white border border-slate-300 focus:border-accent-500 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-mono focus:ring-4 focus:ring-accent-500/10 transition-all disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Turno *(Auto)</label>
              <input
                type="text"
                value={form.turno}
                disabled
                className="w-full bg-slate-50 border border-slate-200 text-slate-500 rounded-lg px-3 py-2 text-xs font-bold cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Curso Origen <span className="text-red-500">*</span></label>
            <select
              value={form.cursoOrigen}
              onChange={e => handleCursoOrigenChange(e.target.value)}
              className="w-full bg-white border border-slate-300 focus:border-accent-500 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none font-bold cursor-pointer focus:ring-4 focus:ring-accent-500/10 transition-all"
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
                  checked={form.noCursaEF}
                  onChange={e => {
                    const checked = e.target.checked;
                    setForm({
                      ...form,
                      noCursaEF: checked,
                      asignarDiferenteEF: checked ? false : form.asignarDiferenteEF,
                      recursaCursos: checked ? [] : form.recursaCursos
                    });
                  }}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-red-500"></div>
              </label>
            </div>

            {/* Asignación Diferente EF (solo si cursa materia) */}
            {!form.noCursaEF && (
              <>
                <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="text-[10px] font-bold text-slate-700 leading-tight">
                    ¿Cursada EF Alternativa? (Otro Curso)
                  </span>
                  <label className="inline-flex relative items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.asignarDiferenteEF}
                      onChange={e => setForm({ ...form, asignarDiferenteEF: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-accent-500"></div>
                  </label>
                </div>

                {form.asignarDiferenteEF && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-200 animate-pulse-once">
                    <label className="block text-[9px] font-bold text-accent-600 uppercase mb-1">Curso de Educación Física Destino</label>
                    <select
                      value={form.cursoEF}
                      onChange={e => setForm({
                        ...form,
                        cursoEF: e.target.value,
                        recursaCursos: form.recursaCursos.filter(x => x !== e.target.value)
                      })}
                      className="w-full bg-white border border-accent-500/20 focus:border-accent-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none font-bold cursor-pointer"
                    >
                      {CURSOS.map(c => <option key={c} value={c}>Curso {c}</option>)}
                    </select>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Cursada Adicional: recursar otra división EF (multi-matriculación) */}
          {!form.noCursaEF && (
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
                {CURSOS.filter(c => c !== form.cursoEF).map(c => {
                  const activo = form.recursaCursos.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setForm(prev => ({
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
              {form.recursaCursos.length > 0 && (
                <p className="text-[9px] font-bold text-purple-700 uppercase tracking-wide">
                  Recursando: {form.recursaCursos.join(', ')}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => { onClose(); setEditingExisting(false); }}
              className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold py-2.5 px-4 rounded-xl transition-all uppercase tracking-wider cursor-pointer font-sans border border-slate-200"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-2/3 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 disabled:opacity-60 text-white text-[10px] font-bold py-2.5 px-4 rounded-xl transition-all uppercase tracking-wider cursor-pointer font-sans flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : editingExisting ? (
                <>
                  <RefreshCcw size={14} />
                  Guardar Cambio de Curso
                </>
              ) : (
                <>
                  <GraduationCap size={14} />
                  Matricular Alumno
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalMatricularEstudiante;