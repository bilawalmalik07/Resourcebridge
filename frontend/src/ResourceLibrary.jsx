import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import {
  BookOpen, Shield, AlertTriangle, FileText,
  ChevronDown, ChevronUp, Printer, ExternalLink,
  CheckSquare, Globe, Home, Briefcase, Heart,
  Download, X
} from 'lucide-react';

// ─── DATA ──────────────────────────────────────────────────────────────────────

const RIGHTS_CARDS = [
  {
    id: 'immigration-rights',
    icon: Globe,
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    category: { en: 'Immigration', es: 'Inmigración' },
    title: { en: 'Your Rights if Stopped by Immigration Authorities', es: 'Tus Derechos si la Autoridad Migratoria te Detiene' },
    rights: [
      {
        en: 'You have the right to remain silent. You do not have to answer questions about where you were born or how you entered the country.',
        es: 'Tienes el derecho a guardar silencio. No tienes que responder preguntas sobre dónde naciste o cómo entraste al país.',
      },
      {
        en: 'You have the right to refuse to sign any documents without first speaking to a lawyer.',
        es: 'Tienes el derecho a negarte a firmar cualquier documento sin antes hablar con un abogado.',
      },
      {
        en: 'You have the right to speak with a lawyer before answering questions. If detained, say clearly: "I want to speak to a lawyer."',
        es: 'Tienes el derecho a hablar con un abogado antes de responder preguntas. Si te detienen, di claramente: "Quiero hablar con un abogado."',
      },
      {
        en: 'You do not have to open your door to immigration agents unless they have a judicial warrant signed by a judge.',
        es: 'No tienes que abrir la puerta a agentes de inmigración a menos que tengan una orden judicial firmada por un juez.',
      },
      {
        en: 'If you are arrested, you have the right to call your consulate.',
        es: 'Si eres arrestado, tienes el derecho de llamar a tu consulado.',
      },
    ],
    reminder: {
      en: 'Stay calm. Do not run. Do not resist. Memorize a trusted phone number to call.',
      es: 'Mantén la calma. No corras. No resistas. Memoriza un número de teléfono de confianza para llamar.',
    },
  },
  {
    id: 'housing-rights',
    icon: Home,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    category: { en: 'Housing', es: 'Vivienda' },
    title: { en: 'Your Rights as a Tenant', es: 'Tus Derechos como Inquilino' },
    rights: [
      {
        en: 'You have the right to a safe and livable home. Landlords must fix serious problems like heating, plumbing, and pests.',
        es: 'Tienes el derecho a una vivienda segura y habitable. Los propietarios deben reparar problemas graves como calefacción, plomería y plagas.',
      },
      {
        en: 'A landlord must give you proper notice — usually 24–48 hours — before entering your home, except in emergencies.',
        es: 'El propietario debe darte aviso previo — generalmente 24 a 48 horas — antes de entrar a tu hogar, excepto en emergencias.',
      },
      {
        en: 'You cannot be evicted without a court order. An eviction must go through the legal process — a landlord cannot change your locks or remove your belongings.',
        es: 'No puedes ser desalojado sin una orden judicial. Un desalojo debe pasar por el proceso legal — el propietario no puede cambiar las cerraduras ni remover tus pertenencias.',
      },
      {
        en: 'You have the right to fair housing. Discrimination based on race, national origin, religion, sex, disability, or family status is illegal.',
        es: 'Tienes el derecho a una vivienda justa. La discriminación por raza, origen nacional, religión, sexo, discapacidad o estado familiar es ilegal.',
      },
      {
        en: 'You may have the right to withhold rent or make repairs yourself and deduct costs if your landlord refuses to fix serious habitability issues.',
        es: 'Puedes tener el derecho a retener la renta o hacer reparaciones tú mismo y deducir los costos si el propietario se niega a arreglar problemas graves de habitabilidad.',
      },
    ],
    reminder: {
      en: 'Always keep copies of your lease, rent receipts, and any written communication with your landlord.',
      es: 'Siempre guarda copias de tu contrato de arrendamiento, recibos de renta y cualquier comunicación escrita con tu propietario.',
    },
  },
  {
    id: 'employment-rights',
    icon: Briefcase,
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    category: { en: 'Employment', es: 'Empleo' },
    title: { en: 'Your Rights at Work', es: 'Tus Derechos en el Trabajo' },
    rights: [
      {
        en: 'Regardless of immigration status, you are entitled to at least federal minimum wage for all hours worked.',
        es: 'Independientemente de tu estatus migratorio, tienes derecho al salario mínimo federal por todas las horas trabajadas.',
      },
      {
        en: 'You have the right to a safe workplace. Your employer must provide safe conditions and equipment. You can report unsafe conditions to OSHA.',
        es: 'Tienes el derecho a un lugar de trabajo seguro. Tu empleador debe proveer condiciones y equipo seguros. Puedes reportar condiciones inseguras a OSHA.',
      },
      {
        en: 'Your employer cannot discriminate against you based on race, national origin, religion, sex, age (40+), or disability.',
        es: 'Tu empleador no puede discriminarte por raza, origen nacional, religión, sexo, edad (40+) o discapacidad.',
      },
      {
        en: 'You have the right to organize with coworkers and talk about wages. Your employer cannot fire you for organizing.',
        es: 'Tienes el derecho a organizarte con compañeros de trabajo y hablar sobre salarios. Tu empleador no puede despedirte por organizarte.',
      },
      {
        en: 'If injured at work, you have the right to workers\' compensation regardless of your immigration status.',
        es: 'Si te lastimas en el trabajo, tienes derecho a compensación laboral independientemente de tu estatus migratorio.',
      },
    ],
    reminder: {
      en: 'Keep records of your hours worked and pay stubs. You can file a complaint with the Department of Labor at dol.gov.',
      es: 'Guarda registros de tus horas trabajadas y talones de pago. Puedes presentar una queja ante el Departamento de Trabajo en dol.gov.',
    },
  },
  {
    id: 'healthcare-rights',
    icon: Heart,
    color: 'text-rose-600',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-800',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
    category: { en: 'Healthcare', es: 'Salud' },
    title: { en: 'Your Rights to Healthcare', es: 'Tus Derechos a la Atención Médica' },
    rights: [
      {
        en: 'Emergency rooms must treat you regardless of immigration status, ability to pay, or insurance status under EMTALA.',
        es: 'Las salas de emergencia deben atenderte sin importar el estatus migratorio, capacidad de pago o seguro médico bajo la ley EMTALA.',
      },
      {
        en: 'You have the right to receive information about your health in a language you understand. You can ask for a free interpreter.',
        es: 'Tienes el derecho a recibir información sobre tu salud en un idioma que entiendas. Puedes pedir un intérprete gratuito.',
      },
      {
        en: 'You have the right to privacy. Your health information cannot be shared without your permission under HIPAA.',
        es: 'Tienes el derecho a la privacidad. Tu información de salud no puede ser compartida sin tu permiso bajo la ley HIPAA.',
      },
      {
        en: 'All children may qualify for CHIP (Children\'s Health Insurance Program) regardless of immigration status, depending on your state.',
        es: 'Todos los niños pueden calificar para CHIP (Programa de Seguro de Salud para Niños) independientemente del estatus migratorio, según tu estado.',
      },
      {
        en: 'Community health centers (FQHCs) provide care on a sliding-fee scale to anyone regardless of ability to pay or immigration status.',
        es: 'Los centros de salud comunitarios (FQHCs) brindan atención a escala de tarifas según ingresos a cualquier persona, sin importar su capacidad de pago o estatus migratorio.',
      },
    ],
    reminder: {
      en: 'Find a community health center near you at findahealthcenter.hrsa.gov — they serve everyone.',
      es: 'Encuentra un centro de salud comunitario cerca de ti en findahealthcenter.hrsa.gov — atienden a todos.',
    },
  },
];

const CHECKLISTS = [
  {
    id: 'emergency-docs',
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-950/40',
    border: 'border-red-200 dark:border-red-800',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    title: { en: 'Emergency Document Checklist', es: 'Lista de Documentos de Emergencia' },
    subtitle: {
      en: 'Keep physical copies of these in a waterproof folder you can grab quickly.',
      es: 'Mantén copias físicas de estos en una carpeta impermeable que puedas tomar rápidamente.',
    },
    sections: [
      {
        heading: { en: 'Identity Documents', es: 'Documentos de Identidad' },
        items: [
          { en: 'Passports (all family members)', es: 'Pasaportes (todos los miembros de la familia)' },
          { en: 'Birth certificates', es: 'Actas de nacimiento' },
          { en: 'Permanent Resident Cards (Green Cards)', es: 'Tarjetas de Residente Permanente (Green Cards)' },
          { en: 'Work authorization documents (EAD)', es: 'Documentos de autorización de trabajo (EAD)' },
          { en: 'Driver\'s license or state ID', es: 'Licencia de conducir o identificación estatal' },
          { en: 'Social Security cards', es: 'Tarjetas de Seguro Social' },
          { en: 'ITIN letters (if applicable)', es: 'Cartas de ITIN (si aplica)' },
        ],
      },
      {
        heading: { en: 'Family & Legal Documents', es: 'Documentos Familiares y Legales' },
        items: [
          { en: 'Marriage / divorce certificates', es: 'Certificados de matrimonio / divorcio' },
          { en: 'Custody agreements', es: 'Acuerdos de custodia' },
          { en: 'Adoption papers (if applicable)', es: 'Papeles de adopción (si aplica)' },
          { en: 'Power of attorney documents', es: 'Documentos de poder notarial' },
          { en: 'Immigration court notices or case numbers', es: 'Avisos del tribunal de inmigración o números de caso' },
        ],
      },
      {
        heading: { en: 'Housing & Financial', es: 'Vivienda y Finanzas' },
        items: [
          { en: 'Lease or mortgage documents', es: 'Documentos de arrendamiento o hipoteca' },
          { en: 'Recent utility bills (proof of address)', es: 'Facturas recientes de servicios (comprobante de domicilio)' },
          { en: 'Bank account information', es: 'Información de cuenta bancaria' },
          { en: 'Insurance cards (health, auto, renters)', es: 'Tarjetas de seguro (salud, auto, inquilino)' },
        ],
      },
      {
        heading: { en: 'Medical & School', es: 'Médico y Escolar' },
        items: [
          { en: 'Vaccination records for all family members', es: 'Registros de vacunación de todos los miembros de la familia' },
          { en: 'Prescription medication list', es: 'Lista de medicamentos recetados' },
          { en: 'School enrollment records', es: 'Registros de inscripción escolar' },
          { en: 'IEP or 504 plans (if applicable)', es: 'Planes IEP o 504 (si aplica)' },
        ],
      },
    ],
  },
  {
    id: 'school-enrollment',
    icon: BookOpen,
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    border: 'border-purple-200 dark:border-purple-800',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    title: { en: 'School Enrollment Checklist', es: 'Lista para Inscripción Escolar' },
    subtitle: {
      en: 'Under Plyler v. Doe, all children have the right to public education regardless of immigration status.',
      es: 'Bajo Plyler v. Doe, todos los niños tienen derecho a la educación pública sin importar su estatus migratorio.',
    },
    sections: [
      {
        heading: { en: 'What Schools Can Ask For', es: 'Lo que las Escuelas Pueden Pedir' },
        items: [
          { en: 'Proof of age (birth certificate, passport, or baptismal record)', es: 'Prueba de edad (acta de nacimiento, pasaporte o registro bautismal)' },
          { en: 'Proof of residency in the school district (utility bill, lease)', es: 'Comprobante de residencia en el distrito escolar (factura, contrato de arrendamiento)' },
          { en: 'Immunization records', es: 'Registros de vacunación' },
          { en: 'Previous school records (if available)', es: 'Registros escolares anteriores (si están disponibles)' },
        ],
      },
      {
        heading: { en: 'What Schools CANNOT Ask For', es: 'Lo que las Escuelas NO Pueden Pedir' },
        items: [
          { en: 'Social Security number of the child or parents', es: 'Número de Seguro Social del niño o los padres' },
          { en: 'Immigration status or documents', es: 'Estatus migratorio o documentos de inmigración' },
          { en: 'Citizenship status', es: 'Estatus de ciudadanía' },
        ],
      },
      {
        heading: { en: 'Additional Resources', es: 'Recursos Adicionales' },
        items: [
          { en: 'Ask the school about McKinney-Vento Act rights if your family is experiencing housing instability', es: 'Pregunta a la escuela sobre los derechos de la Ley McKinney-Vento si tu familia tiene inestabilidad de vivienda' },
          { en: 'Request translated materials and interpreter services — schools must provide these', es: 'Solicita materiales traducidos y servicios de intérprete — las escuelas deben proporcionarlos' },
          { en: 'Ask about free/reduced lunch program eligibility', es: 'Pregunta sobre la elegibilidad para el programa de almuerzo gratuito/reducido' },
          { en: 'Special education evaluations are available at no cost and in your language', es: 'Las evaluaciones de educación especial están disponibles sin costo y en tu idioma' },
        ],
      },
    ],
  },
  {
    id: 'family-safety-plan',
    icon: Shield,
    color: 'text-sky-600',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    border: 'border-sky-200 dark:border-sky-800',
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
    title: { en: 'Family Safety Plan', es: 'Plan de Seguridad Familiar' },
    subtitle: {
      en: 'Prepare your family with a clear plan so everyone knows what to do in an emergency.',
      es: 'Prepara a tu familia con un plan claro para que todos sepan qué hacer en una emergencia.',
    },
    sections: [
      {
        heading: { en: 'Information Everyone Should Memorize', es: 'Información que Todos Deben Memorizar' },
        items: [
          { en: 'A trusted adult\'s phone number (relative, neighbor, or advocate)', es: 'El número de teléfono de un adulto de confianza (familiar, vecino o defensor)' },
          { en: 'Your home address and city', es: 'Tu dirección de casa y ciudad' },
          { en: 'Your attorney\'s name and phone number (if you have one)', es: 'Nombre y número de teléfono de tu abogado (si tienes uno)' },
          { en: 'A family meeting place if separated', es: 'Un lugar de encuentro familiar si se separan' },
        ],
      },
      {
        heading: { en: 'Designate a Trusted Person', es: 'Designa a una Persona de Confianza' },
        items: [
          { en: 'Someone who can pick up children from school if you can\'t', es: 'Alguien que pueda recoger a los niños de la escuela si tú no puedes' },
          { en: 'Someone with a copy of your emergency documents', es: 'Alguien con una copia de tus documentos de emergencia' },
          { en: 'Someone who knows your lawyer\'s contact info', es: 'Alguien que conozca la información de contacto de tu abogado' },
          { en: 'Someone your children know and trust', es: 'Alguien a quien tus hijos conozcan y en quien confíen' },
        ],
      },
      {
        heading: { en: 'Prepare a "Go Bag"', es: 'Prepara una "Bolsa de Emergencia"' },
        items: [
          { en: 'Copies of your emergency documents (see Document Checklist above)', es: 'Copias de tus documentos de emergencia (ver Lista de Documentos arriba)' },
          { en: 'Cash (small bills)', es: 'Efectivo (billetes pequeños)' },
          { en: 'A list of important phone numbers written on paper', es: 'Una lista de números telefónicos importantes escritos en papel' },
          { en: 'Medications (at least a 2-week supply)', es: 'Medicamentos (al menos para 2 semanas)' },
          { en: 'Phone charger', es: 'Cargador de teléfono' },
        ],
      },
    ],
  },
];

// ─── COMPONENTS ────────────────────────────────────────────────────────────────

function PrintModal({ resource, lang, onClose }) {
  const isCard = resource.rights !== undefined;

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:hidden-overlay">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-stone-200 dark:border-stone-700">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-100 dark:border-stone-800 sticky top-0 bg-white dark:bg-stone-900 z-10">
          <h3 className="font-bold text-stone-900 dark:text-white text-base">
            {resource.title[lang]}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-sm font-semibold bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg transition"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4" id="print-content">
          {isCard ? (
            <>
              <p className="text-sm text-stone-500 dark:text-stone-400 italic">
                {lang === 'es' ? 'Tus derechos — conócelos, compártelos.' : 'Know your rights — share this card.'}
              </p>
              <ul className="space-y-3">
                {resource.rights.map((r, i) => (
                  <li key={i} className="flex gap-3 text-sm text-stone-700 dark:text-stone-300">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">{i + 1}</span>
                    <span>{r[lang]}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300">
                <span className="font-semibold">{lang === 'es' ? 'Recuerda: ' : 'Remember: '}</span>
                {resource.reminder[lang]}
              </div>
            </>
          ) : (
            resource.sections.map((section, si) => (
              <div key={si}>
                <h4 className="font-bold text-stone-800 dark:text-white text-sm mb-2">{section.heading[lang]}</h4>
                <ul className="space-y-1.5">
                  {section.items.map((item, ii) => (
                    <li key={ii} className="flex gap-2 text-sm text-stone-600 dark:text-stone-300">
                      <span className="flex-shrink-0 mt-1 w-4 h-4 border-2 border-stone-300 dark:border-stone-600 rounded" />
                      {item[lang]}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
          <p className="text-xs text-stone-400 dark:text-stone-600 pt-2 border-t border-stone-100 dark:border-stone-800">
            ResourceBridge · resourcebridge-v64j.onrender.com
          </p>
        </div>
      </div>
    </div>
  );
}

function RightsCard({ card, lang, onPrint }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = card.icon;

  return (
    <div className={`rounded-2xl border ${card.border} bg-white dark:bg-stone-900 overflow-hidden transition-shadow hover:shadow-md`}>
      {/* Header */}
      <div
        className="flex items-center gap-4 p-5 cursor-pointer select-none"
        onClick={() => setExpanded(v => !v)}
      >
        <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={20} className={card.color} />
        </div>
        <div className="flex-1 min-w-0">
          <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${card.badge} mb-1`}>
            {card.category[lang]}
          </span>
          <h3 className="font-bold text-stone-800 dark:text-white text-sm leading-snug">
            {card.title[lang]}
          </h3>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onPrint(card); }}
            className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
            title={lang === 'es' ? 'Imprimir' : 'Print'}
          >
            <Printer size={15} />
          </button>
          {expanded
            ? <ChevronUp size={16} className="text-stone-400" />
            : <ChevronDown size={16} className="text-stone-400" />
          }
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-3 border-t border-stone-100 dark:border-stone-800 pt-4">
          <ul className="space-y-3">
            {card.rights.map((r, i) => (
              <li key={i} className="flex gap-3 text-sm text-stone-600 dark:text-stone-300">
                <span className={`flex-shrink-0 w-5 h-5 ${card.bg} ${card.color} rounded-full flex items-center justify-center text-xs font-bold mt-0.5`}>
                  {i + 1}
                </span>
                <span className="leading-relaxed">{r[lang]}</span>
              </li>
            ))}
          </ul>
          <div className="mt-1 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <span className="font-semibold">{lang === 'es' ? '⚑ Recuerda: ' : '⚑ Remember: '}</span>
            {card.reminder[lang]}
          </div>
        </div>
      )}
    </div>
  );
}

function ChecklistCard({ checklist, lang, onPrint }) {
  const [expanded, setExpanded] = useState(false);
  const [checked, setChecked] = useState({});
  const Icon = checklist.icon;

  const totalItems = checklist.sections.reduce((acc, s) => acc + s.items.length, 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;

  const toggleItem = (key) => setChecked(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className={`rounded-2xl border ${checklist.border} bg-white dark:bg-stone-900 overflow-hidden transition-shadow hover:shadow-md`}>
      {/* Header */}
      <div
        className="flex items-center gap-4 p-5 cursor-pointer select-none"
        onClick={() => setExpanded(v => !v)}
      >
        <div className={`w-10 h-10 rounded-xl ${checklist.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={20} className={checklist.color} />
        </div>
        <div className="flex-1 min-w-0">
          <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${checklist.badge} mb-1`}>
            {lang === 'es' ? 'Lista de Verificación' : 'Checklist'}
          </span>
          <h3 className="font-bold text-stone-800 dark:text-white text-sm leading-snug">
            {checklist.title[lang]}
          </h3>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {checkedCount > 0 && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${checklist.badge}`}>
              {checkedCount}/{totalItems}
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onPrint(checklist); }}
            className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
            title={lang === 'es' ? 'Imprimir' : 'Print'}
          >
            <Printer size={15} />
          </button>
          {expanded
            ? <ChevronUp size={16} className="text-stone-400" />
            : <ChevronDown size={16} className="text-stone-400" />
          }
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-stone-100 dark:border-stone-800 pt-4">
          <p className="text-xs text-stone-500 dark:text-stone-400 italic leading-relaxed">
            {checklist.subtitle[lang]}
          </p>
          {checkedCount > 0 && (
            <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${checklist.color.replace('text-', 'bg-')}`}
                style={{ width: `${(checkedCount / totalItems) * 100}%` }}
              />
            </div>
          )}
          {checklist.sections.map((section, si) => (
            <div key={si}>
              <h4 className="font-bold text-stone-700 dark:text-stone-200 text-xs uppercase tracking-wide mb-2">
                {section.heading[lang]}
              </h4>
              <ul className="space-y-2">
                {section.items.map((item, ii) => {
                  const key = `${si}-${ii}`;
                  const isChecked = !!checked[key];
                  return (
                    <li
                      key={ii}
                      className="flex items-start gap-3 cursor-pointer group"
                      onClick={() => toggleItem(key)}
                    >
                      <div className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition ${isChecked ? `${checklist.color.replace('text-', 'bg-').replace('-600', '-500')} border-transparent` : 'border-stone-300 dark:border-stone-600 group-hover:border-stone-400'}`}>
                        {isChecked && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm leading-relaxed transition ${isChecked ? 'line-through text-stone-400 dark:text-stone-600' : 'text-stone-600 dark:text-stone-300'}`}>
                        {item[lang]}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {checkedCount > 0 && (
            <button
              onClick={() => setChecked({})}
              className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition mt-1"
            >
              {lang === 'es' ? 'Restablecer lista' : 'Reset checklist'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function ResourceLibrary() {
  const { lang } = useLanguage();
  const [tab, setTab] = useState('rights'); // 'rights' | 'checklists'
  const [printResource, setPrintResource] = useState(null);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen size={17} className="text-white" />
          </div>
          <h2 className="text-xl font-black text-stone-900 dark:text-white tracking-tight">
            {lang === 'es' ? 'Biblioteca de Recursos' : 'Resource Library'}
          </h2>
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400 ml-12">
          {lang === 'es'
            ? 'Información bilingüe para ayudar a tu familia a mantenerse informada y preparada.'
            : 'Bilingual information to help your family stay informed and prepared.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab('rights')}
          className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition border ${
            tab === 'rights'
              ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-blue-300 dark:hover:border-blue-700'
          }`}
        >
          <Shield size={15} />
          {lang === 'es' ? 'Tus Derechos' : 'Know Your Rights'}
        </button>
        <button
          onClick={() => setTab('checklists')}
          className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition border ${
            tab === 'checklists'
              ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-blue-300 dark:hover:border-blue-700'
          }`}
        >
          <CheckSquare size={15} />
          {lang === 'es' ? 'Listas de Verificación' : 'Checklists'}
        </button>
      </div>

      {/* Content */}
      {tab === 'rights' && (
        <div className="space-y-3">
          <p className="text-xs text-stone-400 dark:text-stone-500 mb-4">
            {lang === 'es'
              ? 'Haz clic en cualquier tarjeta para expandirla · Imprime para tener una copia física.'
              : 'Click any card to expand it · Print to keep a physical copy.'}
          </p>
          {RIGHTS_CARDS.map(card => (
            <RightsCard key={card.id} card={card} lang={lang} onPrint={setPrintResource} />
          ))}
        </div>
      )}

      {tab === 'checklists' && (
        <div className="space-y-3">
          <p className="text-xs text-stone-400 dark:text-stone-500 mb-4">
            {lang === 'es'
              ? 'Marca los elementos mientras los completas · Imprime para compartir con tu familia.'
              : 'Check items off as you complete them · Print to share with your family.'}
          </p>
          {CHECKLISTS.map(checklist => (
            <ChecklistCard key={checklist.id} checklist={checklist} lang={lang} onPrint={setPrintResource} />
          ))}
        </div>
      )}

      {/* Print modal */}
      {printResource && (
        <PrintModal
          resource={printResource}
          lang={lang}
          onClose={() => setPrintResource(null)}
        />
      )}

      {/* Footer note */}
      <div className="mt-8 p-4 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 text-xs text-stone-400 dark:text-stone-500 leading-relaxed">
        <span className="font-semibold text-stone-500 dark:text-stone-400">
          {lang === 'es' ? 'Nota: ' : 'Note: '}
        </span>
        {lang === 'es'
          ? 'Esta información es educativa y no constituye asesoramiento legal. Contacta a un abogado o a una organización de ayuda legal para tu situación específica.'
          : 'This information is educational and does not constitute legal advice. Contact an attorney or legal aid organization for your specific situation.'}
      </div>
    </div>
  );
}