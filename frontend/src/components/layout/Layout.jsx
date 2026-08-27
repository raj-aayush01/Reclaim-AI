import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export const Layout = () => {
    const [timeRange, setTimeRange] = useState("7D");

    return (
        <div className="min-h-screen bg-[#070a11] text-slate-100 flex font-sans">
            {/* Left Sidebar */}
            <Sidebar />

            {/* Main Workspace Area */}
            <div className="flex-1 ml-64 flex flex-col min-h-screen">
                {/* Top Navbar */}
                <Navbar timeRange={timeRange} onTimeRangeChange={setTimeRange} />

                {/* Dynamic Page Content */}
                <main className="mt-16 p-8 flex-1">
                    <Outlet context={{ timeRange }} />
                </main>
            </div>
        </div>
    );
};

export default Layout;
