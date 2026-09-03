const WebhookStatus = ({ active }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        active
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-zinc-800/80 text-zinc-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-400" : "bg-zinc-500"
        }`}
      />

      {active ? "Active" : "Paused"}
    </span>
  );
};

export default WebhookStatus;