import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const translations = {
  en: {
    // Nav / App
    appName: 'ResourceBridge',
    tagline: 'Your family documents, organized and understood.',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    logOut: 'Log Out',
    language: 'Español',

    // Landing
    heroTitle: 'Your Documents,\nClearly Explained.',
    heroSubtitle: 'ResourceBridge helps immigrant and working-class families securely organize, translate, and understand important documents — all in one place.',
    getStarted: 'Get Started Free',
    learnMore: 'Learn More',
    feature1Title: 'AI-Powered Summaries',
    feature1Desc: 'Upload any document and instantly receive a plain-language explanation of what it means and what action you need to take.',
    feature2Title: 'Bilingual Support',
    feature2Desc: 'Every document summary is automatically translated into Spanish so your whole family can understand.',
    feature3Title: 'Emergency Preparedness',
    feature3Desc: 'Mark critical documents and generate a printable emergency packet your family can grab at any moment.',
    feature4Title: 'Secure & Private',
    feature4Desc: 'Your documents are encrypted and stored securely. Only you can access your family vault.',
    feature5Title: 'Personal To-Do List',
    feature5Desc: 'Create and track tasks tied to your documents — from filing a form to calling an office — with priority levels so nothing slips through.',
    feature6Title: 'Email Reminders',
    feature6Desc: 'Set a date and time for any reminder and we\'ll send it straight to your email — so you never miss a deadline or appointment.',
    feature7Title: 'Resource Library',
    feature7Desc: 'Access free bilingual Know Your Rights cards and preparedness checklists covering immigration, housing, employment, healthcare, and school enrollment.',
    ctaTitle: 'Ready to get organized?',
    ctaSubtitle: 'Join families who use ResourceBridge to stay prepared, informed, and organized.',
    createAccount: 'Create Free Account',

    // Auth
    emailLabel: 'Email Address',
    passwordLabel: 'Password',
    signingIn: 'Signing In...',
    creatingAccount: 'Creating Account...',
    switchToSignUp: "Need an account? Sign up here",
    switchToSignIn: "Already have an account? Sign in",
    accountCreated: 'Account created! Please sign in.',
    authFailed: 'Authentication failed. Please try again.',

    // Dashboard
    myDocuments: 'My Documents',
    uploadDocument: 'Upload Document',
    uploadTitle: 'Process New Document',
    docTitle: 'Document Title',
    docTitlePlaceholder: 'e.g. Lease Agreement, School Letter...',
    category: 'Category',
    markEmergency: 'Mark as Emergency Document',
    uploadBtn: 'Upload & Analyze',
    processing: 'Processing...',
    searchPlaceholder: 'Search your document vault...',
    allCategories: 'All Categories',
    emergencyOnly: 'Emergency Only',
    noDocuments: 'No documents yet.',
    noDocumentsHint: 'Upload your first document above to get started.',
    uploaded: 'Uploaded',
    selectDoc: 'Select a document to view its AI analysis.',

    // Detail panel
    aiSummary: 'AI Summary',
    plainLanguage: 'Plain-Language Explanation',
    extractedText: 'Extracted Document Text',
    actionItems: 'Action Items & Reminders',
    noActions: 'No specific action items detected.',
    viewOriginal: 'View Original File',
    deleteDoc: 'Delete',
    highPriority: 'High',
    medPriority: 'Medium',
    lowPriority: 'Low',
    deadline: 'Deadline',
    noDeadline: 'No deadline specified',

    // Emergency
    emergencyTab: 'Emergency Packet',
    emergencyTitle: 'Emergency Preparedness Packet',
    emergencySubtitle: 'Documents marked as emergency, ready to print and share.',
    generatePacket: 'Generate & Print Packet',
    noEmergencyDocs: 'No emergency documents found.',
    noEmergencyHint: 'When uploading a document, check "Mark as Emergency" to include it here.',
    printPacket: 'Print Packet',

    // Categories
    immigration: 'Immigration',
    school: 'School',
    housing: 'Housing',
    employment: 'Employment',
    healthcare: 'Healthcare',
    benefits: 'Benefits',
    emergency: 'Emergency',
    Uncategorized: 'Uncategorized',

    // Errors
    uploadError: 'Error uploading document. Please try again.',
    fileTooLarge: 'File too large. Maximum size is 20MB.',
    unsupportedType: 'Unsupported file type. Please upload a PDF Image or Document.',
  },

  es: {
    appName: 'ResourceBridge',
    tagline: 'Tus documentos familiares, organizados y comprensibles.',
    signIn: 'Iniciar Sesión',
    signUp: 'Registrarse',
    logOut: 'Cerrar Sesión',
    language: 'English',

    heroTitle: 'Tus Documentos,\nExplicados Claramente.',
    heroSubtitle: 'ResourceBridge ayuda a familias inmigrantes y trabajadoras a organizar, traducir y entender documentos importantes — todo en un solo lugar.',
    getStarted: 'Comenzar Gratis',
    learnMore: 'Saber Más',
    feature1Title: 'Resúmenes con IA',
    feature1Desc: 'Sube cualquier documento y recibe de inmediato una explicación en lenguaje sencillo de lo que significa y qué acción debes tomar.',
    feature2Title: 'Soporte Bilingüe',
    feature2Desc: 'Cada resumen se traduce automáticamente al español para que toda la familia pueda entender.',
    feature3Title: 'Preparación para Emergencias',
    feature3Desc: 'Marca documentos críticos y genera un paquete de emergencia imprimible que tu familia puede tomar en cualquier momento.',
    feature4Title: 'Seguro y Privado',
    feature4Desc: 'Tus documentos están cifrados y guardados de forma segura. Solo tú puedes acceder a tu bóveda familiar.',
    feature5Title: 'Lista de Tareas Personal',
    feature5Desc: 'Crea y organiza tareas relacionadas con tus documentos — desde llenar formularios hasta llamar a una oficina — con niveles de prioridad.',
    feature6Title: 'Recordatorios por Correo',
    feature6Desc: 'Establece una fecha y hora y te enviamos el recordatorio directo a tu correo — para que nunca pierdas una fecha límite.',
    feature7Title: 'Biblioteca de Recursos',
    feature7Desc: 'Accede gratis a tarjetas bilingües de Conoce Tus Derechos y listas de preparación sobre inmigración, vivienda, empleo, salud e inscripción escolar.',
    ctaTitle: '¿Listo para organizarte?',
    ctaSubtitle: 'Únete a las familias que usan ResourceBridge para mantenerse preparadas, informadas y organizadas.',
    createAccount: 'Crear Cuenta Gratis',

    emailLabel: 'Correo Electrónico',
    passwordLabel: 'Contraseña',
    signingIn: 'Iniciando sesión...',
    creatingAccount: 'Creando cuenta...',
    switchToSignUp: '¿Necesitas una cuenta? Regístrate aquí',
    switchToSignIn: '¿Ya tienes cuenta? Inicia sesión',
    accountCreated: '¡Cuenta creada! Por favor inicia sesión.',
    authFailed: 'Error de autenticación. Por favor intenta de nuevo.',

    myDocuments: 'Mis Documentos',
    uploadDocument: 'Subir Documento',
    uploadTitle: 'Procesar Nuevo Documento',
    docTitle: 'Título del Documento',
    docTitlePlaceholder: 'ej. Contrato de Arrendamiento, Carta Escolar...',
    category: 'Categoría',
    markEmergency: 'Marcar como Documento de Emergencia',
    uploadBtn: 'Subir y Analizar',
    processing: 'Procesando...',
    searchPlaceholder: 'Buscar en tu bóveda de documentos...',
    allCategories: 'Todas las Categorías',
    emergencyOnly: 'Solo Emergencias',
    noDocuments: 'Aún no tienes documentos.',
    noDocumentsHint: 'Sube tu primer documento arriba para comenzar.',
    uploaded: 'Subido',
    selectDoc: 'Selecciona un documento para ver su análisis de IA.',

    aiSummary: 'Resumen de IA',
    plainLanguage: 'Explicación en Lenguaje Sencillo',
    extractedText: 'Texto Extraído del Documento',
    actionItems: 'Elementos de Acción y Recordatorios',
    noActions: 'No se detectaron elementos de acción específicos.',
    viewOriginal: 'Ver Archivo Original',
    deleteDoc: 'Eliminar',
    highPriority: 'Alta',
    medPriority: 'Media',
    lowPriority: 'Baja',
    deadline: 'Fecha Límite',
    noDeadline: 'Sin fecha límite especificada',

    emergencyTab: 'Paquete de Emergencia',
    emergencyTitle: 'Paquete de Preparación para Emergencias',
    emergencySubtitle: 'Documentos marcados como emergencia, listos para imprimir y compartir.',
    generatePacket: 'Generar e Imprimir Paquete',
    noEmergencyDocs: 'No se encontraron documentos de emergencia.',
    noEmergencyHint: 'Al subir un documento, marca "Emergencia" para incluirlo aquí.',
    printPacket: 'Imprimir Paquete',

    immigration: 'Inmigración',
    school: 'Escuela',
    housing: 'Vivienda',
    employment: 'Empleo',
    healthcare: 'Salud',
    benefits: 'Beneficios',
    emergency: 'Emergencia',
    Uncategorized: 'Sin Categoría',

    uploadError: 'Error al subir el documento. Por favor intenta de nuevo.',
    fileTooLarge: 'Archivo demasiado grande. El tamaño máximo es 20MB.',
    unsupportedType: 'Tipo de archivo no compatible. Por favor sube un PDF o imagen.',
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');
  const toggle = () => setLang(l => l === 'en' ? 'es' : 'en');
  const t = translations[lang];
  return (
    <LanguageContext.Provider value={{ lang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}