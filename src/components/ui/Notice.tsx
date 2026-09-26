import { IconAlertTriangle } from "@tabler/icons-react";
import { ReactNode } from "react";

const Notice = ({ children }: { children: ReactNode }) => (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-fg-muted">
        <IconAlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500" />
        <p>{children}</p>
    </div>
);

export default Notice;
