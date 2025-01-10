"use client"

import { useState, useCallback } from "react"

interface Toast {
    id: string
    title?: string
    description?: string
    action?: React.ReactNode
}

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((toast: Omit<Toast, "id">) => {
        setToasts((toasts) => [...toasts, { ...toast, id: crypto.randomUUID() }])
    }, [])

    const dismissToast = useCallback((id: string) => {
        setToasts((toasts) => toasts.filter((toast) => toast.id !== id))
    }, [])

    return {
        toasts,
        addToast,
        dismissToast,
    }
} 