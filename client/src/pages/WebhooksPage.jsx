import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import WebhookCard from "../components/webhooks/WebhookCard";
import NewWebhookModal from "../components/webhooks/NewWebhookModal";

import {
  getWebhooks,
  createWebhook,
  toggleWebhook,
} from "../api/webhookApi";

import { getWorkflows } from "../api/workflowApi";

import { useWorkspace } from "../context/WorkspaceContext";

const WebhooksPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);

  const {
    currentWorkspace,
    loading: workspaceLoading,
  } = useWorkspace();

  const workspaceId = currentWorkspace?._id;

  const {
    data: webhookData,
    isLoading: webhooksLoading,
    isError: webhooksError,
  } = useQuery({
    queryKey: ["webhooks", workspaceId],
    queryFn: () => getWebhooks(workspaceId),
    enabled: !!workspaceId,
  });

  const {
    data: workflowData,
    isLoading: workflowsLoading,
  } = useQuery({
    queryKey: ["workflows", workspaceId],
    queryFn: () => getWorkflows(workspaceId),
    enabled: !!workspaceId,
  });

  const webhooks = webhookData?.webhooks || [];
  const workflows = workflowData?.workflows || [];

  const createMutation = useMutation({
    mutationFn: createWebhook,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["webhooks", workspaceId],
      });

      setShowModal(false);
    },

    onError: (error) => {
      console.error(
        "Create webhook error:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to create webhook"
      );
    },
  });

  const toggleMutation = useMutation({
    mutationFn: toggleWebhook,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["webhooks", workspaceId],
      });
    },

    onError: (error) => {
      console.error(
        "Toggle webhook error:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to update webhook"
      );
    },
  });

  const handleCreate = (webhookData) => {
    if (!workspaceId) {
      alert("No workspace selected");
      return;
    }

    createMutation.mutate({
      webhookData,
      workspaceId,
    });
  };

  const handleViewLogs = (id) => {
    navigate(`/app/webhooks/${id}/logs`);
  };

  const formatLastEvent = (date) => {
    if (!date) {
      return "Never";
    }

    const diff =
      // eslint-disable-next-line react-hooks/purity
      Date.now() - new Date(date).getTime();

    const minutes = Math.floor(
      diff / (1000 * 60)
    );

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes} ${
        minutes === 1 ? "minute" : "minutes"
      } ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours} ${
        hours === 1 ? "hour" : "hours"
      } ago`;
    }

    const days = Math.floor(hours / 24);

    return `${days} ${
      days === 1 ? "day" : "days"
    } ago`;
  };

  if (workspaceLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-zinc-500">
          Loading workspace...
        </p>
      </div>
    );
  }

  if (!workspaceId) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-zinc-500">
          No workspace selected.
        </p>
      </div>
    );
  }

  if (webhooksLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
            Webhooks
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Manage inbound endpoints that trigger your workflows.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800/70 bg-[#0d0d0f] p-8 text-center">
          <p className="text-sm text-zinc-500">
            Loading webhooks...
          </p>
        </div>
      </div>
    );
  }

  if (webhooksError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
            Webhooks
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Manage inbound endpoints that trigger your workflows.
          </p>
        </div>

        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <p className="text-sm text-red-400">
            Failed to load webhooks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
            Webhooks
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Manage inbound endpoints that trigger your workflows.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-md bg-violet-500 px-3.5 text-xs font-medium text-white transition hover:bg-violet-400 sm:self-auto"
        >
          <FiPlus className="h-3.5 w-3.5" />
          New Webhook
        </button>
      </div>

      {/* Webhook list */}
      {webhooks.length === 0 ? (
        <div className="rounded-xl border border-zinc-800/70 bg-[#0d0d0f] px-6 py-12 text-center">
          <h2 className="text-sm font-semibold text-zinc-200">
            No webhooks yet
          </h2>

          <p className="mt-2 text-xs text-zinc-500">
            Create a webhook to trigger your workflows from external events.
          </p>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="mt-4 rounded-md bg-violet-500 px-4 py-2 text-xs font-medium text-white transition hover:bg-violet-400"
          >
            Create Webhook
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook) => {
            const endpoint = `http://localhost:5000/api/webhooks/${webhook.publicId}`;

            return (
              <WebhookCard
                key={webhook._id}
                name={webhook.name}
                active={webhook.active}
                endpoint={endpoint}
                events={webhook.events || []}
                lastEvent={formatLastEvent(
                  webhook.lastEventAt
                )}
                onToggle={() =>
                  toggleMutation.mutate({
                    id: webhook._id,
                    workspaceId,
                  })
                }
                onViewLogs={() =>
                  handleViewLogs(webhook._id)
                }
                isToggling={
                  toggleMutation.isPending &&
                  toggleMutation.variables?.id ===
                    webhook._id
                }
              />
            );
          })}
        </div>
      )}

      {/* New Webhook Modal */}
      {showModal && (
        <NewWebhookModal
          workflows={workflows}
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
          isCreating={createMutation.isPending}
        />
      )}

      {workflowsLoading && showModal && (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-zinc-400">
          Loading workflows...
        </div>
      )}
    </div>
  );
};

export default WebhooksPage;