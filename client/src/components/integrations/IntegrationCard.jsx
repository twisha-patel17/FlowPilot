const IntegrationCard = ({
  icon,
  name,
  description,
  status,
  account,
  connected,
  onConnect,
  onManage,
  onDisconnect,
}) => {
  const isAlwaysAvailable = status === "Always available";

  return (
    <div className="rounded-xl border border-zinc-800/70 bg-[#0d0d0f] p-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-lg">
          {icon}
        </div>

        <h2 className="text-sm font-semibold text-zinc-100">
          {name}
        </h2>
      </div>

      {/* Description */}
      {description && (
        <p className="mt-4 text-sm leading-5 text-zinc-500">
          {description}
        </p>
      )}

      {/* Status */}
      <div className="mt-4">
        <div
          className={`flex items-center gap-2 text-xs font-medium ${
            connected || isAlwaysAvailable
              ? "text-emerald-400"
              : "text-zinc-500"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              connected || isAlwaysAvailable
                ? "bg-emerald-400"
                : "bg-zinc-600"
            }`}
          />

          {status}
        </div>

        {account && (
          <p className="mt-2 font-mono text-xs text-zinc-600">
            {account}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        {connected ? (
          <>
            <button
              type="button"
              onClick={onManage}
              className="h-9 flex-1 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-semibold text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800"
            >
              Manage
            </button>

            <button
              type="button"
              onClick={onDisconnect}
              className="h-9 flex-1 rounded-md border border-red-500/30 bg-transparent px-3 text-xs font-semibold text-red-400 transition hover:bg-red-500/10"
            >
              Disconnect
            </button>
          </>
        ) : isAlwaysAvailable ? (
          <button
            type="button"
            onClick={onManage}
            className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-semibold text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800"
          >
            Manage
          </button>
        ) : (
          <button
            type="button"
            onClick={onConnect}
            className="h-9 w-full rounded-md bg-violet-500 px-3 text-xs font-semibold text-white transition hover:bg-violet-400"
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
};

export default IntegrationCard;