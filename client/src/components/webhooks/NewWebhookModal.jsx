import { useState } from "react";
import { FiX } from "react-icons/fi";

const NewWebhookModal = ({
  workflows = [],
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState("");
  const [workflowId, setWorkflowId] = useState(
    workflows[0]?.id || ""
  );

  const [selectedEvents, setSelectedEvents] = useState([
    "issues.opened",
  ]);

  const events = [
    "issues.opened",
    "issues.closed",
    "issues.labeled",
  ];

  const handleEventChange = (event) => {
    setSelectedEvents((currentEvents) => {
      if (currentEvents.includes(event)) {
        return currentEvents.filter(
          (currentEvent) => currentEvent !== event
        );
      }

      return [...currentEvents, event];
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!name.trim() || !workflowId || selectedEvents.length === 0) {
      return;
    }

    onCreate({
      name: name.trim(),
      workflowId,
      events: selectedEvents,
    });
  };

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
            aria-label="Close modal"
            className="rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
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
                className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
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
                className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-200 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
              >
                {workflows.length === 0 ? (
                  <option value="">
                    No workflows available
                  </option>
                ) : (
                  workflows.map((workflow) => (
                    <option
                      key={workflow.id}
                      value={workflow.id}
                    >
                      {workflow.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Events */}
            <div>
              <p className="mb-3 text-xs font-medium text-zinc-400">
                Events to listen for
              </p>

              <div className="space-y-2.5">
                {events.map((event) => (
                  <label
                    key={event}
                    className="flex cursor-pointer items-center gap-2.5"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event)}
                      onChange={() =>
                        handleEventChange(event)
                      }
                      className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 accent-violet-500"
                    />

                    <span className="font-mono text-xs text-zinc-400">
                      {event}
                    </span>
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-zinc-800/70 px-5 py-3.5">
            <button
              type="button"
              onClick={onClose}
              className="h-8 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                !name.trim() ||
                !workflowId ||
                selectedEvents.length === 0
              }
              className="h-8 rounded-md bg-violet-500 px-3.5 text-xs font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Create Webhook
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default NewWebhookModal;