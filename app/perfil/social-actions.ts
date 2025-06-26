"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"

interface ActionResult {
  success: boolean
  error?: string
}

export async function addSocialLink(userId: string, key: string, url: string): Promise<ActionResult> {
  const supabase = createServerSupabaseClient()
  try {
    // Obter social_links atual
    const { data: userRow, error: fetchError } = await supabase
      .schema("rarcursos")
      .from("users")
      .select("social_links")
      .eq("uid", userId)
      .single()

    if (fetchError) throw fetchError

    const current = (userRow?.social_links as Record<string, string>) || {}
    const updated = { ...current, [key]: url }

    const { error: updateError } = await supabase
      .schema("rarcursos")
      .from("users")
      .update({ social_links: updated })
      .eq("uid", userId)

    if (updateError) throw updateError

    return { success: true }
  } catch (err: any) {
    console.error("addSocialLink error", err)
    return { success: false, error: err.message }
  }
}

export async function removeSocialLink(userId: string, removeKey: string): Promise<ActionResult> {
  const supabase = createServerSupabaseClient()
  try {
    const { data: userRow, error: fetchError } = await supabase
      .schema("rarcursos")
      .from("users")
      .select("social_links")
      .eq("uid", userId)
      .single()

    if (fetchError) throw fetchError

    const current = (userRow?.social_links as Record<string, string>) || {}
    if (!(removeKey in current)) return { success: true }

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete current[removeKey]

    const { error: updateError } = await supabase
      .schema("rarcursos")
      .from("users")
      .update({ social_links: current })
      .eq("uid", userId)

    if (updateError) throw updateError

    return { success: true }
  } catch (err: any) {
    console.error("removeSocialLink error", err)
    return { success: false, error: err.message }
  }
}
