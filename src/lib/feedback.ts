import { supabase } from './supabase'
import { uid } from './store'

/**
 * In-app feedback.
 *
 * Guests can submit — the people most worth hearing from are the ones who have
 * not signed up yet, so requiring an account would filter out exactly the
 * feedback that matters. Everything is optional except the message itself.
 */

export interface FeedbackContext {
  route: string
  teamId: string | null
  /** Rough shape of the screen they were on; explains layout complaints. */
  viewport: string
  signedIn: boolean
}

export function currentContext(teamId: string | null, signedIn: boolean): FeedbackContext {
  return {
    route: `${window.location.pathname}${window.location.search}`,
    teamId,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    signedIn,
  }
}

export async function submitFeedback(
  message: string,
  email: string | null,
  userId: string | null,
  context: FeedbackContext,
): Promise<void> {
  const text = message.trim()
  if (!text) throw new Error('Add a message first.')
  if (text.length > 4000) throw new Error('That is longer than 4000 characters.')

  if (!supabase) {
    // Unconfigured build (plain `vite dev`). Say so rather than pretending it
    // was sent — a silent success would lose the feedback outright.
    throw new Error('Feedback needs the hosted app. Try it on cairnpmai.netlify.app.')
  }

  const { error } = await supabase.from('feedback').insert({
    id: uid('fb'),
    user_id: userId,
    email: email?.trim() || null,
    message: text,
    context,
  })
  if (error) throw new Error(error.message)
}
