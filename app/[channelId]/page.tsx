import { redirect } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'

export default async function ChannelPage({ params }: { params: { channelId: string } }) {
    const supabase = await getSupabaseClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        redirect('/login')
    }

    // Verify channel exists and user has access
    const { data: channel, error: channelError } = await supabase
        .from('channels')
        .select('*')
        .eq('id', params.channelId)
        .single()

    if (channelError || !channel) {
        redirect('/')
    }

    // Redirect to main page with channel context
    redirect(`/?channelId=${params.channelId}`)
} 