import ExecutionFilters from "../components/executions/ExecutionFilters";
import ExecutionTable from "../components/executions/ExecutionTable";

const ExecutionsPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
          Executions
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Monitor every workflow execution.
        </p>
      </div>

      {/* Filters */}
      <ExecutionFilters />

      {/* Table */}
      <ExecutionTable />
    </div>
  );
};

export default ExecutionsPage;