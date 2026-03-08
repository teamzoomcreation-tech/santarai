import { NextResponse } from "next/server"

/**
 * Classification d'intention pour le chat direct.
 * RÈGLE D'OR : En cas de doute, is_task = true (mieux vaut une mission de trop que perdre le travail).
 *
 * is_task: true  = Dès que l'utilisateur demande du contenu, du code, de la traduction, une idée,
 *                  une analyse, ou qu'il répond aux questions de l'agent pour faire avancer un travail.
 * is_task: false = UNIQUEMENT salutations pures et politesse de base.
 */

/** Salutations et politesse strictes — pas de travail demandé. Tout le reste = tâche. */
const PURE_GREETING_PATTERNS: (string | RegExp)[] = [
  /^bonjour\s*[!.]?$/i,
  /^salut\s*[!.]?$/i,
  /^hello\s*[!.]?$/i,
  /^hi\s*[!.]?$/i,
  /^hey\s*[!.]?$/i,
  /^coucou\s*[!.]?$/i,
  /^comment (ça )?va\s*[?.]?$/i,
  /^ça va\s*[?.]?$/i,
  /^tu vas bien\s*[?.]?$/i,
  /^comment tu vas\s*[?.]?$/i,
  /^quoi de neuf\s*[?.]?$/i,
  /^merci\s*[!.]?$/i,
  /^merci beaucoup\s*[!.]?$/i,
  /^thanks?\s*[!.]?$/i,
  /^thank you\s*[!.]?$/i,
  /^au revoir\s*[!.]?$/i,
  /^bye\s*[!.]?$/i,
  /^à bientôt\s*[!.]?$/i,
  /^à plus\s*[!.]?$/i,
  /^\s*$/,
]

/** Mots-clés indiquant une demande de travail (génération, code, analyse, réponse à l'agent, etc.). */
const TASK_KEYWORDS = [
  "rédige", "redige", "écris", "ecris", "rédiger", "rediger", "écrire", "ecrire",
  "écris-moi", "ecris-moi", "rédige-moi", "redige-moi", "phrase", "accroche", "idée", "idee", "idées", "idees",
  "code", "coder", "développe", "developpe", "programme", "crée", "cree", "créer", "creer",
  "fais", "faire", "génère", "genere", "générer", "generer", "donne", "donne-moi", "donne moi",
  "prépare", "prepare", "préparer", "preparer", "lance", "lancer", "démarre", "demarre",
  "écrit", "ecrit", "rédaction", "redaction", "post", "article", "texte", "mail", "email",
  "brief", "script", "maquette", "logo", "design", "analyse", "analyser", "synthèse", "synthese",
  "résume", "resume", "résumer", "resumer", "plan", "stratégie", "strategie", "proposition",
  "liste", "tableau", "rapport", "présentation", "presentation", "pitch", "campagne",
  "traduis", "traduire", "traduction", "public cible", "cible", "b2b", "b2c",
  "trouve", "trouver", "suggère", "suggérer", "suggere", "suggerer", "propose", "proposer",
  "rédige une", "redige une", "écris une", "ecris une", "écris un", "ecris un", "rédige un", "redige un",
  "une phrase", "un texte", "des idées", "une idée", "une accroche",
]

function isPureGreetingOnly(message: string): boolean {
  const trimmed = message.trim()
  if (trimmed.length === 0) return true
  const normalized = trimmed.replace(/\s+/g, " ").trim()
  for (const p of PURE_GREETING_PATTERNS) {
    if (typeof p === "string") {
      if (normalized.toLowerCase() === p.toLowerCase()) return true
    } else if (p.test(normalized)) return true
  }
  return false
}

function hasTaskKeyword(message: string): boolean {
  const lower = message.toLowerCase().trim()
  return TASK_KEYWORDS.some((kw) => lower.includes(kw))
}

/** True si le dernier message de l'agent ressemble à une question (suivi de travail). */
function isFollowUpToTask(lastAssistantMessage: string | undefined): boolean {
  if (!lastAssistantMessage || typeof lastAssistantMessage !== "string") return false
  const t = lastAssistantMessage.trim()
  if (t.length < 3) return false
  return t.includes("?") || /\b(quel|quelle|qui|quoi|comment|pourquoi|où|quand)\b/i.test(t)
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const message = typeof body.message === "string" ? body.message : ""
    const trimmed = message.trim()
    const lastAssistantMessage = typeof body.lastAssistantMessage === "string" ? body.lastAssistantMessage : undefined

    if (trimmed.length === 0) {
      return NextResponse.json({ is_task: false })
    }

    if (isPureGreetingOnly(trimmed)) {
      return NextResponse.json({ is_task: false })
    }

    if (isFollowUpToTask(lastAssistantMessage)) {
      return NextResponse.json({ is_task: true })
    }

    if (hasTaskKeyword(trimmed)) {
      return NextResponse.json({ is_task: true })
    }

    if (trimmed.length >= 15) {
      return NextResponse.json({ is_task: true })
    }

    return NextResponse.json({ is_task: true })
  } catch (e) {
    console.error("chat/classify error:", e)
    return NextResponse.json({ is_task: true })
  }
}
