import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sprout, Mail, Lock, User, ArrowRight, AlertCircle, Loader2, Chrome, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Para navegar tras el éxito
import { registerUser, loginUser } from '../services/auth.service';
import { useYear } from '../hooks';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function AuthPage() {
  const year = useYear();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!isLogin && displayName.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres.';
    if (!isValidEmail(email)) return 'Ingresa un correo electrónico válido.';
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    
    setLoading(true);

    try {
      let response;
      if (isLogin) {
        // Ejecuta Login Real
        response = await loginUser({ email, password });
      } else {
        // Ejecuta Registro Real
        response = await registerUser({ 
          email, 
          password, 
          display_name: displayName 
        });
      }
// CAMBIO A SESSION STORAGE: Los datos morirán al cerrar la pestaña/navegador
sessionStorage.setItem('token', response.access_token);
sessionStorage.setItem('user', JSON.stringify(response.user));

     window.location.href = '/dashboard';

    } catch (err: any) {
      // Si el backend devuelve 401 o 400, lo mostramos aquí
      const serverMessage = err.response?.data?.detail || 'Error de conexión con el servidor';
      setError(typeof serverMessage === 'string' ? serverMessage : 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (login: boolean) => {
    setIsLogin(login); 
    setError(null);
    setEmail(''); 
    setPassword(''); 
    setDisplayName('');
  };

  // --- Mantenemos tu JSX original pero con los cambios aplicados ---
  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Columna Izquierda (Imagen) */}
      <div className="hidden lg:flex relative bg-agri-green-950 overflow-hidden" style={{ width: '55%' }}>
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=2000"
            className="w-full h-full object-cover opacity-60 mix-blend-overlay"
            alt="Campo agrícola"
          />
        </div>
        <div className="relative z-10 w-full p-16 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-agri-green-500 flex items-center justify-center text-white shadow-lg"><Sprout size={28} /></div>
            <h1 className="text-3xl font-black text-white tracking-tighter">TerraLogic</h1>
          </div>
          <div className="max-w-lg">
            <h2 className="text-5xl font-black text-white leading-tight mb-6">
              El futuro de la agricultura es <span className="text-agri-green-400 underline decoration-agri-green-400/30 underline-offset-8">inteligente</span>.
            </h2>
            <p className="text-agri-green-100 text-lg font-medium leading-relaxed opacity-80">
              Monitoreo multiespectral y gestión de cultivos impulsada por IA.
            </p>
          </div>
          <p className="text-agri-green-700 text-xs font-bold uppercase tracking-widest opacity-60">© {year} TerraLogic AI</p>
        </div>
      </div>

      {/* Columna Derecha (Formulario) */}
      <div className="w-full lg:flex-1 min-h-screen bg-white flex items-center justify-center px-10 py-12">
        <div className="w-full max-w-sm">
          <h2 className="text-3xl font-black text-agri-green-950 tracking-tight mb-2">
            {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
          </h2>
          
          <div className="flex gap-2 p-1.5 bg-earth-200/40 rounded-2xl mb-6">
            <button onClick={() => switchMode(true)} className={`flex-1 py-3 text-sm font-bold rounded-xl ${isLogin ? 'bg-white shadow-md' : 'text-earth-500'}`}>Iniciar Sesión</button>
            <button onClick={() => switchMode(false)} className={`flex-1 py-3 text-sm font-bold rounded-xl ${!isLogin ? 'bg-white shadow-md' : 'text-earth-500'}`}>Crear Cuenta</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-earth-400 uppercase tracking-widest ml-1">Nombre completo</label>
                <input type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ej. Carlos Aguirre"
                  className="w-full bg-earth-200/20 border-2 border-earth-200 rounded-2xl pl-4 pr-4 py-3.5 text-sm outline-none focus:border-agri-green-500" />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-earth-400 uppercase tracking-widest ml-1">Correo electrónico</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@ejemplo.com"
                className="w-full bg-earth-200/20 border-2 border-earth-200 rounded-2xl pl-4 pr-4 py-3.5 text-sm outline-none focus:border-agri-green-500" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-earth-400 uppercase tracking-widest ml-1">Contraseña</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres"
                  className="w-full bg-earth-200/20 border-2 border-earth-200 rounded-2xl pl-4 pr-12 py-3.5 text-sm outline-none focus:border-agri-green-500" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-earth-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2 text-red-700 text-xs font-bold">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-agri-green-800 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-agri-green-900 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" /> : <>{isLogin ? 'Entrar al Panel' : 'Crear mi Cuenta'} <ArrowRight size={18} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}