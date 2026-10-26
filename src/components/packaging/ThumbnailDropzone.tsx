"use client"

import { useRef, useState } from "react"
import { LucideUploadCloud, LucideLoader2, LucideX } from "lucide-react"
import { fileToCompressedDataUrl } from "@/lib/client-image"
import { cn } from "@/lib/utils"

interface ThumbnailDropzoneProps {
    value: string | null
    onChange: (dataUrl: string | null) => void
    onError?: (message: string) => void
    className?: string
}

/** Drag-and-drop / click / paste uploader that compresses in the browser. */
export default function ThumbnailDropzone({ value, onChange, onError, className }: ThumbnailDropzoneProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    const handleFile = async (file: File | undefined) => {
        if (!file) return
        setIsProcessing(true)
        try {
            onChange(await fileToCompressedDataUrl(file))
        } catch (err) {
            onError?.(err instanceof Error ? err.message : "Could not read that image.")
        } finally {
            setIsProcessing(false)
        }
    }

    if (value) {
        return (
            <div className={cn("relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50", className)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={value} alt="Uploaded thumbnail" className="mx-auto aspect-video max-h-52 object-cover" />
                <button
                    type="button"
                    onClick={() => onChange(null)}
                    className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white transition-colors hover:bg-black"
                    aria-label="Remove thumbnail"
                >
                    <LucideX className="h-4 w-4" />
                </button>
            </div>
        )
    }

    return (
        <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                handleFile(e.dataTransfer.files[0])
            }}
            onPaste={(e) => handleFile(e.clipboardData.files[0])}
            className={cn(
                "flex h-44 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 text-center transition-all sm:h-52",
                isDragging ? "scale-[1.01] border-brand bg-brand-soft" : "border-slate-200 bg-slate-50 hover:border-brand/50 hover:bg-brand-soft/40",
                className
            )}
        >
            {isProcessing ? (
                <LucideLoader2 className="h-7 w-7 animate-spin text-brand" />
            ) : (
                <LucideUploadCloud className={cn("h-7 w-7 transition-colors", isDragging ? "text-brand" : "text-slate-400")} />
            )}
            <span className="text-sm font-bold text-slate-700">
                {isProcessing ? "Optimizing image…" : "Drop your thumbnail or click to upload"}
            </span>
            <span className="text-xs text-slate-400">PNG, JPG or WebP · 1280×720 recommended</span>
            <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => {
                    handleFile(e.target.files?.[0])
                    e.target.value = ""
                }}
            />
        </button>
    )
}
