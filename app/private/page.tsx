import { redirect } from 'next/navigation'

import { getSupabaseClient } from '@/lib/supabase/client'

export default async function PrivatePage() {
    const supabase = await getSupabaseClient()

    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
        redirect('/login')
    }

    return <p>Hello {data.user.email}</p>
}