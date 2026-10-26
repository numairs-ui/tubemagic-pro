interface PageHeaderProps {
    eyebrow?: string
    title: string
    description?: React.ReactNode
    actions?: React.ReactNode
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
                {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">{eyebrow}</p>}
                <h1 className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">{title}</h1>
                {description && <p className="max-w-2xl text-base font-medium text-slate-500 md:text-lg">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
        </div>
    )
}
