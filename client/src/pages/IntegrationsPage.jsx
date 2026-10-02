import { useState } from "react";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  FiGlobe,
  FiMail,
} from "react-icons/fi";

import {
  SiDiscord,
  SiGithub,
  SiMongodb,
} from "react-icons/si";

import toast from "react-hot-toast";

import IntegrationCard from "../components/integrations/IntegrationCard";
import ConnectIntegrationModal from "../components/integrations/ConnectIntegrationModal";

import {
  getIntegrations,
  createIntegration,
  toggleIntegration,
} from "../api/integrationApi";

import { useWorkspace } from "../context/WorkspaceContext";

const availableIntegrations = [
  {
    provider: "github",
    icon: <SiGithub className="h-6 w-6" />,
    name: "GitHub",
    description:
      "Connect GitHub repositories to trigger and automate workflows.",
  },
  {
    provider: "discord",
    icon: <SiDiscord className="h-6 w-6" />,
    name: "Discord",
    description:
      "Send messages and notifications to Discord channels.",
  },
  {
    provider: "email",
    icon: <FiMail className="h-6 w-6" />,
    name: "Email",
    description:
      "Send transactional emails from your workflows through the Resend API.",
  },
  {
    provider: "http",
    icon: <FiGlobe className="h-6 w-6" />,
    name: "HTTP",
    description:
      "Make HTTP requests to external APIs from your workflows.",
  },
  {
    provider: "mongodb",
    icon: <SiMongodb className="h-6 w-6" />,
    name: "MongoDB",
    description:
      "Read from and write to a MongoDB cluster as a workflow action.",
  },
];

const IntegrationsPage = () => {
  const queryClient = useQueryClient();

  const [selectedIntegration, setSelectedIntegration] =
    useState(null);

  const {
    currentWorkspace,
    loading: workspaceLoading,
  } = useWorkspace();

  const workspaceId = currentWorkspace?._id;

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["integrations", workspaceId],
    queryFn: () => getIntegrations(workspaceId),
    enabled: !!workspaceId,
  });

  const createMutation = useMutation({
    mutationFn: createIntegration,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["integrations", workspaceId],
      });

      setSelectedIntegration(null);

      toast.success(
        "Integration connected successfully."
      );
    },

    onError: (error) => {
      console.error(
        "Create integration error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to connect integration."
      );
    },
  });

  const toggleMutation = useMutation({
    mutationFn: toggleIntegration,

    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["integrations", workspaceId],
      });

      const status =
        response?.integration?.status ||
        response?.status;

      if (status === "connected") {
        toast.success(
          "Integration connected successfully."
        );
      } else if (status === "disconnected") {
        toast.success(
          "Integration disconnected successfully."
        );
      } else {
        toast.success(
          "Integration status updated successfully."
        );
      }
    },

    onError: (error) => {
      console.error(
        "Toggle integration error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to update integration."
      );
    },
  });

  const integrations =
    data?.integrations || [];

  // Temporary debugging logs
  console.log(
    "FLOWPILOT INTEGRATIONS:",
    data
  );

  console.log(
    "FLOWPILOT EMAIL:",
    integrations.filter(
      (integration) =>
        integration.provider === "email"
    )
  );

  const getConnectedIntegration = (
    provider
  ) => {
    return integrations.find(
      (integration) =>
        integration.provider === provider
    );
  };

  const handleConnect = (integration) => {
    setSelectedIntegration(integration);
  };

  const handleManage = (integration) => {
    const connectedIntegration =
      getConnectedIntegration(
        integration.provider
      );

    if (!connectedIntegration) {
      setSelectedIntegration(integration);
      return;
    }

    // Management UI can be added here later.
  };

  const handleDisconnect = (integration) => {
    const connectedIntegration =
      getConnectedIntegration(
        integration.provider
      );

    if (!connectedIntegration) {
      return;
    }

    toggleMutation.mutate({
      id: connectedIntegration._id,
      workspaceId,
    });
  };

  const handleCreateIntegration = (
    integrationData
  ) => {
    if (!workspaceId) {
      toast.error("No workspace selected.");
      return;
    }

    createMutation.mutate({
      integrationData,
      workspaceId,
    });
  };

  if (workspaceLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
            Integrations
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Connect the services your workflows can
            trigger from and act on.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800/70 bg-[#0d0d0f] px-6 py-10 text-center">
          <p className="text-sm text-zinc-500">
            Loading workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!workspaceId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
            Integrations
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Connect the services your workflows can
            trigger from and act on.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800/70 bg-[#0d0d0f] px-6 py-10 text-center">
          <p className="text-sm text-zinc-500">
            No workspace selected.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
            Integrations
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Connect the services your workflows can
            trigger from and act on.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800/70 bg-[#0d0d0f] px-6 py-10 text-center">
          <p className="text-sm text-zinc-500">
            Loading integrations...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
            Integrations
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Connect the services your workflows can
            trigger from and act on.
          </p>
        </div>

        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-6 py-10 text-center">
          <p className="text-sm text-red-400">
            Failed to load integrations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}

        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
            Integrations
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Connect the services your workflows can
            trigger from and act on.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {availableIntegrations.map(
            (integration) => {
              const connectedIntegration =
                getConnectedIntegration(
                  integration.provider
                );

              const isConnected =
                !!connectedIntegration &&
                connectedIntegration.status ===
                  "connected";

              const isHttp =
                integration.provider === "http";

              return (
                <IntegrationCard
                  key={integration.provider}
                  {...integration}
                  status={
                    isHttp
                      ? "Always available"
                      : isConnected
                      ? "Connected"
                      : "Not connected"
                  }
                  account={
                    connectedIntegration?.metadata
                      ?.account ||
                    connectedIntegration?.metadata
                      ?.username ||
                    connectedIntegration?.name
                  }
                  connected={isConnected}
                  onConnect={() =>
                    handleConnect(integration)
                  }
                  onManage={() =>
                    handleManage(integration)
                  }
                  onDisconnect={() =>
                    handleDisconnect(
                      integration
                    )
                  }
                />
              );
            }
          )}
        </div>
      </div>

      {selectedIntegration && (
        <ConnectIntegrationModal
          integration={selectedIntegration}
          onClose={() =>
            setSelectedIntegration(null)
          }
          onConnect={
            handleCreateIntegration
          }
          isConnecting={
            createMutation.isPending
          }
        />
      )}
    </>
  );
};

export default IntegrationsPage;