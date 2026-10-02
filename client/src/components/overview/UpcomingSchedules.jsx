import { useQuery } from "@tanstack/react-query";
import { getExecutions } from "../../api/executionApi";
import { useWorkspace } from "../../context/WorkspaceContext";

const UpcomingSchedules = () => {
  const { currentWorkspace } = useWorkspace();

  const workspaceId = currentWorkspace?._id;

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["executions", workspaceId],
    queryFn: () => getExecutions(workspaceId),
    enabled: !!workspaceId,
  });

  const executions = data?.executions || [];

  const upcomingSchedules = executions
    .filter((execution) => {
      if (
        execution.trigger !== "schedule" ||
        !execution.scheduledAt
      ) {
        return false;
      }

      const scheduledDate = new Date(execution.scheduledAt);

      return (
        !Number.isNaN(scheduledDate.getTime()) &&
        // eslint-disable-next-line react-hooks/purity
        scheduledDate.getTime() > Date.now()
      );
    })
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() -
        new Date(b.scheduledAt).getTime()
    )
    .slice(0, 5);

  const formatTime = (date) => {
    const scheduledDate = new Date(date);

    return scheduledDate.toLocaleTimeString("en-IN", {
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
      scheduledDate.toDateString() ===
      tomorrow.toDateString();

    if (isTomorrow) {
      return "Tomorrow";
    }

    return scheduledDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  const formatDay = (date) => {
    const scheduledDate = new Date(date);

    return scheduledDate.toLocaleDateString("en-IN", {
      weekday: "short",
    });
  };

  if (!workspaceId) {
    return (
      <section className="rounded-lg border border-zinc-800/70 bg-[#111113]">
        <div className="border-b border-zinc-800/70 px-4 py-3">
          <h2 className="text-sm font-medium text-zinc-200">
            Upcoming Schedules
          </h2>
        </div>

        <div className="px-4 py-8 text-center">
          <p className="text-sm text-zinc-500">
            Select a workspace to view schedules
          </p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="rounded-lg border border-zinc-800/70 bg-[#111113]">
        <div className="border-b border-zinc-800/70 px-4 py-3">
          <h2 className="text-sm font-medium text-zinc-200">
            Upcoming Schedules
          </h2>
        </div>

        <div className="divide-y divide-zinc-800/60">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0 space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-zinc-800" />
                <div className="h-3 w-24 animate-pulse rounded bg-zinc-800" />
              </div>

              <div className="h-3 w-16 animate-pulse rounded bg-zinc-800" />
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
      <div className="flex items-center justify-between border-b border-zinc-800/70 px-4 py-3">
        <h2 className="text-sm font-medium text-zinc-200">
          Upcoming Schedules
        </h2>

        {upcomingSchedules.length > 0 && (
          <span className="text-[11px] text-zinc-600">
            {upcomingSchedules.length} upcoming
          </span>
        )}
      </div>

      {upcomingSchedules.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-zinc-500">
            No upcoming schedules
          </p>

          <p className="mt-1 text-xs text-zinc-700">
            Scheduled workflow runs will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/60">
          {upcomingSchedules.map((execution) => (
            <div
              key={execution._id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-md border border-zinc-800 bg-zinc-900/70">
                  <span className="text-[9px] uppercase text-zinc-600">
                    {formatDay(execution.scheduledAt)}
                  </span>

                  <span className="text-xs font-medium text-zinc-300">
                    {new Date(
                      execution.scheduledAt
                    ).getDate()}
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm text-zinc-300">
                    {execution.workflow?.name ||
                      "Untitled Workflow"}
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    {formatDate(execution.scheduledAt)} at{" "}
                    {formatTime(execution.scheduledAt)}
                  </p>
                </div>
              </div>

              <span className="shrink-0 rounded-md border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-[10px] text-zinc-500">
                Scheduled
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default UpcomingSchedules;