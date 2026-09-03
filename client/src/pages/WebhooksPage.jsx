import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import WebhookCard from "../components/webhooks/WebhookCard";
import NewWebhookModal from "../components/webhooks/NewWebhookModal";

const initialWebhooks = [
  {
    id: "abc123",
    name: "GitHub Issues Webhook",
    active: true,
    endpoint: "/api/webhooks/github/abc123",
    events: ["issues.opened", "issues.closed"],
    lastEvent: "2 minutes ago",
  },
  {
    id: "f92d1e",
    name: "Manual Deploy Trigger",
    active: false,
    endpoint: "/api/webhooks/deploy/f92d1e",
    events: ["deployment.created"],
    lastEvent: "2 days ago",
  },
];

const workflows = [
  {
    id: "workflow-1",
    name: "High Priority GitHub Issues",
  },
  {
    id: "workflow-2",
    name: "Manual Deploy Workflow",
  },
];

const WebhooksPage = () => {
  const navigate = useNavigate();

  const [webhooks, setWebhooks] = useState(initialWebhooks);
  const [showModal, setShowModal] = useState(false);

  const handleToggle = (id) => {
    setWebhooks((currentWebhooks) =>
      currentWebhooks.map((webhook) => {
        if (webhook.id !== id) {
          return webhook;
        }

        return {
          ...webhook,
          active: !webhook.active,
        };
      })
    );
  };

  const handleCreate = (webhookData) => {
    const newWebhook = {
      id: `webhook-${Date.now()}`,
      name: webhookData.name,
      active: true,
      endpoint: `/api/webhooks/custom/${Math.random()
        .toString(36)
        .substring(2, 8)}`,
      events: webhookData.events,
      lastEvent: "Never",
    };

    setWebhooks((currentWebhooks) => [
      newWebhook,
      ...currentWebhooks,
    ]);

    setShowModal(false);
  };

  const handleViewLogs = (id) => {
    navigate(`/app/webhooks/${id}/logs`);
  };

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
          {webhooks.map((webhook) => (
            <WebhookCard
              key={webhook.id}
              id={webhook.id}
              name={webhook.name}
              active={webhook.active}
              endpoint={webhook.endpoint}
              events={webhook.events}
              lastEvent={webhook.lastEvent}
              onToggle={() => handleToggle(webhook.id)}
              onViewLogs={() => handleViewLogs(webhook.id)}
            />
          ))}
        </div>
      )}

      {/* New Webhook Modal */}

      {showModal && (
        <NewWebhookModal
          workflows={workflows}
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
};

export default WebhooksPage;