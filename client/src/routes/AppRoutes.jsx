import { Routes, Route } from "react-router-dom";

import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";

import OverviewPage from "../pages/OverviewPage";
import WorkflowsPage from "../pages/WorkflowsPage";
import ExecutionsPage from "../pages/ExecutionsPage";
import SchedulesPage from "../pages/SchedulesPage";
import IntegrationsPage from "../pages/IntegrationsPage";
import WebhooksPage from "../pages/WebhooksPage";
import WebhookLogsPage from "../pages/WebhookLogsPage";
import ExecutionDetailsPage from "../pages/ExecutionDetailsPage";

import WorkflowBuilderPage from "../pages/WorkflowBuilderPage";

import AppLayout from "../components/layout/AppLayout";
import ProtectedRoute from "./ProtectedRoute";

const AppRoutes = () => {
  return (
    <Routes>
     
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppLayout />}>
          
          <Route index element={<OverviewPage />} />

          <Route
            path="workflows"
            element={<WorkflowsPage />}
          />

          <Route
            path="workflows/new"
            element={<WorkflowBuilderPage />}
          />

          <Route
            path="workflows/:id"
            element={<WorkflowBuilderPage />}
          />

          <Route
            path="executions"
            element={<ExecutionsPage />}
          />

          <Route
            path="executions/:id"
            element={<ExecutionDetailsPage />}
          />

          <Route
            path="schedules"
            element={<SchedulesPage />}
          />

          <Route
            path="integrations"
            element={<IntegrationsPage />}
          />

          <Route
            path="webhooks"
            element={<WebhooksPage />}
          />

          <Route
            path="webhooks/:id/logs"
            element={<WebhookLogsPage />}
          />

        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;