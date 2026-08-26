import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Button from "../components/common/Button";

export const NotFound = () => {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-rose-400 mb-4">
                <AlertCircle className="w-12 h-12" />
            </div>
            <h1 className="text-4xl font-extrabold text-slate-100 mb-2">404</h1>
            <h3 className="text-lg font-bold text-slate-300 mb-2">Page Not Found</h3>
            <p className="text-sm text-slate-400 max-w-sm mb-6">
                The page or route you are looking for does not exist or has been moved.
            </p>
            <Link to="/">
                <Button variant="primary" icon={ArrowLeft}>
                    Return to Dashboard
                </Button>
            </Link>
        </div>
    );
};

export default NotFound;
