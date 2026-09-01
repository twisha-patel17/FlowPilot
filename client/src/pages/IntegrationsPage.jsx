import IntegrationCard from "../components/integrations/IntegrationCard";

const integrations = [
  {
    id: "github",
    icon: "🐙",
    name: "GitHub",
    status: "Connected",
    account: "twisha-patel17",
    connected: true,
  },
  {
    id: "discord",
    icon: "💬",
    name: "Discord",
    status: "Connected",
    account: "DevSpace Workspace",
    connected: true,
  },
  {
    id: "email",
    icon: "✉",
    name: "Email",
    description:
      "Send transactional emails from your workflows via SMTP or a provider API.",
    status: "Not connected",
    connected: false,
  },
  {
    id: "http",
    icon: "📡",
    name: "HTTP",
    status: "Always available",
    account: "No auth required",
    connected: false,
  },
  {
    id: "mongodb",
    icon: "🍑",
    name: "MongoDB",
    description:
      "Read from and write to a MongoDB cluster as a workflow action.",
    status: "Not connected",
    connected: false,
  },
];

const IntegrationsPage = () => {
  const handleConnect = (integration) => {
    console.log("Connect:", integration.name);
  };

  const handleManage = (integration) => {
    console.log("Manage:", integration.name);
  };

  const handleDisconnect = (integration) => {
    console.log("Disconnect:", integration.name);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
          Integrations
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Connect the services your workflows can trigger from and act on.
        </p>
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            {...integration}
            onConnect={() => handleConnect(integration)}
            onManage={() => handleManage(integration)}
            onDisconnect={() => handleDisconnect(integration)}
          />
        ))}
      </div>
    </div>
  );
};

export default IntegrationsPage;
