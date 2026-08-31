import OverviewHeader from "../components/overview/OverviewHeader";
import WorkflowStats from "../components/overview/WorkflowStats";
import RecentActivity from "../components/overview/RecentActivity";
import WorkflowActivity from "../components/overview/WorkflowActivity";
import ActiveWorkflows from "../components/overview/ActiveWorkflows";
import UpcomingSchedules from "../components/overview/UpcomingSchedules";

const OverviewPage = () => {
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6">

      {/* Header */}
      <OverviewHeader />


      {/* Statistics */}
      <WorkflowStats />

      {/* Recent Executions */}
      <RecentActivity />

      {/* Activity + Active Workflows */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <WorkflowActivity />
        <ActiveWorkflows />
      </div>

      {/* Upcoming Schedules */}
      <UpcomingSchedules />

    </div>
  );
};

export default OverviewPage;