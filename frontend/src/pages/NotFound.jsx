import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Button from "../components/common/Button";

export const NotFound = () => {
    return (
        <div className="center-state animate-rise">
            <div
                className="icon-box icon-box-lg icon-box-down"
                style={{ marginBottom: "1rem" }}
            >
                <AlertCircle size={28} />
            </div>

            <h1
                style={{
                    fontSize: "2.5rem",
                    fontWeight: 800,
                    color: "var(--ink)",
                    marginBottom: "0.5rem",
                    letterSpacing: "-0.03em"
                }}
            >
                404
            </h1>

            <h3
                style={{
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: "var(--ink)",
                    marginBottom: "0.5rem"
                }}
            >
                Page Not Found
            </h3>

            <p
                style={{
                    fontSize: "0.875rem",
                    color: "var(--mute)",
                    maxWidth: "24rem",
                    marginBottom: "1.5rem",
                    lineHeight: 1.6
                }}
            >
                The page or route you are looking for does not exist or has been moved.
            </p>

            <Link to="/" style={{ textDecoration: "none" }}>
                <Button variant="primary" icon={ArrowLeft}>
                    Return to Dashboard
                </Button>
            </Link>
        </div>
    );
};

export default NotFound;