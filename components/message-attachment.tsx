import { Attachment } from '@/lib/types/search'

interface MessageAttachmentProps {
    attachment: Attachment
}

export const MessageAttachment = ({ attachment }: MessageAttachmentProps) => {
    const isImage = attachment.file_type.startsWith('image/')

    if (isImage) {
        return (
            <div className="mt-1 max-w-[200px] overflow-hidden rounded-md">
                <img
                    src={attachment.url}
                    alt={attachment.file_name}
                    className="h-auto w-full object-cover"
                    loading="lazy"
                />
            </div>
        )
    }

    return (
        <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-secondary/50 px-2 py-0.5 text-xs hover:bg-secondary"
        >
            <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
            </svg>
            <span>{attachment.file_name}</span>
        </a>
    )
}

export default MessageAttachment 