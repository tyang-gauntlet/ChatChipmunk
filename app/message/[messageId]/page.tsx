import { redirect } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'

export default async function MessagePage({ params }: { params: { messageId: string } }) {
    const supabase = await getSupabaseClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        redirect('/login')
    }

    // Verify message exists and get its context
    const { data: message, error: messageError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', params.messageId)
        .single()

    if (messageError || !message) {
        redirect('/')
    }

    // Build the redirect URL based on message context
    let redirectUrl = `/?messageId=${params.messageId}`

    if (message.channel_id) {
        redirectUrl += `&channelId=${message.channel_id}`
    } else {
        // For DMs, we need to find the other user
        const { data: dmContext } = await supabase
            .from('direct_messages')
            .select('sender_id, receiver_id')
            .eq('id', params.messageId)
            .single()

        if (dmContext) {
            const otherUserId = dmContext.sender_id === user.id
                ? dmContext.receiver_id
                : dmContext.sender_id

            redirectUrl += `&userId=${otherUserId}`
        }
    }

    // Redirect to main page with message context
    redirect(redirectUrl)
} 