import { clsx } from "clsx";

interface Props {
    children: React.ReactNode;
    className?: string;
    variant?: "default" | "sm" | "lg";
    accentTop?: boolean;   // teal top border
    accentLeft?: boolean;  // coral left border
}

export function GlassCard({ children, className, variant = "default", accentTop, accentLeft }: Props) {
    return (
        <div
            className={clsx(
                variant === "default" && "glass",
                variant === "sm" && "glass-sm",
                variant === "lg" && "glass-lg",
                accentTop && "border-t-2 border-primary",
                accentLeft && "border-l-4 border-accent",
                "p-5",
                className
            )}
        >
            {children}
        </div>
    );
}
