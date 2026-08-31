import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Payments from "./pages/Payments";
import FailedPayments from "./pages/FailedPayments";
import PaymentDetails from "./pages/PaymentDetails";
import Exceptions from "./pages/Exceptions";
import Guardrails from "./pages/Guardrails";
import AgentControlRoom from "./pages/AgentControlRoom";
import NotFound from "./pages/NotFound";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />

                <Route element={<Layout />}>
                    <Route path="overview" element={<Dashboard />} />
                    <Route path="ledger" element={<Payments />} />
                    <Route path="payments" element={<Payments />} />
                    <Route
                        path="failed-payments"
                        element={<FailedPayments />}
                    />
                    <Route
                        path="payments/:paymentId"
                        element={<PaymentDetails />}
                    />
                    <Route
                        path="exceptions"
                        element={<Exceptions />}
                    />
                    <Route
                        path="guardrails"
                        element={<Guardrails />}
                    />
                    <Route
                        path="control-room"
                        element={<AgentControlRoom />}
                    />
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;