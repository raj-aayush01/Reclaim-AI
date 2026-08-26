import React from "react";
import { Loader2 } from "lucide-react";

export const Button = ({
    children,
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    icon: Icon,
    className = "",
    onClick,
    type = "button",
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none rounded-xl";

    const variants = {
        primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 active:scale-[0.98]",
        glow: "bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white hover:opacity-95 shadow-lg shadow-indigo-500/30 active:scale-[0.98]",
        secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 active:scale-[0.98]",
        outline: "bg-transparent hover:bg-slate-800/60 text-slate-300 border border-slate-700 hover:border-slate-600 active:scale-[0.98]",
        danger: "bg-rose-600/90 hover:bg-rose-600 text-white shadow-lg shadow-rose-600/25 active:scale-[0.98]",
        ghost: "bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs gap-1.5",
        md: "px-4 py-2 text-sm gap-2",
        lg: "px-5 py-2.5 text-base gap-2.5"
    };

    return (
        <button
            type={type}
            disabled={disabled || loading}
            onClick={onClick}
            className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size]} ${className}`}
            {...props}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-current" />
            ) : Icon ? (
                <Icon className="w-4 h-4" />
            ) : null}
            <span>{children}</span>
        </button>
    );
};

export default Button;
