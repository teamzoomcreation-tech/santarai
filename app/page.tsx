"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, memo } from "react"
import { motion } from "framer-motion"
import {
  ArrowRight,
  Bot,
  Shield,
  TrendingUp,
  Code,
  ChevronRight,
  Upload,
  FileText,
  Zap,
  Crown,
  Globe,
  ChevronDown,
} from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { useLanguage } from "@/components/providers/LanguageProvider"

// --- i18n: contentDict multi-langues (FR, EN, ES, DE, AR) ---
import type { Language } from "@/lib/i18n"
import { LANG_OPTIONS } from "@/lib/i18n"

const contentDict = {
  fr: {
    nav: { login: "Connexion", cta: "Accès QG" },
    hero: {
      badge: "SantarAI OS V2.0 LIVE",
      title: "SantarAI : La première plateforme de virtualisation d'entreprise.",
      subtitle: "Ne gérez plus des employés. Orchestrez des Intelligences. Déployez une force de travail infinie, disponible 24/7.",
      ctaPrimary: "Recruter mon premier Salarié",
      ctaSecondary: "Voir la démo",
      memoryCta: "Accéder à la Mémoire",
      terminal: {
        file: "system_logs.txt",
        line1: 'GHOST a généré "Campagne Q3" (Cost: 50TK)',
        line2: "Recharge Trésorerie : +100 000 TK confirmée.",
        line3: "RADAR a détecté 3 nouveaux concurrents.",
        line4: 'DAIMYO analyse le contrat "NDA_Client_v2.pdf"...',
      },
    },
    demo: {
      label: "SantarAI DASHBOARD V2",
      title: "Interface de Commandement",
      badge: "Vue Temps Réel Active",
    },
    useCases: {
      title: "Un Salarié pour chaque Mission",
    marketing: {
        tab: "marketing",
      title: "Domination LinkedIn",
      desc: "GHOST analyse les tendances et rédige des posts viraux qui captivent votre audience.",
      output:
        ">> TÂCHE: Thread Viral [En cours]...\n[1/5] L'Effectif Digital ne remplacera pas les créateurs.\nElle remplacera ceux qui l'ignorent.\nVoici 3 leviers pour survivre :\n[2/5] Le levier de la Vitesse...",
    },
    legal: {
        tab: "legal",
      title: "Audit Contractuel",
      desc: "DAIMYO scanne vos PDF juridiques et surligne les clauses dangereuses en 3 secondes.",
      output:
        ">> ANALYSE JURIDIQUE : NDA_Partner_v2.pdf\n[DANGER DETECTÉ] Clause 4.2 : Renouvellement Tacite non conforme.\n[ACTION] Recommandation : Passer le préavis à 30 jours.\n[STATUS] Correction appliquée.",
    },
    dev: {
        tab: "dev",
      title: "Refactoring Code",
      desc: "SENSEI nettoie votre dette technique et commente votre code automatiquement.",
      output:
        ">> OPTIMISATION : api/routes/users.ts\n- Complexité réduite de O(n^2) à O(n)\n- Ajout de types TypeScript stricts\n- Documentation JSDoc générée.\n[TESTS] 42/42 Passés.",
    },
    },
    squad: {
      title: "Le Pôle Fondateur",
      subtitle: "Quatre salariés d'élite qui incarnent la puissance SantarAI.",
      recruit: "Recruter",
      ghost: { name: "GHOST", role: "LinkedIn Expert", desc: "Posts viraux et carrousels qui dominent votre audience." },
      mecha: { name: "MECHA", role: "Debugger", desc: "Machine de guerre qui répare les erreurs en temps réel." },
      daimyo: { name: "DAIMYO", role: "Legal", desc: "Contrats, NDA, CGV. La Loi à vos côtés." },
      oracle: { name: "ORACLE", role: "SQL Wizard", desc: "Source de vérité. Parle à la Data." },
    },
    memory: {
      title: "Mémoire Commune",
      subtitle: "Uploadez vos documents de référence. L'effectif digital les consulte pour travailler.",
      dropzone: "Glissez vos PDF, fichiers texte ou ressources ici — ou cliquez pour parcourir",
      hint: "PDF, TXT, MD, CSV supportés • Max 10 Mo par fichier",
    },
    roi: {
      title: "Rentabilité Immédiate",
      subtitle: "Coût d'un humain vs Coût de SantarAI.",
      employees: "Employés à remplacer",
      experts: "Expert(s)",
      costHuman: "Coût Humain (Est.)",
      costSantai: "Coût SantarAI Pro",
      gain: "Gain Net Mensuel",
      cta: "Récupérer ce budget",
    },
    pricing: {
      title: "Prêt à virtualiser ?",
      starter: { name: "Starter", tagline: "Auto-entrepreneur", price: "14,90€", features: ["250k Tokens", "3 Salariés"], cta: "Choisir" },
      pro: { name: "Pro", tagline: "Business", price: "49€", features: ["1M Tokens", "Accès Complet"], cta: "Choisir" },
      corpo: { name: "Enterprise", tagline: "Collaboration Équipe", price: "129€", features: ["3M Tokens", "Collaboration Équipe"], cta: "Accès Prioritaire" },
    },
    footer: "© 2026 SantarAI Systems. Tous droits réservés.",
  },
  en: {
    nav: { login: "Login", cta: "Access HQ" },
    hero: {
      badge: "SantarAI OS V2.0 LIVE",
      title: "SantarAI: The first enterprise virtualization platform.",
      subtitle: "Stop managing employees. Orchestrate Intelligences. Deploy an infinite workforce, available 24/7.",
      ctaPrimary: "Recruit my first Staff",
      ctaSecondary: "See the demo",
      memoryCta: "Access Memory",
      terminal: {
        file: "system_logs.txt",
        line1: 'GHOST generated "Q3 Campaign" (Cost: 50TK)',
        line2: "Treasury reload: +100,000 TK confirmed.",
        line3: "RADAR detected 3 new competitors.",
        line4: 'DAIMYO analyzing contract "NDA_Client_v2.pdf"...',
      },
    },
    demo: {
      label: "SantarAI DASHBOARD V2",
      title: "Command Interface",
      badge: "Real-time View Active",
    },
    useCases: {
      title: "One Staff for each Mission",
      marketing: {
        tab: "marketing",
        title: "LinkedIn Domination",
        desc: "GHOST analyzes trends and writes viral posts that captivate your audience.",
        output:
          ">> TASK: Viral Thread [In progress]...\n[1/5] AI won't replace creators.\nIt will replace those who ignore it.\n3 levers to survive:\n[2/5] The Speed lever...",
      },
      legal: {
        tab: "legal",
        title: "Contractual Audit",
        desc: "DAIMYO scans your legal PDFs and highlights dangerous clauses in 3 seconds.",
        output:
          ">> LEGAL ANALYSIS: NDA_Partner_v2.pdf\n[DANGER DETECTED] Clause 4.2: Tacit renewal non-compliant.\n[ACTION] Recommendation: Set notice to 30 days.\n[STATUS] Correction applied.",
      },
      dev: {
        tab: "dev",
        title: "Code Refactoring",
        desc: "SENSEI cleans your tech debt and comments your code automatically.",
        output:
          ">> OPTIMIZATION: api/routes/users.ts\n- Complexity reduced from O(n^2) to O(n)\n- Strict TypeScript types added\n- JSDoc documentation generated.\n[TESTS] 42/42 Passed.",
      },
    },
    squad: {
      title: "The Founding Department",
      subtitle: "Four elite agents embodying SantarAI's power.",
      recruit: "Recruit",
      ghost: { name: "GHOST", role: "LinkedIn Expert", desc: "Viral posts and carousels that dominate your audience." },
      mecha: { name: "MECHA", role: "Debugger", desc: "War machine that fixes errors in real-time." },
      daimyo: { name: "DAIMYO", role: "Legal", desc: "Contracts, NDA, T&C. The Law on your side." },
      oracle: { name: "ORACLE", role: "SQL Wizard", desc: "Source of truth. Speaks to Data." },
    },
    memory: {
      title: "Shared Memory",
      subtitle: "Upload your reference documents. Digital workforce consults them to work.",
      dropzone: "Drag your PDFs, text files or resources here — or click to browse",
      hint: "PDF, TXT, MD, CSV supported • Max 10 MB per file",
    },
    roi: {
      title: "Immediate ROI",
      subtitle: "Human cost vs SantarAI cost.",
      employees: "Employees to replace",
      experts: "Expert(s)",
      costHuman: "Human Cost (Est.)",
      costSantai: "SantarAI Pro Cost",
      gain: "Net Monthly Gain",
      cta: "Claim this budget",
    },
    pricing: {
      title: "Ready to virtualize?",
      starter: { name: "Starter", tagline: "Freelancer", price: "14,90€", features: ["250k Tokens", "3 Staff"], cta: "Choose" },
      pro: { name: "Pro", tagline: "Business", price: "49€", features: ["1M Tokens", "Full Access"], cta: "Choose" },
      corpo: { name: "Enterprise", tagline: "Team Collaboration", price: "129€", features: ["3M Tokens", "Team Collaboration"], cta: "Priority Access" },
    },
    footer: "© 2026 SantarAI Systems. All rights reserved.",
  },
  es: {
    nav: { login: "Iniciar sesión", cta: "Acceso HQ" },
    hero: {
      badge: "SantarAI OS V2.0 LIVE",
      title: "SantarAI: La primera plataforma de virtualización empresarial.",
      subtitle: "Deje de gestionar empleados. Orqueste Inteligencias. Despliegue una fuerza de trabajo infinita, disponible 24/7.",
      ctaPrimary: "Reclutar mi primer Salarié",
      ctaSecondary: "Ver la demo",
      memoryCta: "Acceder a la Memoria",
      terminal: {
        file: "system_logs.txt",
        line1: 'GHOST generó "Campaña Q3" (Coste: 50TK)',
        line2: "Recarga Tesorería: +100.000 TK confirmada.",
        line3: "RADAR detectó 3 nuevos competidores.",
        line4: 'DAIMYO analiza el contrato "NDA_Client_v2.pdf"...',
      },
    },
    demo: { label: "SantarAI DASHBOARD V2", title: "Interfaz de Mando", badge: "Vista en Tiempo Real Activa" },
    useCases: {
      title: "Un Salarié para cada Misión",
      marketing: {
        tab: "marketing",
        title: "Dominación LinkedIn",
        desc: "GHOST analiza tendencias y escribe posts virales que cautivan a tu audiencia.",
        output: ">> TAREA: Hilo Viral [En curso]...\n[1/5] La IA no reemplazará a los creadores.\nReemplazará a quienes la ignoren.\n3 palancas para sobrevivir:\n[2/5] La palanca de la Velocidad...",
      },
      legal: {
        tab: "legal",
        title: "Auditoría Contractual",
        desc: "DAIMYO escanea tus PDFs jurídicos y resalta cláusulas peligrosas en 3 segundos.",
        output: ">> ANÁLISIS JURÍDICO: NDA_Partner_v2.pdf\n[PELIGRO DETECTADO] Cláusula 4.2: Renovación tácita no conforme.\n[ACCIÓN] Recomendación: Plazo de preaviso a 30 días.\n[ESTADO] Corrección aplicada.",
      },
      dev: {
        tab: "dev",
        title: "Refactorización de Código",
        desc: "SENSEI limpia tu deuda técnica y comenta tu código automáticamente.",
        output: ">> OPTIMIZACIÓN: api/routes/users.ts\n- Complejidad reducida de O(n²) a O(n)\n- Tipos TypeScript estrictos añadidos\n- Documentación JSDoc generada.\n[TEST] 42/42 Pasados.",
      },
    },
    squad: {
      title: "El Departamento Fundador",
      subtitle: "Cuatro agentes de élite que encarnan el poder SantarAI.",
      recruit: "Reclutar",
      ghost: { name: "GHOST", role: "Experto LinkedIn", desc: "Posts virales y carruseles que dominan tu audiencia." },
      mecha: { name: "MECHA", role: "Debugger", desc: "Máquina de guerra que repara errores en tiempo real." },
      daimyo: { name: "DAIMYO", role: "Legal", desc: "Contratos, NDA, T&C. La Ley de tu lado." },
      oracle: { name: "ORACLE", role: "SQL Wizard", desc: "Fuente de verdad. Habla con los Datos." },
    },
    memory: {
      title: "Memoria Compartida",
      subtitle: "Sube tus documentos de referencia. Los agentes los consultan para trabajar.",
      dropzone: "Arrastra tus PDF, archivos de texto o recursos aquí — o haz clic para explorar",
      hint: "PDF, TXT, MD, CSV soportados • Máx 10 MB por archivo",
    },
    roi: {
      title: "ROI Inmediato",
      subtitle: "Coste humano vs coste SantarAI.",
      employees: "Empleados a reemplazar",
      experts: "Experto(s)",
      costHuman: "Coste Humano (Est.)",
      costSantai: "Coste SantarAI Pro",
      gain: "Ganancia Neta Mensual",
      cta: "Reclamar este presupuesto",
    },
    pricing: {
      title: "¿Listo para virtualizar?",
      starter: { name: "Starter", tagline: "Autónomo", price: "14,90€", features: ["250k Tokens", "3 Salariés"], cta: "Elegir" },
      pro: { name: "Pro", tagline: "Negocios", price: "49€", features: ["1M Tokens", "Accès Complet"], cta: "Elegir" },
      corpo: { name: "Enterprise", tagline: "Colaboración Equipo", price: "129€", features: ["3M Tokens", "Colaboración Equipo"], cta: "Acceso Prioritario" },
    },
    footer: "© 2026 SantarAI Systems. Todos los derechos reservados.",
  },
  de: {
    nav: { login: "Anmelden", cta: "HQ-Zugang" },
    hero: {
      badge: "SantarAI OS V2.0 LIVE",
      title: "SantarAI: Die erste Unternehmensvirtualisierungsplattform.",
      subtitle: "Verwalten Sie keine Mitarbeiter mehr. Orchestrieren Sie Intelligenzen. Setzen Sie eine unendliche Belegschaft ein, 24/7 verfügbar.",
      ctaPrimary: "Meinen ersten Salarié rekrutieren",
      ctaSecondary: "Demo ansehen",
      memoryCta: "Speicher zugreifen",
      terminal: {
        file: "system_logs.txt",
        line1: 'GHOST hat "Q3-Kampagne" erstellt (Kosten: 50TK)',
        line2: "Schatzkammer-Aufladung: +100.000 TK bestätigt.",
        line3: "RADAR hat 3 neue Wettbewerber erkannt.",
        line4: 'DAIMYO analysiert Vertrag "NDA_Client_v2.pdf"...',
      },
    },
    demo: { label: "SantarAI DASHBOARD V2", title: "Befehlsinterface", badge: "Echtzeit-Ansicht aktiv" },
    useCases: {
      title: "Ein Salarié pro Mission",
      marketing: {
        tab: "marketing",
        title: "LinkedIn-Dominanz",
        desc: "GHOST analysiert Trends und schreibt virale Posts, die Ihr Publikum fesseln.",
        output: ">> AUFGABE: Viraler Thread [Läuft]...\n[1/5] KI wird keine Kreativen ersetzen.\nSie wird die ersetzen, die sie ignorieren.\n3 Hebel zum Überleben:\n[2/5] Der Geschwindigkeitshebel...",
      },
      legal: {
        tab: "legal",
        title: "Vertragsprüfung",
        desc: "DAIMYO scannt Ihre rechtlichen PDFs und hebt gefährliche Klauseln in 3 Sekunden hervor.",
        output: ">> RECHTSANALYSE: NDA_Partner_v2.pdf\n[GEFAHR ERKANNT] Klausel 4.2: Stillschweigende Verlängerung nicht konform.\n[AKTION] Empfehlung: Kündigungsfrist auf 30 Tage setzen.\n[STATUS] Korrektur angewendet.",
      },
      dev: {
        tab: "dev",
        title: "Code-Refactoring",
        desc: "SENSEI bereinigt Ihre technische Schuld und kommentiert Ihren Code automatisch.",
        output: ">> OPTIMIERUNG: api/routes/users.ts\n- Komplexität von O(n²) auf O(n) reduziert\n- Strenge TypeScript-Typen hinzugefügt\n- JSDoc-Dokumentation generiert.\n[TESTS] 42/42 Bestanden.",
      },
    },
    squad: {
      title: "Das Gründungsteam",
      subtitle: "Vier Elite-Salariés, die die Kraft von SantarAI verkörpern.",
      recruit: "Rekrutieren",
      ghost: { name: "GHOST", role: "LinkedIn-Experte", desc: "Virale Posts und Karussells, die Ihr Publikum dominieren." },
      mecha: { name: "MECHA", role: "Debugger", desc: "Kriegsmaschine, die Fehler in Echtzeit behebt." },
      daimyo: { name: "DAIMYO", role: "Legal", desc: "Verträge, NDA, AGB. Das Recht an Ihrer Seite." },
      oracle: { name: "ORACLE", role: "SQL Wizard", desc: "Quelle der Wahrheit. Spricht mit Daten." },
    },
    memory: {
      title: "Gemeinsamer Speicher",
      subtitle: "Laden Sie Ihre Referenzdokumente hoch. Der digitale Effectif konsultiert sie für die Arbeit.",
      dropzone: "Ziehen Sie Ihre PDFs, Textdateien oder Ressourcen hierher — oder klicken Sie zum Durchsuchen",
      hint: "PDF, TXT, MD, CSV unterstützt • Max 10 MB pro Datei",
    },
    roi: {
      title: "Sofortiger ROI",
      subtitle: "Menschliche Kosten vs. SantarAI-Kosten.",
      employees: "Zu ersetzende Mitarbeiter",
      experts: "Experte(n)",
      costHuman: "Menschliche Kosten (geschätzt)",
      costSantai: "SantarAI Pro Kosten",
      gain: "Netto-Monatsgewinn",
      cta: "Dieses Budget beanspruchen",
    },
    pricing: {
      title: "Bereit zu virtualisieren?",
      starter: { name: "Starter", tagline: "Freelancer", price: "14,90€", features: ["250k Tokens", "3 Salariés"], cta: "Wählen" },
      pro: { name: "Pro", tagline: "Business", price: "49€", features: ["1M Tokens", "Accès Complet"], cta: "Wählen" },
      corpo: { name: "Enterprise", tagline: "Team-Kollaboration", price: "129€", features: ["3M Tokens", "Team-Kollaboration"], cta: "Prioritätszugang" },
    },
    footer: "© 2026 SantarAI Systems. Alle Rechte vorbehalten.",
  },
  ar: {
    nav: { login: "تسجيل الدخول", cta: "الوصول للمقر" },
    hero: {
      badge: "SantarAI OS V2.0 LIVE",
      title: "SantarAI: أول منصة لتأمين المؤسسات.",
      subtitle: "توقف عن إدارة الموظفين. نظّم الذكاءات. انشر قوة عمل لا نهائية، متاحة 24/7.",
      ctaPrimary: "توظيف وكيلي الأول",
      ctaSecondary: "عرض العرض التوضيحي",
      memoryCta: "الوصول للذاكرة",
      terminal: {
        file: "system_logs.txt",
        line1: 'GHOST أنشأ "حملة الربع الثالث" (التكلفة: 50TK)',
        line2: "إعادة شحن الخزينة: +100,000 TK مؤكدة.",
        line3: "RADAR اكتشف 3 منافسين جدد.",
        line4: 'DAIMYO يحلل العقد "NDA_Client_v2.pdf"...',
      },
    },
    demo: { label: "SantarAI DASHBOARD V2", title: "واجهة القيادة", badge: "عرض فوري نشط" },
    useCases: {
      title: "وكيل واحد لكل مهمة",
      marketing: {
        tab: "marketing",
        title: "الهيمنة على لينكد إن",
        desc: "GHOST يحلل الاتجاهات ويكتب منشورات فيروسية تجذب جمهورك.",
        output: ">> المهمة: خيط فيروسي [قيد التنفيذ]...\n[1/5] الذكاء الاصطناعي لن يحل محل المبدعين.\nسيحل محل من يتجاهلونه.\n3 رافعات للبقاء:\n[2/5] رافعة السرعة...",
      },
      legal: {
        tab: "legal",
        title: "المراجعة التعاقدية",
        desc: "DAIMYO يفحص ملفاتك القانونية ويبرز البنود الخطرة في 3 ثوانٍ.",
        output: ">> التحليل القانوني: NDA_Partner_v2.pdf\n[خطر مكتشف] البند 4.2: التجديد الضمني غير متوافق.\n[إجراء] التوصية: تحديد مهلة الإشعار إلى 30 يوماً.\n[الحالة] تم تطبيق التصحيح.",
      },
      dev: {
        tab: "dev",
        title: "إعادة هيكلة الكود",
        desc: "SENSEI ينظف ديونك التقنية ويعلق على كودك تلقائياً.",
        output: ">> التحسين: api/routes/users.ts\n- انخفاض التعقيد من O(n²) إلى O(n)\n- إضافة أنواع TypeScript صارمة\n- توثيق JSDoc مُنشأ.\n[الاختبارات] 42/42 نجحت.",
      },
    },
    squad: {
      title: "الفريق المؤسس",
      subtitle: "أربعة وكلاء نخبة يجسدون قوة SantarAI.",
      recruit: "توظيف",
      ghost: { name: "GHOST", role: "خبير لينكد إن", desc: "منشورات فيروسية وكاروسيلات تهيمن على جمهورك." },
      mecha: { name: "MECHA", role: "مصحح أخطاء", desc: "آلة حرب تصلح الأخطاء في الوقت الفعلي." },
      daimyo: { name: "DAIMYO", role: "قانوني", desc: "عقود، اتفاقيات سرية، شروط. القانون إلى جانبك." },
      oracle: { name: "ORACLE", role: "ساحر SQL", desc: "مصدر الحقيقة. يتحدث مع البيانات." },
    },
    memory: {
      title: "الذاكرة المشتركة",
      subtitle: "ارفع مستنداتك المرجعية. الوكلاء يستشيرونها للعمل.",
      dropzone: "اسحب ملفات PDF أو النصوص أو الموارد هنا — أو انقر للتصفح",
      hint: "PDF, TXT, MD, CSV مدعومة • الحد الأقصى 10 ميجابايت لكل ملف",
    },
    roi: {
      title: "عائد الاستثمار الفوري",
      subtitle: "تكلفة الإنسان مقابل تكلفة SantarAI.",
      employees: "موظفون للاستبدال",
      experts: "خبير(ون)",
      costHuman: "التكلفة البشرية (تقدير)",
      costSantai: "تكلفة SantarAI Pro",
      gain: "الربح الصافي الشهري",
      cta: "استرداد هذا الميزانية",
    },
    pricing: {
      title: "مستعد للتأمين؟",
      starter: { name: "Starter", tagline: "مستقل", price: "29€", features: ["100k TK", "وكيل واحد"], cta: "اختيار" },
      pro: { name: "Pro", tagline: "أعمال", price: "99€", features: ["500k TK", "3 وكلاء"], cta: "اختيار" },
      corpo: { name: "Enterprise", tagline: "تعاون الفريق", price: "129€", features: ["3M Tokens", "تعاون الفريق"], cta: "وصول أولوية" },
    },
    footer: "© 2026 SantarAI Systems. جميع الحقوق محفوظة.",
  },
} as const

// Pool de logs par langue pour terminal dynamique
const TERMINAL_LOGS_POOL_FR = [
  { tag: "SUCCESS", color: "text-green-500", msg: 'GHOST a généré "Campagne Q3" (Cost: 50TK)' },
  { tag: "SYSTEM", color: "text-purple-500", msg: "Recharge Trésorerie : +100 000 TK confirmée." },
  { tag: "SUCCESS", color: "text-green-500", msg: "RADAR a détecté 3 nouveaux concurrents." },
  { tag: "WAITING", color: "text-yellow-500", msg: 'DAIMYO analyse le contrat "NDA_Client_v2.pdf"...' },
  { tag: "SUCCESS", color: "text-green-500", msg: "PIXEL a finalisé le visuel Brand_2026.png" },
  { tag: "SYSTEM", color: "text-purple-500", msg: "Sync QG → 4 agents en ligne." },
  { tag: "SUCCESS", color: "text-green-500", msg: "ORACLE a optimisé 12 requêtes SQL." },
  { tag: "WAITING", color: "text-yellow-500", msg: "MECHA débogue api/auth.ts..." },
  { tag: "SUCCESS", color: "text-green-500", msg: "KATANA a publié le thread viral (2.1k vues)" },
  { tag: "SYSTEM", color: "text-purple-500", msg: "Backup mémoire commune effectué." },
]
const TERMINAL_LOGS_POOL_EN = [
  { tag: "SUCCESS", color: "text-green-500", msg: 'GHOST generated "Q3 Campaign" (Cost: 50TK)' },
  { tag: "SYSTEM", color: "text-purple-500", msg: "Treasury reload: +100,000 TK confirmed." },
  { tag: "SUCCESS", color: "text-green-500", msg: "RADAR detected 3 new competitors." },
  { tag: "WAITING", color: "text-yellow-500", msg: 'DAIMYO analyzing contract "NDA_Client_v2.pdf"...' },
  { tag: "SUCCESS", color: "text-green-500", msg: "PIXEL finalized Brand_2026.png" },
  { tag: "SYSTEM", color: "text-purple-500", msg: "Sync HQ → 4 agents online." },
  { tag: "SUCCESS", color: "text-green-500", msg: "ORACLE optimized 12 SQL queries." },
  { tag: "WAITING", color: "text-yellow-500", msg: "MECHA debugging api/auth.ts..." },
  { tag: "SUCCESS", color: "text-green-500", msg: "KATANA published viral thread (2.1k views)" },
  { tag: "SYSTEM", color: "text-purple-500", msg: "Shared memory backup completed." },
]
const TERMINAL_LOGS_POOL_ES = [
  { tag: "SUCCESS", color: "text-green-500", msg: 'GHOST generó "Campaña Q3" (Coste: 50TK)' },
  { tag: "SYSTEM", color: "text-purple-500", msg: "Recarga Tesorería: +100.000 TK confirmada." },
  { tag: "SUCCESS", color: "text-green-500", msg: "RADAR detectó 3 nuevos competidores." },
  { tag: "WAITING", color: "text-yellow-500", msg: 'DAIMYO analiza el contrato "NDA_Client_v2.pdf"...' },
  { tag: "SUCCESS", color: "text-green-500", msg: "PIXEL finalizó Brand_2026.png" },
  { tag: "SYSTEM", color: "text-purple-500", msg: "Sync HQ → 4 agentes en línea." },
  { tag: "SUCCESS", color: "text-green-500", msg: "ORACLE optimizó 12 consultas SQL." },
  { tag: "WAITING", color: "text-yellow-500", msg: "MECHA depurando api/auth.ts..." },
  { tag: "SUCCESS", color: "text-green-500", msg: "KATANA publicó hilo viral (2.1k vistas)" },
  { tag: "SYSTEM", color: "text-purple-500", msg: "Backup memoria compartida completado." },
]
const TERMINAL_LOGS_POOL_DE = [
  { tag: "SUCCESS", color: "text-green-500", msg: 'GHOST hat "Q3-Kampagne" erstellt (Kosten: 50TK)' },
  { tag: "SYSTEM", color: "text-purple-500", msg: "Schatzkammer-Aufladung: +100.000 TK bestätigt." },
  { tag: "SUCCESS", color: "text-green-500", msg: "RADAR hat 3 neue Wettbewerber erkannt." },
  { tag: "WAITING", color: "text-yellow-500", msg: 'DAIMYO analysiert Vertrag "NDA_Client_v2.pdf"...' },
  { tag: "SUCCESS", color: "text-green-500", msg: "PIXEL hat Brand_2026.png fertiggestellt" },
  { tag: "SYSTEM", color: "text-purple-500", msg: "Sync HQ → 4 Agenten online." },
  { tag: "SUCCESS", color: "text-green-500", msg: "ORACLE hat 12 SQL-Abfragen optimiert." },
  { tag: "WAITING", color: "text-yellow-500", msg: "MECHA debuggt api/auth.ts..." },
  { tag: "SUCCESS", color: "text-green-500", msg: "KATANA hat viralen Thread veröffentlicht (2.1k Aufrufe)" },
  { tag: "SYSTEM", color: "text-purple-500", msg: "Gemeinsamer Speicher-Backup abgeschlossen." },
]
const TERMINAL_LOGS_POOL_AR = [
  { tag: "SUCCESS", color: "text-green-500", msg: 'GHOST أنشأ "حملة الربع الثالث" (التكلفة: 50TK)' },
  { tag: "SYSTEM", color: "text-purple-500", msg: "إعادة شحن الخزينة: +100,000 TK مؤكدة." },
  { tag: "SUCCESS", color: "text-green-500", msg: "RADAR اكتشف 3 منافسين جدد." },
  { tag: "WAITING", color: "text-yellow-500", msg: 'DAIMYO يحلل العقد "NDA_Client_v2.pdf"...' },
  { tag: "SUCCESS", color: "text-green-500", msg: "PIXEL أنهى Brand_2026.png" },
  { tag: "SYSTEM", color: "text-purple-500", msg: "مزامنة المقر → 4 وكلاء متصلون." },
  { tag: "SUCCESS", color: "text-green-500", msg: "ORACLE حسّن 12 استعلام SQL." },
  { tag: "WAITING", color: "text-yellow-500", msg: "MECHA يصلح api/auth.ts..." },
  { tag: "SUCCESS", color: "text-green-500", msg: "KATANA نشر خيطاً فيروسياً (2.1k مشاهدة)" },
  { tag: "SYSTEM", color: "text-purple-500", msg: "تم إكمال نسخ الذاكرة المشتركة." },
]

const TERMINAL_LOGS_BY_LANG: Record<Language, typeof TERMINAL_LOGS_POOL_FR> = {
  fr: TERMINAL_LOGS_POOL_FR,
  en: TERMINAL_LOGS_POOL_EN,
  es: TERMINAL_LOGS_POOL_ES,
  de: TERMINAL_LOGS_POOL_DE,
  ar: TERMINAL_LOGS_POOL_AR,
}


const SQUAD_AGENTS = [
  { id: "ghost", color: "from-pink-500/30 to-purple-600/30", border: "border-pink-500/40" },
  { id: "mecha", color: "from-blue-500/30 to-cyan-600/30", border: "border-blue-500/40" },
  { id: "daimyo", color: "from-amber-500/30 to-yellow-600/30", border: "border-amber-500/40" },
  { id: "oracle", color: "from-cyan-500/30 to-teal-600/30", border: "border-cyan-500/40" },
] as const


const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 60, damping: 14 },
  },
}

const SquadCard = memo(function SquadCard({
  agent,
  data,
  recruitLabel,
  i,
}: {
  agent: (typeof SQUAD_AGENTS)[number]
  data: { name: string; role: string; desc: string }
  recruitLabel: string
  i: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.1, duration: 0.5 }}
      className="group relative rounded-2xl border border-white/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/10"
    >
      <div className={`relative z-10 rounded-2xl bg-gradient-to-b ${agent.color} p-6 backdrop-blur-sm border border-white/5 overflow-hidden`}>
        <div className="relative rounded-full w-24 h-24 mx-auto mb-4 overflow-hidden border-2 border-white/20 ring-2 ring-white/10">
          <Image src="/avatars/agent-base.png" alt={data.name} width={96} height={96} className="object-cover w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        <h3 className="text-xl font-bold text-center mb-1">{data.name}</h3>
        <p className="text-sm text-cyan-400/90 text-center mb-3 font-medium">{data.role}</p>
        <p className="text-slate-400 text-sm text-center">{data.desc}</p>
        <Link href="/signup" className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-white/90 hover:text-white transition-colors">
          {recruitLabel} <Zap size={14} aria-hidden />
        </Link>
      </div>
    </motion.div>
  )
})

export default function LandingPage() {
  const { currentLang: lang, setLanguage: setLang } = useLanguage()
  const [mounted, setMounted] = useState(false)
  const [employees, setEmployees] = useState(1)
  const [activeTab, setActiveTab] = useState<"marketing" | "legal" | "dev">("marketing")
  const [isDragging, setIsDragging] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [uploadProgress, setUploadProgress] = useState(0)
  const [langMenuOpen, setLangMenuOpen] = useState(false)

  const t = contentDict[lang] ?? contentDict.fr
  const terminalPool = TERMINAL_LOGS_BY_LANG[lang] ?? TERMINAL_LOGS_POOL_FR

  const [terminalLogs, setTerminalLogs] = useState(() =>
    TERMINAL_LOGS_POOL_FR.slice(0, 4).map((log, i) => ({ ...log, id: i }))
  )
  const [logIndex, setLogIndex] = useState(4)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const pool = TERMINAL_LOGS_BY_LANG[lang] ?? TERMINAL_LOGS_POOL_FR
    setTerminalLogs(pool.slice(0, 4).map((log, i) => ({ ...log, id: i })))
    setLogIndex(4)
  }, [lang])

  useEffect(() => {
    const pool = TERMINAL_LOGS_BY_LANG[lang] ?? TERMINAL_LOGS_POOL_FR
    const id = setInterval(() => {
      const nextLog = pool[logIndex % pool.length]
      setTerminalLogs((prev) => [...prev.slice(-4), { ...nextLog, id: Date.now() }])
      setLogIndex((i) => i + 1)
    }, 3000)
    return () => clearInterval(id)
  }, [logIndex, lang])

  useEffect(() => {
    const handleMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener("mousemove", handleMove)
    return () => window.removeEventListener("mousemove", handleMove)
  }, [])

  useEffect(() => {
    if (!isDragging) {
      setUploadProgress(0)
      return
    }
    const timer = setInterval(() => setUploadProgress((p) => Math.min(p + 15, 85)), 400)
    return () => clearInterval(timer)
  }, [isDragging])

  const useCases = {
    marketing: { title: t.useCases.marketing.title, desc: t.useCases.marketing.desc, output: t.useCases.marketing.output },
    legal: { title: t.useCases.legal.title, desc: t.useCases.legal.desc, output: t.useCases.legal.output },
    dev: { title: t.useCases.dev.title, desc: t.useCases.dev.desc, output: t.useCases.dev.output },
  }

  const squadData = {
    ghost: t.squad.ghost,
    mecha: t.squad.mecha,
    daimyo: t.squad.daimyo,
    oracle: t.squad.oracle,
  }

  const isRTL = lang === "ar"

  return (
    <div
      className={`min-h-screen bg-[#05050A] text-white selection:bg-purple-500/30 overflow-x-hidden font-sans ${isRTL ? "font-[system-ui,'Segoe UI',sans-serif]" : ""}`}
      dir={isRTL ? "rtl" : "ltr"}
      role="main"
      aria-label="SantarAI - Plateforme de virtualisation d'entreprise"
    >
      {/* --- BACKGROUND FX --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>
      {/* --- SCAN-LINE --- */}
      <div className="scanline-overlay" aria-hidden="true" />
      {/* --- MOUSE GLOW --- */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        aria-hidden="true"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(168, 85, 247, 0.06), transparent 40%)`,
        }}
      />

      <div className="relative z-10">
      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#05050A]/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center">
            <Logo className="h-20 w-auto" href="/" />
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            {mounted && (
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => setLangMenuOpen((o) => !o)}
                  onBlur={() => setTimeout(() => setLangMenuOpen(false), 150)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-colors text-sm"
                  aria-label="Sélectionner la langue"
                  aria-haspopup="listbox"
                  aria-expanded={langMenuOpen}
                >
                  <Globe size={16} aria-hidden />
                  <span>{LANG_OPTIONS.find((o) => o.code === lang)?.flag ?? "🇫🇷"}</span>
                  <span className="font-medium">{LANG_OPTIONS.find((o) => o.code === lang)?.label ?? "FR"}</span>
                  <ChevronDown size={14} className={`opacity-70 transition-transform ${langMenuOpen ? "rotate-180" : ""}`} aria-hidden />
                </button>
                <div
                  className={
                    "absolute top-full mt-1 min-w-[140px] py-1 bg-[#0A0A0F] border border-white/10 rounded-lg shadow-xl transition-all z-50 " +
                    (isRTL ? "left-0" : "right-0") +
                    " " +
                    (langMenuOpen ? "opacity-100 visible" : "opacity-0 invisible")
                  }
                >
                  {LANG_OPTIONS.map((opt) => (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => { setLang(opt.code); setLangMenuOpen(false) }}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-start text-sm hover:bg-white/10 transition-colors ${lang === opt.code ? "text-purple-400 bg-purple-500/10" : "text-slate-300"}`}
                    >
                      <span>{opt.flag}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Link href="/login" className="hidden md:block text-sm font-medium text-slate-300 hover:text-white transition-colors">
              {t.nav.login}
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2.5 bg-white text-black rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              {t.nav.cta}
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <motion.section
        className="relative z-10 pt-24 md:pt-40 pb-12 md:pb-20 px-4 md:px-6 text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={sectionVariants}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-bold mb-8 uppercase tracking-widest shadow-[0_0_15px_rgba(168,85,247,0.2)]"
        >
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          {t.hero.badge}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight mb-4 md:mb-8 leading-tight"
        >
          {t.hero.title.startsWith("SantarAI") ? (
            <>
              <span
                className="bg-clip-text text-transparent animate-hero-title-shimmer"
                style={{
                  backgroundImage: "linear-gradient(90deg, #22d3ee 0%, #a78bfa 25%, #ec4899 50%, #22d3ee 100%)",
                  WebkitBackgroundClip: "text",
                }}
              >
                Santar
              </span>
              <span className="brand-ai-glow">AI</span>
              <span
                className="bg-clip-text text-transparent animate-hero-title-shimmer"
                style={{
                  backgroundImage: "linear-gradient(90deg, #22d3ee 0%, #a78bfa 25%, #ec4899 50%, #22d3ee 100%)",
                  WebkitBackgroundClip: "text",
                }}
              >
                {t.hero.title.slice(8)}
              </span>
            </>
          ) : (
            <span
              className="bg-clip-text text-transparent animate-hero-title-shimmer"
              style={{
                backgroundImage: "linear-gradient(90deg, #22d3ee 0%, #a78bfa 25%, #ec4899 50%, #22d3ee 100%)",
                WebkitBackgroundClip: "text",
              }}
            >
              {t.hero.title}
          </span>
          )}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl lg:text-2xl text-slate-400 max-w-3xl mx-auto mb-6 md:mb-10 leading-relaxed font-light"
        >
          {t.hero.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link
            href="/signup"
            className="w-full sm:w-auto px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-base md:text-lg shadow-lg shadow-purple-500/25 hover:scale-105 transition-transform flex items-center justify-center gap-2"
          >
            {t.hero.ctaPrimary} <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="#demo" className="w-full sm:w-auto px-6 py-3 md:px-8 md:py-4 border border-white/10 hover:bg-white/5 text-slate-300 rounded-xl font-medium backdrop-blur-sm transition-colors">
            {t.hero.ctaSecondary}
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-3xl mx-auto bg-[#0A0A0F] rounded-t-xl border border-white/10 border-b-0 p-4 font-mono text-xs text-left shadow-2xl overflow-hidden h-32 relative"
        >
          <div className="flex gap-2 mb-4 border-b border-white/5 pb-2 opacity-50">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-2">{t.hero.terminal.file}</span>
          </div>
          <div className="space-y-2 text-slate-300 min-h-[4.5rem]">
            {terminalLogs.map((log, i) => (
              <motion.div
                key={(log as { id?: number }).id ?? i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-2 ${i === terminalLogs.length - 1 ? "animate-pulse" : ""}`}
              >
                <span className={log.color}>[{log.tag}]</span> {log.msg}
              </motion.div>
            ))}
          </div>
          <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#0A0A0F] to-transparent" />
        </motion.div>
      </motion.section>

      {/* --- 3D DASHBOARD PREVIEW --- */}
      <motion.section
        id="demo"
        className="relative z-20 -mt-2 px-6 pb-24"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={sectionVariants}
      >
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000" />
            <div className="relative rounded-2xl border border-white/10 bg-[#0A0A0F] overflow-hidden shadow-2xl transform transition-transform duration-700 hover:scale-[1.01]">
              <div className="aspect-[16/9] bg-slate-900 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
                <div className="text-center z-10">
                  <p className="text-blue-400 font-mono text-sm mb-2 tracking-widest">{t.demo.label}</p>
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 md:mb-6">{t.demo.title}</h3>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/50 rounded-full text-blue-300 text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    {t.demo.badge}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* --- ONGLETS USE CASES --- */}
      <motion.section
        className="py-12 md:py-24 bg-[#0A0A0F]/50 border-y border-white/5"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={sectionVariants}
      >
        <div className="container mx-auto px-4 md:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-bold mb-8 md:mb-12 text-center"
          >
            {t.useCases.title}
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 max-w-6xl mx-auto">
            <div className="md:col-span-4 space-y-3">
              {(["marketing", "legal", "dev"] as const).map((tab, i) => (
                <motion.button
                  key={tab}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 ${
                    activeTab === tab ? "bg-purple-900/20 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.15)]" : "border-white/5 text-slate-400 hover:bg-white/5"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${activeTab === tab ? "bg-purple-600" : "bg-slate-800"}`}>
                    {tab === "marketing" && <TrendingUp size={20} />}
                    {tab === "legal" && <Shield size={20} />}
                    {tab === "dev" && <Code size={20} />}
                  </div>
                  <span className="capitalize font-bold text-lg">{tab}</span>
                  <ChevronRight className={`ml-auto transition-transform ${activeTab === tab ? "rotate-90" : ""}`} size={16} />
                </motion.button>
              ))}
            </div>

            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="md:col-span-8 bg-black border border-white/10 rounded-2xl p-4 md:p-8 relative min-h-[280px] md:min-h-[350px] flex flex-col justify-center"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Bot size={100} />
              </div>
                <h3 className="text-2xl font-bold text-white mb-2">{useCases[activeTab].title}</h3>
                <p className="text-slate-400 mb-6">{useCases[activeTab].desc}</p>
                <div className="bg-[#1E1E2E] rounded-xl p-5 font-mono text-sm text-slate-300 border border-white/5 shadow-inner whitespace-pre-wrap leading-relaxed border-l-4 border-l-purple-500">
                  {useCases[activeTab].output}
                  <span className="inline-block w-2 h-4 bg-purple-500 ml-1 animate-pulse align-middle" />
                </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* --- SQUAD SECTION --- */}
      <motion.section
        className="py-12 md:py-24 relative z-10 border-y border-white/5"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={sectionVariants}
      >
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 md:mb-16"
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">{t.squad.title}</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base">{t.squad.subtitle}</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 max-w-6xl mx-auto">
            {SQUAD_AGENTS.map((agent, i) => (
              <SquadCard
                key={agent.id}
                agent={agent}
                data={squadData[agent.id as keyof typeof squadData]}
                recruitLabel={t.squad.recruit}
                i={i}
              />
            ))}
          </div>
        </div>
      </motion.section>

      {/* --- MÉMOIRE COMMUNE --- */}
      <motion.section
        className="py-12 md:py-24 bg-[#0A0A0F]/50 border-y border-white/5"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={sectionVariants}
      >
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">{t.memory.title}</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">{t.memory.subtitle}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false) }}
            className={`max-w-2xl mx-auto rounded-2xl border-2 border-dashed transition-all duration-300 ${
              isDragging ? "border-cyan-500/60 bg-cyan-500/10" : "border-white/20 hover:border-white/30 bg-white/5"
            } p-12 text-center cursor-pointer`}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                <Upload className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-slate-300 mb-1">{t.memory.dropzone}</p>
                <p className="text-sm text-slate-500">{t.memory.hint}</p>
              </div>
              <div className="flex gap-2 text-slate-600">
                <FileText size={20} />
                <span className="text-sm">PDF • TXT • MD • CSV</span>
              </div>
              {uploadProgress > 0 && (
                <div className="w-full mt-4">
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 progress-neon rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-cyan-400/80 mt-1 text-center">{uploadProgress}%</p>
                </div>
              )}
              <Link
                href="/signup"
                className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-cyan-600/20 border border-cyan-500/40 rounded-xl text-cyan-400 font-medium hover:bg-cyan-600/30 transition-colors"
                aria-label={t.hero.memoryCta}
              >
                {t.hero.memoryCta}
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* --- CALCULATEUR ROI --- */}
      <motion.section
        className="py-12 md:py-24 relative z-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={sectionVariants}
      >
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-slate-900/60 border border-white/10 rounded-3xl p-4 md:p-8 lg:p-12 backdrop-blur-xl max-w-5xl mx-auto shadow-2xl"
          >
            <div className="text-center mb-8 md:mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">{t.roi.title}</h2>
              <p className="text-slate-400">{t.roi.subtitle}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-4 flex justify-between">
                    <span>{t.roi.employees}</span>
                    <span className="text-purple-400 font-bold">{employees} {t.roi.experts}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={employees}
                    onChange={(e) => setEmployees(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                  <span className="text-slate-400 text-sm">{t.roi.costHuman}</span>
                  <span className="text-xl font-mono text-slate-300">2 500 € /mo</span>
                </div>
                <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/30 flex justify-between items-center">
                  <span className="text-purple-300 text-sm">{t.roi.costSantai}</span>
                  <span className="text-xl font-bold text-white">99 € /mo</span>
                </div>
              </div>

              <div className="text-center bg-black/40 p-4 md:p-8 rounded-2xl border border-green-500/20">
                <div className="text-green-400 font-bold uppercase tracking-widest text-xs mb-2">{t.roi.gain}</div>
                <div className="text-4xl md:text-6xl font-black text-white mb-4 md:mb-6 tracking-tighter">2 401 €</div>
                <Link href="/signup" className="block w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-colors shadow-lg shadow-green-500/20">
                  {t.roi.cta}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* --- PRICING --- */}
      <motion.section
        className="py-12 md:py-24 border-t border-white/5 bg-black/50 text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={sectionVariants}
      >
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-bold mb-8 md:mb-12"
        >
          {t.pricing.title}
        </motion.h2>
        <div className="flex justify-center gap-4 md:gap-8 flex-wrap px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-6 border border-white/10 rounded-xl w-64"
          >
            <div className="text-xl font-bold mb-1">{t.pricing.starter.name}</div>
            <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider">{t.pricing.starter.tagline}</div>
            <div className="text-3xl font-bold text-purple-400 mb-2">{t.pricing.starter.price}</div>
            <ul className="text-sm text-slate-400 mb-4 space-y-1">{t.pricing.starter.features.map((f, i) => <li key={i}>{f}</li>)}</ul>
            <Link
              href="/signup"
              className="block py-2.5 border border-white/20 rounded-lg font-medium transition-all duration-300 hover:bg-white hover:text-black hover:shadow-[0_0_25px_rgba(255,255,255,0.25)] hover:scale-[1.02]"
            >
              {t.pricing.starter.cta}
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-6 border-2 border-purple-500 bg-purple-900/10 rounded-xl w-64 transform scale-110 shadow-xl pricing-pro-neon"
          >
            <div className="text-xl font-bold mb-1">{t.pricing.pro.name}</div>
            <div className="text-xs text-purple-300/80 mb-2 uppercase tracking-wider">{t.pricing.pro.tagline}</div>
            <div className="text-3xl font-bold text-purple-400 mb-2">{t.pricing.pro.price}</div>
            <ul className="text-sm text-slate-400 mb-4 space-y-1">{t.pricing.pro.features.map((f, i) => <li key={i}>{f}</li>)}</ul>
            <Link
              href="/signup"
              className="block py-2.5 bg-purple-600 rounded-lg font-bold text-white transition-all duration-300 hover:opacity-95 hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:scale-[1.02]"
            >
              {t.pricing.pro.cta}
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="p-6 border-2 border-amber-500/30 border-cyan-500/20 rounded-xl w-64 bg-gradient-to-b from-amber-950/20 to-cyan-950/10"
          >
            <div className="text-xl font-bold mb-1">{t.pricing.corpo.name}</div>
            <div className="text-xs text-amber-300/80 mb-2 uppercase tracking-wider">{t.pricing.corpo.tagline}</div>
            <div className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-cyan-400 bg-clip-text text-transparent mb-2">{t.pricing.corpo.price}</div>
            <ul className="text-sm text-slate-400 mb-4 space-y-1">{t.pricing.corpo.features.map((f, i) => <li key={i}>{f}</li>)}</ul>
            <Link
              href="/signup"
              className="flex items-center justify-center gap-2 py-2.5 border-2 border-amber-500/50 rounded-lg font-bold text-amber-200/90 transition-all duration-300 hover:border-cyan-400/60 hover:bg-gradient-to-r hover:from-amber-500/20 hover:to-cyan-500/20 hover:shadow-[0_0_35px_rgba(251,191,36,0.4),0_0_25px_rgba(34,211,238,0.2)] hover:scale-[1.02]"
              aria-label={t.pricing.corpo.cta}
            >
              <Crown size={18} aria-hidden />
              {t.pricing.corpo.cta}
            </Link>
          </motion.div>
        </div>
        <footer className="mt-20 text-slate-600 text-xs">{t.footer}</footer>
      </motion.section>
      </div>
    </div>
  )
}
