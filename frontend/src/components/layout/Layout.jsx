import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export const Layout = () => {
    const [timeRange, setTimeRange] = useState("7D");

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "var(--background)",
                color: "var(--ink)",
                display: "flex",
                fontFamily: "'Inter', sans-serif"
            }}
        >
            {/* Left Sidebar */}
            <Sidebar />

            {/* Main Workspace Area */}
            <div
                style={{
                    flex: 1,
                    marginLeft: "16rem",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: "100vh"
                }}
            >
                {/* Top Navbar */}
                <Navbar timeRange={timeRange} onTimeRangeChange={setTimeRange} />

                {/* Dynamic Page Content */}
                <main
                    style={{
                        marginTop: "4rem",
                        padding: "2rem",
                        flex: 1
                    }}
                >
                    <Outlet context={{ timeRange }} />
                </main>
            </div>
        </div>
    );
};

export default Layout;
