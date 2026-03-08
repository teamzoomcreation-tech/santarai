import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies(); // Important pour Next.js 16

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // On ignore l'erreur
            }
          },
        },
      }
    );
    const body = await req.json();
    const { taskId, status, imageUrl, content, title, clearOutput } = body;

    const UI_TO_DB: Record<string, string> = {
      todo: "pending",
      inprogress: "working",
      done: "done",
    };
    const dbStatus = status ? (UI_TO_DB[status] ?? status) : undefined;

    console.log("🔄 UPDATE TASK:", taskId);
    if (dbStatus) console.log("   -> Status:", dbStatus);

    // 1. PRÉPARER LES DONNÉES
    const updateData: any = {};
    if (dbStatus) updateData.status = dbStatus;
    if (imageUrl) updateData.image_url = imageUrl;
    if (content !== undefined) updateData.description = content;
    if (title !== undefined) updateData.title = title;
    if (clearOutput) {
      updateData.output_content = null;
      updateData.output_type = null;
    }

    // 2. MISE À JOUR TÂCHE
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select('mission_id, project_id')
      .single();

    if (taskError) throw taskError;
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    // 3. AUTOMATISATION (NEURAL LINK & RELAIS)
    if (task.mission_id) {
      
      // A. RÉVEIL MISSION
      if (dbStatus === 'working') {
        await supabase
          .from('missions')
          .update({ status: 'in_progress' })
          .eq('id', task.mission_id);
      }

      // B. FIN MISSION & RELAIS
      if (dbStatus === 'done') {
        const { count } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('mission_id', task.mission_id)
          .neq('status', 'done');

        console.log("🧐 VERIFICATION MISSION:", task.mission_id);
        console.log("   -> Tâches restantes (pas 'done'):", count);

        if (count !== null && count > 0) {
          const { data: blockers } = await supabase
            .from('tasks')
            .select('id, title, status')
            .eq('mission_id', task.mission_id)
            .neq('status', 'done');
          console.log("   🚫 BLOQUÉ PAR :", blockers);
        }

        if (count === 0) {
          console.log("✅ MISSION TERMINÉE ! ID:", task.mission_id);

          // Fermer mission actuelle
          await supabase
            .from('missions')
            .update({ status: 'done' })
            .eq('id', task.mission_id);

          // Activer mission suivante
          const { data: nextMissions } = await supabase
            .from('missions')
            .select('id, title')
            .eq('project_id', task.project_id)
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(1);

          if (nextMissions && nextMissions.length > 0) {
            console.log("🚀 RELAIS ACTIVÉ ->", nextMissions[0].title);
            await supabase
              .from('missions')
              .update({ status: 'in_progress' })
              .eq('id', nextMissions[0].id);
          }
        }
      }
    }

    // Rafraîchir le cache de la page projet pour voir les changements de statut mission
    if (task.project_id) {
      revalidatePath(`/dashboard/projects/${task.project_id}`);
    }

    return NextResponse.json({ success: true, task });

  } catch (error) {
    console.error("❌ ERROR:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}