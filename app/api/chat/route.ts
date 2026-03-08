import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { getGuardrailSystemPrompt } from '@/lib/guardrails'

// On force l'exécution sur le runtime Edge ou Nodejs selon dispo (Nodejs est plus sûr ici)
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages, agent } = body

    // agentId : priorité à agent.id, sinon body.agentId (ex: agent-cockpit)
    const agentId = agent?.id ?? body.agentId ?? undefined
    const guardrail = getGuardrailSystemPrompt(agentId)

    // On définit la personnalité : soit celle de l'agent, soit une par défaut
    const systemPersona = agent?.systemPrompt || agent?.prompt || `Tu es un assistant expert nommé ${agent?.name || 'GHOST'}.`

    // Guardrail en tête : limite stricte au domaine de l'agent (refus des tâches hors compétences)
    const system = guardrail ? guardrail + systemPersona : systemPersona

    // 1. Appel à OpenAI (maxOutputTokens évite toute coupure de réponse)
    const result = await streamText({
      model: openai('gpt-4o'),
      system,
      messages,
      maxOutputTokens: 4096,
    })

    // 2. LE FIX EST ICI :
    // Au lieu d'utiliser la fonction qui change tout le temps de nom (.toDataStreamResponse),
    // on renvoie directement le flux de texte brut. C'est universel.
    return new Response(result.textStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })

  } catch (error: any) {
    console.error("🔥 ERREUR API:", error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
