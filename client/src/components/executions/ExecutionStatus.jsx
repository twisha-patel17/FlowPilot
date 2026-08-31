const ExecutionStatus = ({ status }) => {
  const styles = {
    Success:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",

    Failed:
      "bg-red-500/10 text-red-400 border-red-500/20",

    Retrying:
      "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
        styles[status] ||
        "border-zinc-800 bg-zinc-900 text-zinc-500"
      }`}
    >
      {status}
    </span>
  );
};

export default ExecutionStatus;