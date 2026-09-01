import { useState } from "react";

import ScheduleCard from "../components/schedules/ScheduleCard";

const initialSchedules = [
  {
    id: 1,
    name: "Daily Task Reminder",
    schedule: "Every day at 8:00 PM",
    nextRun: "Today, 8:00 PM",
    lastRun: "Yesterday, 8:00 PM",
    active: true,
  },
  {
    id: 2,
    name: "Weekly Report Export",
    schedule: "Every Monday at 9:00 AM",
    nextRun: "Mon, 9:00 AM",
    lastRun: "Last Monday",
    active: false,
  },
  {
    id: 3,
    name: "Nightly DB Backup Check",
    schedule: "Every day at 2:00 AM",
    nextRun: "Tomorrow, 2:00 AM",
    lastRun: "Today, 2:00 AM",
    active: true,
  },
];

const SchedulesPage = () => {
  const [schedules, setSchedules] = useState(initialSchedules);

  const handleToggle = (id) => {
    setSchedules((currentSchedules) =>
      currentSchedules.map((schedule) => {
        if (schedule.id !== id) {
          return schedule;
        }

        return {
          ...schedule,
          active: !schedule.active,
        };
      })
    );
  };

  const handleOpen = (schedule) => {
    console.log("Open schedule:", schedule);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
          Schedules
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Workflows that run automatically on a time-based trigger.
        </p>
      </div>

      {/* Schedule list */}
      <div className="space-y-3">
        {schedules.map((schedule) => (
          <ScheduleCard
            key={schedule.id}
            name={schedule.name}
            schedule={schedule.schedule}
            nextRun={schedule.nextRun}
            lastRun={schedule.lastRun}
            active={schedule.active}
            onToggle={() => handleToggle(schedule.id)}
            onOpen={() => handleOpen(schedule)}
          />
        ))}
      </div>
    </div>
  );
};

export default SchedulesPage;