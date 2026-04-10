// FRONTEND/src/type.ts

// --- Tipos de Interfaz de Usuario ---
export type TabId = 'dashboard' | 'fields' | 'analysis' | 'history' | 'alerts' | 'settings';

export interface NavItem {
    id: TabId;
    label: string;
    icon: string;
}

// --- Tipos de Dominio Agrícola ---
export type FieldStatus = 'Saludable' | 'Atención' | 'Crítico';
export type AnalysisResult = 'Saludable' | 'Alerta' | 'Estrés';
export type AlertType = 'critical' | 'warning' | 'info';
export type TrendDirection = 'up' | 'down' | 'neutral';
export type FieldStatusFilter = FieldStatus | 'Todos';
export type AnalysisResultFilter = AnalysisResult | 'Todos';

// --- Tipos de Notificación ---
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
    text: string;
    type: ToastType;
}

// --- Entidades de Datos ---
export interface Metric {
    label: string;
    value: string | number;
    change: string;
    trend: TrendDirection;
    icon: string;
    color: string;
}

export interface Field {
    id: string;
    name: string;
    crop: string;
    status: FieldStatus;
    health: number;
}

export interface AnalysisRecord {
    id: string;
    date: string;
    time: string;
    fieldId: string;
    crop: string;
    resolution: string;
    type: string;
    result: AnalysisResult;
    imageUrl: string;
}

export interface Alert {
    id: string;
    type: AlertType;
    title: string;
    field: string;
    time: string;
    desc: string;
}

// --- Autenticación y Perfil (Sincronizado con Backend) ---
export type UserRole = 'admin' | 'productor' | 'agronomo';

export interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    photoURL?: string;
    role: UserRole;
    createdAt: string;
}

/**
 * Interface para el envío de datos al Backend en el registro.
 * El backend en Python espera 'display_name' para mapear a la DB.
 */
export interface UserCreate {
    email: string;
    password: string; // Usamos str para ser consistentes con FastAPI
    display_name: string;
    role?: UserRole; // Opcional, el backend puede asignar 'productor' por defecto
}

/**
 * Respuesta estándar del servidor tras Login o Registro exitoso.
 */
export interface AuthResponse {
    user: UserProfile;
    access_token: string;
    token_type: string;
}