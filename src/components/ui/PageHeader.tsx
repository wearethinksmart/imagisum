import { ReactNode } from "react";
import Link from "next/link";
import { IconChevronRight } from "@tabler/icons-react";

interface Crumb {
    label: string;
    href?: string;
}

interface Props {
    title: ReactNode;
    description?: ReactNode;
    breadcrumbs?: Crumb[];
    meta?: ReactNode;
    actions?: ReactNode;
}

const PageHeader = ({ title, description, breadcrumbs, meta, actions }: Props) => (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-sm text-fg-subtle">
                    {breadcrumbs.map((crumb, index) => (
                        <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                            {index > 0 && <IconChevronRight size={14} className="opacity-60" />}
                            {crumb.href ? (
                                <Link href={crumb.href} className="transition-colors hover:text-fg">
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span className="text-fg-muted">{crumb.label}</span>
                            )}
                        </span>
                    ))}
                </nav>
            )}

            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>

            {description && <p className="mt-3 max-w-2xl text-base text-fg-muted">{description}</p>}
            {meta && <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-fg-subtle">{meta}</div>}
        </div>

        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
);

export default PageHeader;
