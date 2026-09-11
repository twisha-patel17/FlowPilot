import { useQuery } from "@tanstack/react-query";
import { getExecutions } from "../../api/executionApi";
import { useWorkspace } from "../../context/WorkspaceContext";

const UpcomingSchedules = () => {
  const { currentWorkspace } = useWorkspace();

  const workspaceId = currentWorkspace?._id;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["executions", workspaceId],
    queryFn: () => getExecutions(workspaceId),
    enabled: !!workspaceId,
  });

  const executions = data?.executions || [];

  const upcomingSchedules = executions
    .filter(
      (execution) =>
        execution.trigger === "schedule" &&
        execution.scheduledAt &&
        new Date(execution.scheduledAt) > new Date()
    )
    .sort(
      (a, b) =>
        new Date(a.scheduledAt) - new Date(b.scheduledAt)
    )
    .slice(0, 5);

  const formatSchedule = (date) => {
    return new Date(date).toLocaleString("en-IN", {
      weekday: "long",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date) => {
    const scheduledDate = new Date(date);
    const today = new Date();

    const isToday =
      scheduledDate.toDateString() === today.toDateString();

    if (isToday) {
      return "Today";
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const isTomorrow =
      scheduledDate.toDateString() === tomorrow.toDateString();

    if (isTomorrow) {
      return "Tomorrow";
    }

    return scheduledDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  if (isLoading) {
    return (
      <section className="rounded-lg border border-zinc-800/70 bg-[#111113]">
        <div className="border-b border-zinc-800/70 px-4 py-3">
          <h2 className="text-sm font-medium text-zinc-200">
            Upcoming Schedules
          </h2>
        </div>

        <div className="divide-y divide-zinc-800/60">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-zinc-800" />
                <div className="h-3 w-32 animate-pulse rounded bg-zinc-800" />
              </div>

              <div className="h-3 w-12 animate-pulse rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="rounded-lg border border-zinc-800/70 bg-[#111113]">
        <div className="border-b border-zinc-800/70 px-4 py-3">
          <h2 className="text-sm font-medium text-zinc-200">
            Upcoming Schedules
          </h2>
        </div>

        <div className="px-4 py-8 text-center">
          <p className="text-sm text-zinc-500">
            Unable to load schedules
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-zinc-800/70 bg-[#111113]">
      <div className="border-b border-zinc-800/70 px-4 py-3">
        <h2 className="text-sm font-medium text-zinc-200">
          Upcoming Schedules
        </h2>
      </div>

      {upcomingSchedules.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-zinc-500">
            No upcoming schedules
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/60">
          {upcomingSchedules.map((execution) => (
            <div
              key={execution._id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-zinc-300">
                  {execution.workflow?.name ||
                    "Untitled Workflow"}
                </p>

                <p className="mt-1 text-xs text-zinc-600">
                  {formatSchedule(execution.scheduledAt)}
                </p>
              </div>

              <span className="shrink-0 text-[11px] text-zinc-500">
                {formatDate(execution.scheduledAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default UpcomingSchedules;