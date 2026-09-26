"use client";
import { Fragment, ReactNode, useEffect, useLayoutEffect, useRef } from "react";
import { m, AnimatePresence, domAnimation, LazyMotion } from "framer-motion";
import { createPortal } from "react-dom";
import { IconX } from "@tabler/icons-react";
import { twMerge } from "tailwind-merge";

// The lock has to be applied before the browser paints the backdrop's first
// frame, and useLayoutEffect is the only hook that runs that early. It is a
// no-op on the server, where this component renders nothing anyway.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

// Interfaces
interface Props {
    open: boolean;
    onClose: () => void;
    children?: ReactNode;
    backdropClassName?: string;
    className?: string;
    padRightIds?: string[];
}

// Module scope, deliberately. Rebuilding these objects on every render hands
// Motion a new `variants` identity each time; when one of those renders lands
// on the frame an animation completes, it re-resolves the element from its
// `initial` variant and paints a single frame at opacity 0. That is the blink:
// the panel vanishes for a frame, then the backdrop does, letting the page
// flash through. Frozen identities keep the resolved variant stable.
/**
 * A no-op `onUpdate` is what keeps the dialog from flashing as it opens.
 *
 * Opacity is a hardware-acceleratable property, so Motion hands these fades to
 * the Web Animations API and leaves the element's inline style at the `initial`
 * value — `opacity: 0` — for the animation's whole run. When the WAAPI
 * animation finishes, its effect is dropped a frame before Motion commits the
 * final value, and for that one frame the element falls back to its inline
 * `opacity: 0`. The panel blinks out, then the backdrop does, and the bright
 * page behind shows through: the white flash.
 *
 * `onUpdate` cannot be served from the compositor, so declaring one forces
 * Motion's main-thread driver, which writes every frame — including the last —
 * to inline style. Measured over CDP: with it, both elements ramp 0 → 1 with no
 * dropped frame; without it, each one hits opacity 0 exactly on completion.
 */
const keepOnMainThread = () => { };

const PANEL_HIDDEN = { opacity: 0, y: -8 };
const PANEL_SHOWN = { opacity: 1, y: 0 };
const PANEL_TRANSITION = { duration: 0.15 };

const BACKDROP_HIDDEN = { opacity: 0 };
const BACKDROP_SHOWN = { opacity: 1 };
// The backdrop lingers a beat so the panel is gone before the page reappears.
const BACKDROP_EXIT = { opacity: 0, transition: { delay: 0.1 } };
const BACKDROP_TRANSITION = { duration: 0.2 };

const Dialog = ({
    open,
    onClose,
    children,
    backdropClassName,
    className,
    padRightIds = [],
}: Props) => {
    const lockAppliedRef = useRef(false);
    const originalBodyOverflowRef = useRef<string | null>(null);
    const originalBodyPaddingRef = useRef<string | null>(null);
    const originalTargetsPaddingRef = useRef<Record<string, string | null>>({});

    const lockAndPad = () => {
        if (typeof window === "undefined") return;
        if (lockAppliedRef.current) return;

        const body = document.body;

        // Save originals once
        if (originalBodyOverflowRef.current === null)
            originalBodyOverflowRef.current = body.style.overflow || "";
        if (originalBodyPaddingRef.current === null)
            originalBodyPaddingRef.current = body.style.paddingRight || "";

        // Measure the gap the lock actually opens up, by comparing the layout
        // width either side of it, rather than assuming it equals the current
        // scrollbar width. With `scrollbar-gutter: stable` the gutter survives
        // `overflow: hidden`, so the scrollbar width is reserved either way and
        // the correct compensation is zero — padding it anyway would push the
        // page sideways, which is the shift this is meant to prevent.
        const widthBefore = document.documentElement.clientWidth;
        body.style.overflow = "hidden";
        const scrollbarWidth = document.documentElement.clientWidth - widthBefore;

        const bodyComputed = window.getComputedStyle(body);
        const bodyCurrent = parseFloat(bodyComputed.paddingRight || "0") || 0;
        if (scrollbarWidth > 0) {
            body.style.paddingRight = `${bodyCurrent + scrollbarWidth}px`;
        }

        const originals: Record<string, string | null> = {};
        padRightIds.forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;
            originals[id] = el.style.paddingRight || "";
            const computed = window.getComputedStyle(el);
            const current = parseFloat(computed.paddingRight || "0") || 0;
            if (scrollbarWidth > 0) {
                el.style.paddingRight = `${current + scrollbarWidth}px`;
            }
        });
        originalTargetsPaddingRef.current = originals;

        lockAppliedRef.current = true;
    };

    const restoreAll = () => {
        if (typeof window === "undefined") return;
        if (!lockAppliedRef.current) return;

        const body = document.body;

        if (originalBodyOverflowRef.current !== null) {
            body.style.overflow = originalBodyOverflowRef.current;
            originalBodyOverflowRef.current = null;
        }
        if (originalBodyPaddingRef.current !== null) {
            body.style.paddingRight = originalBodyPaddingRef.current;
            originalBodyPaddingRef.current = null;
        }
        const originals = originalTargetsPaddingRef.current || {};
        Object.keys(originals).forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;
            const prev = originals[id];
            el.style.paddingRight = prev ?? "";
        });
        originalTargetsPaddingRef.current = {};

        lockAppliedRef.current = false;
    };

    // Locking on open — before paint — rather than from the motion elements'
    // onAnimationStart, which fires a frame late: hiding the page scrollbar
    // reflows the document, and doing that once the backdrop is already on
    // screen makes it flash as it jumps by the scrollbar width mid fade-in.
    useIsomorphicLayoutEffect(() => {
        if (open) lockAndPad();
    }, [open]);

    useEffect(() => {
        return () => restoreAll();
    }, []);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    if (typeof window === "undefined") return null;

    return createPortal(
        <LazyMotion features={domAnimation}>
            <AnimatePresence onExitComplete={restoreAll}>
                {open && (
                    <Fragment key="dialog">
                        <m.div
                            className={twMerge(
                                "bg-black/60 backdrop-blur-sm fixed top-0 left-0 w-full h-full flex justify-center items-center z-[999]",
                                backdropClassName
                            )}
                            initial={BACKDROP_HIDDEN}
                            animate={BACKDROP_SHOWN}
                            exit={BACKDROP_EXIT}
                            transition={BACKDROP_TRANSITION}
                            onUpdate={keepOnMainThread}
                            onClick={onClose}
                        />
                        <m.div
                            className={twMerge(
                                "fixed inset-0 h-max m-auto z-[9999] overflow-auto bg-bg-elevated text-fg border border-border rounded-2xl shadow-2xl",
                                className
                            )}
                            initial={PANEL_HIDDEN}
                            animate={PANEL_SHOWN}
                            exit={PANEL_HIDDEN}
                            transition={PANEL_TRANSITION}
                            onUpdate={keepOnMainThread}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {children}
                        </m.div>
                    </Fragment>
                )}
            </AnimatePresence>
        </LazyMotion>,
        document.body
    );
};

// Header
interface HeaderProps {
    title?: string;
    onClose?: () => void;
    className?: string;
    titleClassName?: string;
    buttonClassName?: string;
}

const Header = ({
    title,
    className,
    titleClassName,
    buttonClassName,
    onClose,
}: HeaderProps) => {
    return (
        <div className={twMerge("flex items-center gap-4", className)}>
            <h4 className={twMerge("text-lg flex-1 font-semibold tracking-tight", titleClassName)}>
                {title}
            </h4>
            {onClose && (
                <button
                    aria-label="Close dialog"
                    className={twMerge(
                        "hover:bg-bg-inset p-1.5 text-fg-muted hover:text-fg rounded-lg transition-colors",
                        buttonClassName
                    )}
                    onClick={onClose}
                >
                    <IconX size={20} />
                </button>
            )}
        </div>
    );
};

// Body
interface BodyProps {
    className?: string;
    children: ReactNode;
    id?: string;
}

const Body = ({ className, children, id }: BodyProps) => {
    return (
        <div
            className={twMerge(
                "max-h-[80vh] min-h-[100px] overflow-auto [&::-webkit-scrollbar]:w-1.5",
                className
            )}
            id={id}
        >
            {children}
        </div>
    );
};

Dialog.Header = Header;
Dialog.Body = Body;

export default Dialog;
