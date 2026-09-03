import { useMemo, useState } from "react";
import { FiArrowLeft, FiRefreshCw } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";

const webhookData = {
  abc123: {
    name: "GitHub Issues Webhook",
    endpoint: "/api/webhooks/github/abc123",
  },

  f92d1e: {
    name: "Manual Deploy Trigger",
    endpoint: "/api/webhooks/deploy/f92d1e",
  },
};

const initialDeliveries = [
  {
    id: 1,
    event: "issues.opened",
    status: "success",
    response: 200,
    duration: "0.42s",
    received: "2 minutes ago",
  },
  {
    id: 2,
    event: "issues.closed",
    status: "success",
    response: 200,
    duration: "0.31s",
    received: "1 hour ago",
  },
  {
    id: 3,
    event: "issues.opened",
    status: "failed",
    response: 429,
    duration: "1.72s",
    received: "3 hours ago",
  },
  {
    id: 4,
    event: "issues.labeled",
    status: "success",
    response: 200,
    duration: "0.38s",
    received: "5 hours ago",
  },
  {
    id: 5,
    event: "issues.closed",
    status: "failed",
    response: 500,
    duration: "2.14s",
    received: "Yesterday",
  },
];

const statusOptions = ["all", "success", "failed"];
const timeOptions = ["24h", "7d", "30d"];

const WebhookLogsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [deliveries, setDeliveries] =
    useState(initialDeliveries);

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [timeFilter, setTimeFilter] =
    useState("24h");

  const webhook = webhookData[id];

  const filteredDeliveries = useMemo(() => {
    if (statusFilter === "all") {
      return deliveries;
    }

    return deliveries.filter(
      (delivery) => delivery.status === statusFilter
    );
  }, [deliveries, statusFilter]);

  const handleRefresh = () => {
    setDeliveries([...initialDeliveries]);
  };

  if (!webhook) {
    return (
      <div className="space-y-6">

        <button
          type="button"
          onClick={() => navigate("/app/webhooks")}
          className="inline-flex items-center gap-2 text-xs text-zinc-500 transition hover:text-zinc-200"
        >
          <FiArrowLeft className="h-3.5 w-3.5" />
          Back to Webhooks
        </button>

        <div className="rounded-xl border border-zinc-800/70 bg-[#0d0d0f] p-8 text-center">
          <h1 className="text-sm font-semibold text-zinc-200">
            Webhook not found
          </h1>

          <p className="mt-2 text-xs text-zinc-500">
            The webhook you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Back */}

      <button
        type="button"
        onClick={() => navigate("/app/webhooks")}
        className="inline-flex items-center gap-2 text-xs text-zinc-500 transition hover:text-zinc-200"
      >
        <FiArrowLeft className="h-3.5 w-3.5" />
        Back to Webhooks
      </button>

      {/* Header */}

      <div>
        <p className="text-xs text-zinc-600">
          Webhooks / {webhook.name}
        </p>

        <div className="mt-2">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
            Delivery Logs
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            View incoming events and webhook delivery results.
          </p>
        </div>
      </div>

      {/* Endpoint */}

      <div className="rounded-xl border border-zinc-800/70 bg-[#0d0d0f] px-4 py-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
          Endpoint
        </p>

        <p className="mt-1 truncate font-mono text-xs text-zinc-300">
          {webhook.endpoint}
        </p>
      </div>

      {/* Filters */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex flex-wrap items-center gap-2">

          {/* Status */}

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="h-8 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-zinc-300 outline-none focus:border-violet-500/50"
          >
            {statusOptions.map((status) => (
              <option
                key={status}
                value={status}
              >
                {status === "all"
                  ? "All statuses"
                  : status === "success"
                  ? "Success"
                  : "Failed"}
              </option>
            ))}
          </select>

          {/* Time */}

          <select
            value={timeFilter}
            onChange={(event) =>
              setTimeFilter(event.target.value)
            }
            className="h-8 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-zinc-300 outline-none focus:border-violet-500/50"
          >
            {timeOptions.map((time) => (
              <option
                key={time}
                value={time}
              >
                Last{" "}
                {time === "24h"
                  ? "24 hours"
                  : time === "7d"
                  ? "7 days"
                  : "30 days"}
              </option>
            ))}
          </select>
        </div>

        {/* Refresh */}

        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex h-8 items-center justify-center gap-2 self-start rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 sm:self-auto"
        >
          <FiRefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Logs */}

      <div className="overflow-hidden rounded-xl border border-zinc-800/70 bg-[#0d0d0f]">

        {/* Desktop table */}

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left">

            <thead>
              <tr className="border-b border-zinc-800/70 text-[10px] uppercase tracking-wider text-zinc-600">
                <th className="px-4 py-3 font-medium">
                  Event
                </th>

                <th className="px-4 py-3 font-medium">
                  Status
                </th>

                <th className="px-4 py-3 font-medium">
                  Response
                </th>

                <th className="px-4 py-3 font-medium">
                  Duration
                </th>

                <th className="px-4 py-3 font-medium">
                  Received
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredDeliveries.map((delivery) => (
                <tr
                  key={delivery.id}
                  className="border-b border-zinc-800/50 last:border-0"
                >
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs text-zinc-300">
                      {delivery.event}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <DeliveryStatus
                      status={delivery.status}
                    />
                  </td>

                  <td className="px-4 py-3.5">
                    <span
                      className={`font-mono text-xs ${
                        delivery.response >= 400
                          ? "text-red-400"
                          : "text-zinc-400"
                      }`}
                    >
                      {delivery.response}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-xs text-zinc-500">
                    {delivery.duration}
                  </td>

                  <td className="px-4 py-3.5 text-xs text-zinc-500">
                    {delivery.received}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}

        <div className="divide-y divide-zinc-800/50 md:hidden">
          {filteredDeliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="space-y-3 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-zinc-300">
                  {delivery.event}
                </span>

                <DeliveryStatus
                  status={delivery.status}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-[10px] uppercase text-zinc-600">
                    Response
                  </p>

                  <p
                    className={`mt-1 font-mono ${
                      delivery.response >= 400
                        ? "text-red-400"
                        : "text-zinc-400"
                    }`}
                  >
                    {delivery.response}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase text-zinc-600">
                    Duration
                  </p>

                  <p className="mt-1 text-zinc-400">
                    {delivery.duration}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase text-zinc-600">
                    Received
                  </p>

                  <p className="mt-1 text-zinc-400">
                    {delivery.received}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty */}

        {filteredDeliveries.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-zinc-400">
              No deliveries found.
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              Try changing the status filter.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}

      <div className="flex items-center justify-between text-[11px] text-zinc-600">
        <span>
          {filteredDeliveries.length}{" "}
          {filteredDeliveries.length === 1
            ? "delivery"
            : "deliveries"}
        </span>

        <span>
          Showing last{" "}
          {timeFilter === "24h"
            ? "24 hours"
            : timeFilter === "7d"
            ? "7 days"
            : "30 days"}
        </span>
      </div>
    </div>
  );
};

const DeliveryStatus = ({ status }) => {
  const isSuccess = status === "success";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
        isSuccess
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-red-500/10 text-red-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isSuccess
            ? "bg-emerald-400"
            : "bg-red-400"
        }`}
      />

      {isSuccess ? "Success" : "Failed"}
    </span>
  );
};

export default WebhookLogsPage;