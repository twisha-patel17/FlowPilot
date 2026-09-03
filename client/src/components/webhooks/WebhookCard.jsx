import { useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";

import WebhookStatus from "./WebhookStatus";

const WebhookCard = ({
  name,
  active,
  endpoint,
  events,
  lastEvent,
  onToggle,
  onViewLogs,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(endpoint);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error("Failed to copy webhook URL:", error);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800/70 bg-[#0d0d0f] p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-zinc-100">
            {name}
          </h2>

          <div className="mt-2">
            <WebhookStatus active={active} />
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[11px] text-zinc-600">
            Last event
          </p>

          <p className="mt-0.5 text-xs font-medium text-zinc-300">
            {lastEvent}
          </p>
        </div>
      </div>

      {/* Endpoint */}
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-zinc-800/70 bg-zinc-900/70 px-3 py-2.5">
        <span className="rounded-md bg-blue-500/10 px-2 py-1 text-[10px] font-semibold text-blue-400">
          POST
        </span>

        <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-300">
          {endpoint}
        </span>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy webhook endpoint"
          className="shrink-0 rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
        >
          {copied ? (
            <FiCheck className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <FiCopy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Events */}
      <div className="mt-3 flex flex-wrap gap-2">
        {events.map((event) => (
          <span
            key={event}
            className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 font-mono text-[10px] text-zinc-400"
          >
            {event}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onViewLogs}
          className="h-8 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800"
        >
          View Logs
        </button>

        <button
          type="button"
          role="switch"
          aria-checked={active}
          aria-label={`${active ? "Pause" : "Activate"} ${name}`}
          onClick={onToggle}
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/30 ${
            active ? "bg-violet-500" : "bg-zinc-700"
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              active ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
};

export default WebhookCard;