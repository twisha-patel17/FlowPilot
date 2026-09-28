import { useEffect, useState } from "react";
import {
  FiCheck,
  FiCopy,
  FiX,
} from "react-icons/fi";

const NewWebhookModal = ({
  workflows = [],
  onClose,
  onCreate,
  isCreating = false,
  createdWebhook = null,
}) => {
  const [name, setName] = useState("");
  const [workflowId, setWorkflowId] = useState("");
  const [copiedField, setCopiedField] = useState("");

  useEffect(() => {
    if (workflows.length > 0 && !workflowId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWorkflowId(workflows[0]._id);
    }
  }, [workflows, workflowId]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!name.trim() || !workflowId) {
      return;
    }

    onCreate({
      name: name.trim(),
      workflowId,
      events: [],
    });
  };

  const copyToClipboard = async (value, field) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);

      setCopiedField(field);

      window.setTimeout(() => {
        setCopiedField("");
      }, 1500);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const endpoint =
    createdWebhook?.endpoint ||
    "";

  const secret =
    createdWebhook?.secret ||
    "";

  const isDisabled =
    !name.trim() ||
    !workflowId ||
    isCreating;

  if (createdWebhook) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
        <div className="w-full max-w-md overflow-hidden rounded-xl border border-zinc-800 bg-[#111113] shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800/70 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <FiCheck className="h-4 w-4" />
              </div>

              <h2 className="text-sm font-semibold text-zinc-100">
                Webhook Created
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-5 px-5 py-5">
            <div>
              <p className="text-xs text-zinc-400">
                Your webhook is ready.
              </p>

              <p className="mt-1 text-[11px] leading-5 text-zinc-600">
                Save the secret now. It will not be shown again.
              </p>
            </div>

            {/* Endpoint */}
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                Endpoint
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={endpoint}
                  readOnly
                  className="h-9 min-w-0 flex-1 rounded-md border border-zinc-800 bg-zinc-900 px-3 font-mono text-[11px] text-zinc-300 outline-none"
                />

                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(endpoint, "endpoint")
                  }
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
                  aria-label="Copy endpoint"
                >
                  {copiedField === "endpoint" ? (
                    <FiCheck className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <FiCopy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Secret */}
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                Webhook secret
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={secret}
                  readOnly
                  className="h-9 min-w-0 flex-1 rounded-md border border-zinc-800 bg-zinc-900 px-3 font-mono text-[11px] text-zinc-300 outline-none"
                />

                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(secret, "secret")
                  }
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
                  aria-label="Copy webhook secret"
                >
                  {copiedField === "secret" ? (
                    <FiCheck className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <FiCopy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-md border border-amber-500/10 bg-amber-500/5 px-3 py-2.5">
              <p className="text-[11px] leading-5 text-amber-400/80">
                Keep this secret private. It is used to verify incoming webhook requests.
              </p>
            </div>
          </div>

          <div className="flex justify-end border-t border-zinc-800/70 px-5 py-3.5">
            <button
              type="button"
              onClick={onClose}
              className="h-8 rounded-md bg-violet-500 px-4 text-xs font-medium text-white transition hover:bg-violet-400"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-zinc-800 bg-[#111113] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/70 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-100">
            New Webhook
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            aria-label="Close modal"
            className="rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-5 py-5">
            {/* Name */}
            <div>
              <label
                htmlFor="webhook-name"
                className="mb-2 block text-xs font-medium text-zinc-400"
              >
                Name
              </label>

              <input
                id="webhook-name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="e.g. Stripe Payment Events"
                disabled={isCreating}
                className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Trigger workflow */}
            <div>
              <label
                htmlFor="trigger-workflow"
                className="mb-2 block text-xs font-medium text-zinc-400"
              >
                Trigger workflow
              </label>

              <select
                id="trigger-workflow"
                value={workflowId}
                onChange={(event) =>
                  setWorkflowId(event.target.value)
                }
                disabled={
                  isCreating ||
                  workflows.length === 0
                }
                className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-200 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {workflows.length === 0 ? (
                  <option value="">
                    No workflows available
                  </option>
                ) : (
                  workflows.map((workflow) => (
                    <option
                      key={workflow._id}
                      value={workflow._id}
                    >
                      {workflow.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Events */}
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-400">
                Events
              </p>

              <p className="text-[11px] leading-5 text-zinc-600">
                This webhook accepts incoming POST requests and triggers the selected workflow.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-zinc-800/70 px-5 py-3.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="h-8 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isDisabled}
              className="h-8 rounded-md bg-violet-500 px-3.5 text-xs font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isCreating
                ? "Creating..."
                : "Create Webhook"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewWebhookModal;