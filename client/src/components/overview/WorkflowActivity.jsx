import { useQuery } from "@tanstack/react-query";
import { getExecutions } from "../../api/executionApi";
import { useWorkspace } from "../../context/WorkspaceContext";

const WorkflowActivity = () => {
  const { currentWorkspace } = useWorkspace();

  const workspaceId = currentWorkspace?._id;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["executions", workspaceId],
    queryFn: () => getExecutions(workspaceId),
    enabled: !!workspaceId,
  });

  const executions = data?.executions || [];

  const getLast14Days = () => {
    const days = [];

    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);

      days.push(date);
    }

    return days;
  };

  const days = getLast14Days();

  const activity = days.map((day) => {
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const count = executions.filter((execution) => {
      const createdAt = new Date(execution.createdAt);

      return createdAt >= day && createdAt < nextDay;
    }).length;

    return {
      date: day,
      count,
    };
  });

  const maxCount = Math.max(
    ...activity.map((day) => day.count),
    1
  );

  const formatDate = (date) => {
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  if (isLoading) {
    return (
      <section className="rounded-lg border border-zinc-800/70 bg-[#111113]">
        <div className="border-b border-zinc-800/70 px-4 py-3">
          <div className="h-4 w-32 animate-pulse rounded bg-zinc-800" />

          <div className="mt-2 h-3 w-20 animate-pulse rounded bg-zinc-800" />
        </div>

        <div className="flex h-56 items-end gap-2 px-6 pb-6">
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className="flex-1 animate-pulse rounded-t bg-zinc-800"
              style={{
                // eslint-disable-next-line react-hooks/purity
                height: `${30 + Math.random() * 50}%`,
              }}
            />
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
            Workflow Activity
          </h2>

          <p className="mt-0.5 text-xs text-zinc-600">
            Last 14 days
          </p>
        </div>

        <div className="flex h-56 items-center justify-center px-4">
          <p className="text-xs text-zinc-600">
            Unable to load activity
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-zinc-800/70 bg-[#111113]">
      <div className="flex items-center justify-between border-b border-zinc-800/70 px-4 py-3">
        <div>
          <h2 className="text-sm font-medium text-zinc-200">
            Workflow Activity
          </h2>

          <p className="mt-0.5 text-xs text-zinc-600">
            Last 14 days
          </p>
        </div>

        <div className="flex items-center gap-4 text-[10px] text-zinc-600">
          <span>{formatDate(days[0])}</span>
          <span>{formatDate(days[7])}</span>
          <span>{formatDate(days[13])}</span>
        </div>
      </div>

      <div className="flex h-56 items-end gap-2 px-6 pb-6 pt-8">
        {activity.map((day) => {
          const height =
            day.count === 0
              ? 4
              : Math.max((day.count / maxCount) * 100, 8);

          return (
            <div
              key={day.date.toISOString()}
              className="group relative flex h-full flex-1 items-end"
            >
              <div
                className="w-full rounded-t bg-violet-500/70 transition-all duration-200 group-hover:bg-violet-400"
                style={{
                  height: `${height}%`,
                }}
              />

              <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded border border-zinc-800 bg-[#18181b] px-2 py-1 text-[10px] whitespace-nowrap text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100">
                {day.count}{" "}
                {day.count === 1 ? "execution" : "executions"}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default WorkflowActivity;