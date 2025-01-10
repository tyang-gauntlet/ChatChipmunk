import { getSupabaseClient } from '@/lib/supabase/client'

export const uploadFile = async (file: File) => {
    const supabase = getSupabaseClient()

    // Create a unique file name
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `uploads/${fileName}`

    const { data, error } = await supabase.storage
        .from('attachments')
        .upload(filePath, file)

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath)

    return {
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        url: publicUrl
    }
} 