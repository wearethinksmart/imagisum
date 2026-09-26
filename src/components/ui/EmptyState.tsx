import { ReactNode } from "react";

interface Props {
    icon?: ReactNode;
    title: string;
    description?: string;
    children?: ReactNode;
}

const EmptyState = ({ icon, title, description, children }: Props) => (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        {icon && (
            <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                {icon}
            </div>
        )}
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        {description && <p className="mt-2 max-w-md text-sm text-fg-muted">{description}</p>}
        {children && <div className="mt-6">{children}</div>}
    </div>
);

export default EmptyState;
