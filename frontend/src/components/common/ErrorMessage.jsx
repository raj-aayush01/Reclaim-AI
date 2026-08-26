import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import Button from "./Button";

export const ErrorMessage = ({ message = "An error occurred", onRetry }) => {
    return (
        <div className="flex flex-col items-center justify-center p-6 my-4 bg-rose-950/20 border border-rose-800/40 rounded-2xl text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
            <h4 className="text-base font-semibold text-rose-200 mb-1">Execution Failure</h4>
            <p className="text-sm text-rose-300/80 mb-4 max-w-md">{message}</p>
            {onRetry && (
                <Button variant="danger" size="sm" icon={RefreshCw} onClick={onRetry}>
                    Retry Action
                </Button>
            )}
        </div>
    );
};

export default ErrorMessage;
