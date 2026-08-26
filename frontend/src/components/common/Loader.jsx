import React from "react";
import { Loader2 } from "lucide-react";

export const Loader = ({ text = "Loading data...", fullPage = false }) => {
    const content = (
        <div className="flex flex-col items-center justify-center p-8 gap-3 text-slate-400">
            <div className="relative flex items-center justify-center">
                <div className="absolute w-10 h-10 rounded-full border-2 border-indigo-500/20 animate-ping" />
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
            {text && <p className="text-sm font-medium text-slate-300 animate-pulse">{text}</p>}
        </div>
    );

    if (fullPage) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                {content}
            </div>
        );
    }

    return content;
};

export default Loader;
