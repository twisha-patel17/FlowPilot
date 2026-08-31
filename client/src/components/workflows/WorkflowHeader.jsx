import { FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const WorkflowHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          Workflows
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Create, manage and monitor your automations.
        </p>
      </div>

      {/* Create Workflow */}
      <button
        type="button"
        onClick={() => navigate("/app/workflows/new")}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-violet-500 px-4 text-sm font-medium text-white transition hover:bg-violet-400 active:scale-[0.98]"
      >
        <FiPlus className="h-4 w-4" />
        Create Workflow
      </button>
    </div>
  );
};

export default WorkflowHeader;