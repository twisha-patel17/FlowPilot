const WorkflowActivity = () => {
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
          <span>Aug 11</span>
          <span>Aug 18</span>
          <span>Aug 25</span>
        </div>
      </div>

      <div className="flex h-56 items-center justify-center px-4">
        <p className="text-xs text-zinc-600">
          Activity chart will appear here
        </p>
      </div>
    </section>
  );
};

export default WorkflowActivity;