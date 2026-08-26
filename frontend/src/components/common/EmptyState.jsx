import React from "react";
import { Inbox } from "lucide-react";
import Button from "./Button";

export const EmptyState = ({
    title = "No data found",
    description = "There are no records matching your current filter criteria.",
    actionText,
    onAction,
    icon: Icon = Inbox
}) => {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            <div className="p-4 mb-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-indigo-400">
                <Icon className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-semibold text-slate-200 mb-1">{title}</h4>
            <p className="text-sm text-slate-400 max-w-sm mb-6">{description}</p>
            {actionText && onAction && (
                <Button variant="primary" onClick={onAction}>
                    {actionText}
                </Button>
            )}
        </div>
    );
};

export default EmptyState;
