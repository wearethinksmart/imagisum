import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
    primary: "bg-brand text-brand-fg hover:bg-brand-hover shadow-sm",
    secondary: "bg-bg-inset text-fg hover:bg-border",
    ghost: "text-fg-muted hover:text-fg hover:bg-bg-inset",
    outline: "border border-border text-fg hover:border-border-strong hover:bg-bg-subtle"
};

const sizes: Record<ButtonSize, string> = {
    sm: "h-9 px-3 text-sm gap-1.5",
    md: "h-11 px-4 text-sm gap-2",
    lg: "h-13 px-6 text-base gap-2"
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    children?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, Props>(
    ({ variant = "primary", size = "md", className, children, ...rest }, ref) => (
        <button
            ref={ref}
            className={twMerge(
                "inline-flex items-center justify-center rounded-xl font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none",
                variants[variant],
                sizes[size],
                className
            )}
            {...rest}
        >
            {children}
        </button>
    )
);

Button.displayName = "Button";

export default Button;
