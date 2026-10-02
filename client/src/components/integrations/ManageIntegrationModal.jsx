import {
  FiAlertTriangle,
  FiX,
} from "react-icons/fi";

const ManageIntegrationModal = ({
  integration,
  onClose,
  onDisconnect,
  onDelete,
  isDisconnecting = false,
  isDeleting = false,
}) => {
  if (!integration) {
    return null;
  }

  const isAlwaysAvailable =
    integration.alwaysAvailable === true;

  const isConnected =
    integration.status === "connected";

  const providerName =
    integration.provider
      ? integration.provider
          .charAt(0)
          .toUpperCase() +
        integration.provider.slice(1)
      : "Integration";

  const account =
    integration.metadata?.account ||
    integration.metadata?.username ||
    integration.metadata?.email ||
    null;

  const isBusy =
    isDisconnecting || isDeleting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-[#0d0d0f] shadow-2xl">
        {/* Header */}

        <div className="flex items-center justify-between border-b border-zinc-800/70 px-5 py-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
              {isAlwaysAvailable
                ? "Integration"
                : "Manage integration"}
            </p>

            <h2 className="mt-1 text-sm font-semibold text-zinc-100">
              {integration.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}

        <div className="space-y-5 p-5">
          {/* HTTP / Always Available */}

          {isAlwaysAvailable ? (
            <>
              <div className="rounded-md border border-zinc-800/70 bg-[#111114] px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-zinc-600">
                      Provider
                    </p>

                    <p className="mt-1 text-xs font-medium text-zinc-200">
                      HTTP
                    </p>
                  </div>

                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 text-[10px] font-medium text-emerald-400">
                    Always available
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-zinc-200">
                    No connection required
                  </p>

                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    HTTP requests do not require a saved
                    integration. Configure the request
                    directly inside your workflow's HTTP
                    node.
                  </p>
                </div>

                <div className="rounded-md border border-zinc-800/70 bg-[#111114] px-3 py-3">
                  <p className="text-[11px] font-medium text-zinc-300">
                    Configure in your workflow
                  </p>

                  <ul className="mt-2 space-y-1.5 text-[11px] leading-5 text-zinc-500">
                    <li>• HTTP method</li>
                    <li>• Request URL</li>
                    <li>• Request headers</li>
                    <li>• Request body</li>
                  </ul>
                </div>
              </div>

              <div className="rounded-md border border-violet-500/20 bg-violet-500/5 px-3 py-2.5">
                <p className="text-[11px] leading-5 text-violet-300">
                  Add an HTTP node to a workflow to
                  configure and execute external API
                  requests.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Integration Information */}

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-md border border-zinc-800/70 bg-[#111114] px-3 py-3">
                  <div>
                    <p className="text-[11px] text-zinc-600">
                      Provider
                    </p>

                    <p className="mt-1 text-xs font-medium text-zinc-200">
                      {providerName}
                    </p>
                  </div>

                  <span className="rounded-full border border-zinc-700 px-2 py-1 text-[10px] font-medium text-zinc-400">
                    {integration.provider}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-md border border-zinc-800/70 bg-[#111114] px-3 py-3">
                  <div>
                    <p className="text-[11px] text-zinc-600">
                      Status
                    </p>

                    <p className="mt-1 text-xs font-medium text-zinc-200">
                      {isConnected
                        ? "Connected"
                        : "Disconnected"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-2 py-1 text-[10px] font-medium ${
                      isConnected
                        ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                        : "border-zinc-700 bg-zinc-900 text-zinc-500"
                    }`}
                  >
                    {isConnected
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>

                {account && (
                  <div className="rounded-md border border-zinc-800/70 bg-[#111114] px-3 py-3">
                    <p className="text-[11px] text-zinc-600">
                      Account
                    </p>

                    <p className="mt-1 break-all text-xs font-medium text-zinc-200">
                      {account}
                    </p>
                  </div>
                )}
              </div>

              {/* Security Notice */}

              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5">
                <p className="text-[11px] leading-5 text-emerald-400">
                  Your connection credentials are
                  encrypted and are never displayed here.
                </p>
              </div>

              {/* Actions */}

              <div className="space-y-2 border-t border-zinc-800/70 pt-4">
                {isConnected && (
                  <button
                    type="button"
                    onClick={onDisconnect}
                    disabled={isBusy}
                    className="flex h-9 w-full items-center justify-center rounded-md border border-zinc-800 px-4 text-xs font-medium text-zinc-300 transition hover:bg-zinc-900 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isDisconnecting
                      ? "Disconnecting..."
                      : "Disconnect"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onDelete}
                  disabled={isBusy}
                  className="flex h-9 w-full items-center justify-center rounded-md border border-red-500/20 bg-red-500/5 px-4 text-xs font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Delete integration
                </button>

                <div className="flex items-start gap-2 rounded-md border border-amber-500/10 bg-amber-500/5 px-3 py-2.5">
                  <FiAlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />

                  <p className="text-[11px] leading-5 text-amber-400/80">
                    Deleting this integration may cause
                    workflows using it to fail.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Close */}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="h-9 rounded-md border border-zinc-800 px-4 text-xs font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageIntegrationModal;