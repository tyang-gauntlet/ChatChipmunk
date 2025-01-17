import { redirect } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'

export default async function DMPage({ params }: { params: { userId: string } }) {
    const supabase = await getSupabaseClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        redirect('/login')
    }

    // Verify target user exists
    const { data: targetUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', params.userId)
        .single()

    if (userError || !targetUser) {
        redirect('/')
    }

    // Redirect to main page with DM context
    redirect(`/?userId=${params.userId}`)
} 