import WorkflowRow from "./WorkflowRow";

const WorkflowTable = ({ workflows, onMenuClick }) => {
  if (!workflows || workflows.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-zinc-800/70 bg-zinc-900/20">
        <div className="text-center">
          <h3 className="text-sm font-medium text-zinc-300">
            No workflows found
          </h3>

          <p className="mt-1 text-xs text-zinc-600">
            Try changing your search or filter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800/70 bg-[#0d0d0f]">
      {/* Table Header */}
      <div className="hidden grid-cols-[minmax(240px,2fr)_140px_110px_90px_90px_40px] items-center gap-3 border-b border-zinc-800/70 bg-zinc-900/30 px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-zinc-600 md:grid">
        <span>Name</span>
        <span>Trigger</span>
        <span>Status</span>
        <span>Last Run</span>
        <span>Success Rate</span>
        <span />
      </div>

      {/* Rows */}
      <div>
        {workflows.map((workflow) => (
          <WorkflowRow
            key={workflow.id}
            workflow={workflow}
            onMenuClick={onMenuClick}
          />
        ))}
      </div>
    </div>
  );
};

export default WorkflowTable;