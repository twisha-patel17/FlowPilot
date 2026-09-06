/* eslint-disable react-hooks/purity */
import { useMemo, useState } from "react";
import { FiArrowLeft, FiRefreshCw } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import {
  getWebhooks,
  getWebhookDeliveries,
} from "../api/webhookApi";

const WebhookLogsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [timeFilter, setTimeFilter] =
    useState("24h");

  const {
    data: webhookData,
    isLoading: webhookLoading,
  } = useQuery({
    queryKey: ["webhooks"],
    queryFn: getWebhooks,
  });

  const webhooks = webhookData?.webhooks || [];

  const webhook = webhooks.find(
    (item) => item._id === id
  );

  const {
    data: deliveryData,
    isLoading: deliveriesLoading,
    refetch,
  } = useQuery({
    queryKey: ["webhook-deliveries", id],
    queryFn: () => getWebhookDeliveries(id),
    enabled: !!webhook,
  });

  const deliveries =
    deliveryData?.deliveries || [];

  const filteredDeliveries = useMemo(() => {
    const now = Date.now();

    const timeLimit =
      timeFilter === "24h"
        ? 24 * 60 * 60 * 1000
        : timeFilter === "7d"
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;

    return deliveries.filter((delivery) => {
      const matchesStatus =
        statusFilter === "all" ||
        delivery.status === statusFilter;

      const receivedAt = new Date(
        delivery.receivedAt
      ).getTime();

      const matchesTime =
        now - receivedAt <= timeLimit;

      return matchesStatus && matchesTime;
    });
  }, [
    deliveries,
    statusFilter,
    timeFilter,
  ]);

  const formatDuration = (duration) => {
    if (duration === undefined || duration === null) {
      return "-";
    }

    return `${(duration / 1000).toFixed(2)}s`;
  };

  const formatReceived = (date) => {
    if (!date) {
      return "-";
    }

    const diff =
      Date.now() -
      new Date(date).getTime();

    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) {
      return "Just now";
    }

    const minutes = Math.floor(
      seconds / 60
    );

    if (minutes < 60) {
      return `${minutes} ${
        minutes === 1
          ? "minute"
          : "minutes"
      } ago`;
    }

    const hours = Math.floor(
      minutes / 60
    );

    if (hours < 24) {
      return `${hours} ${
        hours === 1
          ? "hour"
          : "hours"
      } ago`;
    }

    const days = Math.floor(
      hours / 24
    );

    return `${days} ${
      days === 1 ? "day" : "days"
    } ago`;
  };

  if (webhookLoading) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() =>
            navigate("/app/webhooks")
          }
          className="inline-flex items-center gap-2 text-xs text-zinc-500 transition hover:text-zinc-200"
        >
          <FiArrowLeft className="h-3.5 w-3.5" />
          Back to Webhooks
        </button>

        <div className="rounded-xl border border-zinc-800/70 bg-[#0d0d0f] p-8 text-center">
          <p className="text-sm text-zinc-500">
            Loading webhook...
          </p>
        </div>
      </div>
    );
  }

  if (!webhook) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() =>
            navigate("/app/webhooks")
          }
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

  const endpoint = `http://localhost:5000/api/webhooks/${webhook.publicId}`;

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        type="button"
        onClick={() =>
          navigate("/app/webhooks")
        }
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
          {endpoint}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="h-8 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-zinc-300 outline-none focus:border-violet-500/50"
          >
            <option value="all">
              All statuses
            </option>

            <option value="success">
              Success
            </option>

            <option value="failed">
              Failed
            </option>
          </select>

          <select
            value={timeFilter}
            onChange={(event) =>
              setTimeFilter(event.target.value)
            }
            className="h-8 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-zinc-300 outline-none focus:border-violet-500/50"
          >
            <option value="24h">
              Last 24 hours
            </option>

            <option value="7d">
              Last 7 days
            </option>

            <option value="30d">
              Last 30 days
            </option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={deliveriesLoading}
          className="inline-flex h-8 items-center justify-center gap-2 self-start rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          <FiRefreshCw
            className={`h-3.5 w-3.5 ${
              deliveriesLoading
                ? "animate-spin"
                : ""
            }`}
          />

          Refresh
        </button>
      </div>

      {/* Logs */}
      <div className="overflow-hidden rounded-xl border border-zinc-800/70 bg-[#0d0d0f]">
        {deliveriesLoading ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-zinc-500">
              Loading deliveries...
            </p>
          </div>
        ) : (
          <>
            {/* Desktop */}
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
                  {filteredDeliveries.map(
                    (delivery) => (
                      <tr
                        key={delivery._id}
                        className="border-b border-zinc-800/50 last:border-0"
                      >
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs text-zinc-300">
                            {delivery.event}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <DeliveryStatus
                            status={
                              delivery.status
                            }
                          />
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`font-mono text-xs ${
                              delivery.responseCode >=
                              400
                                ? "text-red-400"
                                : "text-zinc-400"
                            }`}
                          >
                            {delivery.responseCode ||
                              "-"}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-xs text-zinc-500">
                          {formatDuration(
                            delivery.duration
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-xs text-zinc-500">
                          {formatReceived(
                            delivery.receivedAt
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y divide-zinc-800/50 md:hidden">
              {filteredDeliveries.map(
                (delivery) => (
                  <div
                    key={delivery._id}
                    className="space-y-3 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs text-zinc-300">
                        {delivery.event}
                      </span>

                      <DeliveryStatus
                        status={
                          delivery.status
                        }
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-[10px] uppercase text-zinc-600">
                          Response
                        </p>

                        <p
                          className={`mt-1 font-mono ${
                            delivery.responseCode >=
                            400
                              ? "text-red-400"
                              : "text-zinc-400"
                          }`}
                        >
                          {delivery.responseCode ||
                            "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase text-zinc-600">
                          Duration
                        </p>

                        <p className="mt-1 text-zinc-400">
                          {formatDuration(
                            delivery.duration
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase text-zinc-600">
                          Received
                        </p>

                        <p className="mt-1 text-zinc-400">
                          {formatReceived(
                            delivery.receivedAt
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Empty */}
            {filteredDeliveries.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-zinc-400">
                  No deliveries found.
                </p>

                <p className="mt-1 text-xs text-zinc-600">
                  Send a request to this webhook endpoint to create a delivery log.
                </p>
              </div>
            )}
          </>
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