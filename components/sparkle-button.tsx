"use client"

import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface SparkleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    onClick?: () => void;
}

export function SparkleButton({ className, onClick, ...props }: SparkleButtonProps) {
    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn(
                "relative w-8 h-8 hover:bg-transparent group",
                "before:absolute before:inset-0 before:rounded-md before:bg-[conic-gradient(from_var(--shimmer-angle),theme(colors.pink.500)_0%,theme(colors.purple.500)_10%,theme(colors.sky.500)_20%,theme(colors.green.500)_30%,theme(colors.yellow.500)_40%,theme(colors.pink.500)_50%)] before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100",
                "after:absolute after:inset-[1px] after:rounded-md after:bg-background",
                className
            )}
            onClick={onClick}
            {...props}
        >
            <style jsx global>{`
                @property --shimmer-angle {
                    syntax: '<angle>';
                    initial-value: 0deg;
                    inherits: false;
                }

                @keyframes shimmer {
                    0% {
                        --shimmer-angle: 0deg;
                    }
                    100% {
                        --shimmer-angle: 360deg;
                    }
                }

                .group:hover::before {
                    animation: shimmer 2s linear infinite;
                }
            `}</style>
            <Sparkles
                className="relative z-10 h-4 w-4 text-foreground"
                strokeWidth={2}
            />
        </Button>
    )
} 