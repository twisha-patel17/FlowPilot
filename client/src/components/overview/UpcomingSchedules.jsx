const schedules = [
  {
    name: "Daily Task Reminder",
    schedule: "Every day at 8:00 PM",
    date: "Today",
  },
  {
    name: "Weekly Report Export",
    schedule: "Mondays at 9:00 AM",
    date: "Next Monday",
  },
];

const UpcomingSchedules = () => {
  return (
    <section className="rounded-lg border border-zinc-800/70 bg-[#111113]">
      <div className="border-b border-zinc-800/70 px-4 py-3">
        <h2 className="text-sm font-medium text-zinc-200">
          Upcoming Schedules
        </h2>
      </div>

      <div className="divide-y divide-zinc-800/60">
        {schedules.map((schedule) => (
          <div
            key={schedule.name}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-zinc-300">
                {schedule.name}
              </p>

              <p className="mt-1 text-xs text-zinc-600">
                {schedule.schedule}
              </p>
            </div>

            <span className="shrink-0 text-[11px] text-zinc-500">
              {schedule.date}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default UpcomingSchedules;