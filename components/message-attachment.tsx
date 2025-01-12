interface MessageAttachmentProps {
    attachment: {
        url: string;
        file_name: string;
        file_type: string;
    };
}

export default function MessageAttachment({ attachment }: MessageAttachmentProps) {
    const isImage = attachment.file_type.startsWith('image/');

    if (isImage) {
        return (
            <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block max-w-sm hover:opacity-90"
            >
                <img
                    src={attachment.url}
                    alt={attachment.file_name}
                    className="rounded-md max-h-48 object-cover"
                />
            </a>
        );
    }

    return (
        <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-accent hover:bg-accent/80 text-sm max-w-fit"
        >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {attachment.file_name}
        </a>
    );
} 