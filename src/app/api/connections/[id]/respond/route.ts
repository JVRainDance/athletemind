import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/connections/[id]/respond
 * Respond to a connection request (approve or reject)
 * Body: { action: 'approve' | 'reject' }
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (!action || !['approve', 'reject', 'cancel'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve", "reject", or "cancel"' },
        { status: 400 }
      )
    }

    // Fetch the connection request
    const { data: connection, error: fetchError } = await supabase
      .from('coach_athletes')
      .select(`
        *,
        coach:profiles!coach_athletes_coach_id_fkey(first_name, last_name),
        athlete:profiles!coach_athletes_athlete_id_fkey(first_name, last_name)
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    // Check if connection is pending
    if (connection.status !== 'pending') {
      return NextResponse.json(
        { error: 'This request has already been responded to' },
        { status: 400 }
      )
    }

    // Determine if user is the recipient or initiator
    const isRecipient =
      (connection.coach_id === session.user.id && connection.initiated_by === connection.athlete_id) ||
      (connection.athlete_id === session.user.id && connection.initiated_by === connection.coach_id)

    const isInitiator = connection.initiated_by === session.user.id

    // Validate permissions based on action
    if (action === 'cancel') {
      // Only initiator can cancel
      if (!isInitiator) {
        return NextResponse.json(
          { error: 'Only the initiator can cancel a pending request' },
          { status: 403 }
        )
      }
    } else {
      // Only recipient can approve/reject
      if (!isRecipient) {
        return NextResponse.json(
          { error: 'Only the recipient can approve or reject this request' },
          { status: 403 }
        )
      }
    }

    // Determine the new status
    let newStatus: 'active' | 'rejected' | 'inactive'
    if (action === 'approve') {
      newStatus = 'active'
    } else if (action === 'reject') {
      newStatus = 'rejected'
    } else {
      newStatus = 'inactive' // cancelled
    }

    // Update the connection
    const { data: updated, error: updateError } = await supabase
      .from('coach_athletes')
      .update({
        status: newStatus,
        responded_at: new Date().toISOString(),
        is_active: action === 'approve' // Keep is_active in sync for backwards compatibility
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating connection:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Get the other user's name for the response message
    const otherUser = connection.coach_id === session.user.id
      ? connection.athlete
      : connection.coach

    const otherName = otherUser?.first_name || 'User'

    let message: string
    if (action === 'approve') {
      message = `You are now connected with ${otherName}!`
    } else if (action === 'reject') {
      message = `Connection request from ${otherName} has been declined`
    } else {
      message = 'Connection request has been cancelled'
    }

    return NextResponse.json({
      success: true,
      connection: updated,
      message
    })

  } catch (error) {
    console.error('Error in connection respond:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
