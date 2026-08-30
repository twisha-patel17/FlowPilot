import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const AppLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    if (location.pathname === "/app") {
      return "Overview";
    }

    if (location.pathname.startsWith("/app/workflows")) {
      return "Workflows";
    }

    if (location.pathname.startsWith("/app/executions")) {
      return "Executions";
    }

    if (location.pathname.startsWith("/app/schedules")) {
      return "Schedules";
    }

    if (location.pathname.startsWith("/app/integrations")) {
      return "Integrations";
    }

    if (location.pathname.startsWith("/app/webhooks")) {
      return "Webhooks";
    }

    if (location.pathname.startsWith("/app/settings")) {
      return "Settings";
    }

    return "FlowPilot";
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Topbar */}
      <Topbar
        setMobileOpen={setMobileOpen}
        title={getPageTitle()}
      />

      {/* Main Content */}
      <main className="min-h-screen pt-[58px] md:ml-[220px]">
        <div className="min-h-[calc(100vh-58px)] p-5 md:p-7">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;