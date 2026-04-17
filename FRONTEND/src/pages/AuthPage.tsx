import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sprout, ArrowRight, AlertCircle, Loader2, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { registerUser, loginUser } from '../services/auth.service';
import { useYear } from '../hooks';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ── Imágenes del carrusel — agrícolas de alta calidad ─────────
const CAROUSEL_SLIDES = [
  {
    url:     'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=2000',
    title:   'Monitoreo de cultivos',
    caption: 'Análisis multiespectral en tiempo real con Gemini AI',
  },
  {
    url:     'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=2000',
    title:   'Detección temprana',
    caption: 'Identifica enfermedades y plagas antes de que se propaguen',
  },
  {
    url:     'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=2000',
    title:   'Gestión inteligente',
    caption: 'Optimiza el riego y los recursos con datos precisos',
  },
  {
    url:     'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80&w=2000',
    title:   'Agricultura de precisión',
    caption: 'Toma decisiones basadas en evidencia científica',
  },
  {
    url:     'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&q=80&w=2000',
    title:   'Rendimiento óptimo',
    caption: 'Maximiza la productividad de cada hectárea',
  },
];

// ── Reglas de contraseña ──────────────────────────────────────
const PASSWORD_RULES = [
  { id: 'length', label: 'Mínimo 8 caracteres',  test: (p: string) => p.length >= 8         },
  { id: 'number', label: 'Al menos un número',   test: (p: string) => /[0-9]/.test(p)        },
  { id: 'letter', label: 'Al menos una letra',   test: (p: string) => /[A-Za-z]/.test(p)     },
];

function getStrength(password: string): number {
  return PASSWORD_RULES.filter(r => r.test(password)).length;
}

const STRENGTH_COLORS = ['', 'bg-red-400', 'bg-orange-400', 'bg-agri-green-500'];
const STRENGTH_TEXT   = ['', 'text-red-500', 'text-orange-500', 'text-agri-green-600'];
const STRENGTH_LABELS = ['', 'Débil', 'Media', 'Fuerte'];

export default function AuthPage() {
  const year     = useYear();
  const navigate = useNavigate();

  // ── Carrusel ──────────────────────────────────────────────
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // ── Formulario ────────────────────────────────────────────
  const [isLogin,      setIsLogin]      = useState(true);
  const [displayName,  setDisplayName]  = useState('');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [pwdFocused,   setPwdFocused]   = useState(false);

  const strength  = getStrength(password);
  const allPassed = strength === PASSWORD_RULES.length;

  const validate = (): string | null => {
    if (!isLogin && displayName.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres.';
    if (!isValidEmail(email)) return 'Ingresa un correo electrónico válido.';
    if (!isLogin && !allPassed) return 'La contraseña no cumple los requisitos de seguridad.';
    if (isLogin && password.length < 1) return 'Ingresa tu contraseña.';
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    try {
      const response = isLogin
        ? await loginUser({ email, password })
        : await registerUser({ email, password, display_name: displayName });
      sessionStorage.setItem('token', response.access_token);
      sessionStorage.setItem('user', JSON.stringify(response.user));
      window.location.href = '/dashboard';
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Error de conexión con el servidor';
      setError(typeof msg === 'string' ? msg : 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (login: boolean) => {
    setIsLogin(login);
    setError(null);
    setEmail(''); setPassword(''); setDisplayName('');
    setPwdFocused(false);
  };

  const slide = CAROUSEL_SLIDES[currentSlide];

  return (
    <div className="min-h-screen flex overflow-hidden">

      {/* ── Columna izquierda — carrusel ── */}
      <div className="hidden lg:block relative overflow-hidden" style={{ width: '55%' }}>

        {/* Imágenes con fade */}
        <AnimatePresence mode="sync">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <img
              src={slide.url}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            {/* Overlay degradado */}
            <div className="absolute inset-0 bg-gradient-to-t from-agri-green-950/90 via-agri-green-950/40 to-agri-green-950/20" />
          </motion.div>
        </AnimatePresence>

        {/* Contenido encima del carrusel */}
        <div className="relative z-10 h-full flex flex-col justify-between p-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-agri-green-500 flex items-center justify-center text-white shadow-lg">
              <Sprout size={28} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter">TerraLogic</h1>
          </div>

          {/* Texto dinámico del slide */}
          <div className="max-w-lg">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <h2 className="text-5xl font-black text-white leading-tight mb-4">
                  {slide.title}
                </h2>
                <p className="text-agri-green-100 text-lg font-medium leading-relaxed opacity-80">
                  {slide.caption}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Indicadores de slide */}
            <div className="flex items-center gap-2 mt-8">
              {CAROUSEL_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`transition-all duration-300 rounded-full ${
                    i === currentSlide
                      ? 'w-8 h-2 bg-agri-green-400'
                      : 'w-2 h-2 bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>

          <p className="text-agri-green-700 text-xs font-bold uppercase tracking-widest opacity-60">
            © {year} TerraLogic AI
          </p>
        </div>
      </div>

      {/* ── Columna derecha — formulario ── */}
      <div className="w-full lg:flex-1 min-h-screen bg-white flex items-center justify-center px-10 py-12">
        <div className="w-full max-w-sm">
          <h2 className="text-3xl font-black text-agri-green-950 tracking-tight mb-2">
            {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
          </h2>

          {/* Tabs */}
          <div className="flex gap-2 p-1.5 bg-earth-200/40 rounded-2xl mb-6">
            <button onClick={() => switchMode(true)}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${isLogin ? 'bg-white shadow-md text-agri-green-800' : 'text-earth-500'}`}>
              Iniciar Sesión
            </button>
            <button onClick={() => switchMode(false)}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${!isLogin ? 'bg-white shadow-md text-agri-green-800' : 'text-earth-500'}`}>
              Crear Cuenta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Nombre */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} className="space-y-1.5 overflow-hidden">
                  <label className="text-[10px] font-black text-earth-400 uppercase tracking-widest ml-1">Nombre completo</label>
                  <input type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ej. Carlos Aguirre"
                    className="w-full bg-earth-200/20 border-2 border-earth-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-agri-green-500" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-earth-400 uppercase tracking-widest ml-1">Correo electrónico</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@ejemplo.com"
                className="w-full bg-earth-200/20 border-2 border-earth-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-agri-green-500" />
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-earth-400 uppercase tracking-widest ml-1">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPwdFocused(true)}
                  onBlur={() => setPwdFocused(false)}
                  placeholder={isLogin ? 'Tu contraseña' : 'Mínimo 8 caracteres'}
                  className="w-full bg-earth-200/20 border-2 border-earth-200 rounded-2xl pl-4 pr-12 py-3.5 text-sm outline-none focus:border-agri-green-500"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Indicador fortaleza — solo en registro */}
              <AnimatePresence>
                {!isLogin && (pwdFocused || password.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}
                    className="mt-2 p-3.5 bg-earth-50 border border-earth-200 rounded-2xl space-y-3"
                  >
                    {password.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-earth-400 uppercase tracking-widest">Fortaleza</span>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${STRENGTH_TEXT[strength]}`}>
                            {STRENGTH_LABELS[strength]}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {PASSWORD_RULES.map((_, i) => (
                            <div key={i}
                              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < strength ? STRENGTH_COLORS[strength] : 'bg-earth-200'}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      {PASSWORD_RULES.map((rule) => {
                        const passed = rule.test(password);
                        return (
                          <div key={rule.id} className="flex items-center gap-2">
                            {passed
                              ? <CheckCircle2 size={13} className="text-agri-green-500 flex-shrink-0" />
                              : <XCircle      size={13} className="text-earth-300 flex-shrink-0" />
                            }
                            <span className={`text-xs font-bold transition-colors ${passed ? 'text-agri-green-700' : 'text-earth-400'}`}>
                              {rule.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2 text-red-700 text-xs font-bold">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full bg-agri-green-800 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-agri-green-900 disabled:opacity-50 transition-all active:scale-[0.98]">
              {loading
                ? <Loader2 className="animate-spin" size={18} />
                : <>{isLogin ? 'Entrar al Panel' : 'Crear mi Cuenta'} <ArrowRight size={18} /></>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}