import { useState } from "react";
import { FiX } from "react-icons/fi";

const ConnectIntegrationModal = ({
  integration,
  onClose,
  onConnect,
  isConnecting = false,
}) => {
  const [name, setName] = useState(
    `${integration.name} Connection`
  );

  const [value, setValue] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    onConnect({
      name: name.trim(),
      provider: integration.provider,
      credentials: {
        value: value.trim(),
      },
    });
  };

  const getCredentialLabel = () => {
    switch (integration.provider) {
      case "discord":
        return "Webhook URL";

      case "github":
        return "Access Token";

      case "email":
        return "SMTP Host / API Key";

      case "mongodb":
        return "MongoDB Connection String";

      default:
        return "Connection Value";
    }
  };

  const getPlaceholder = () => {
    switch (integration.provider) {
      case "discord":
        return "https://discord.com/api/webhooks/...";

      case "github":
        return "Enter GitHub access token";

      case "email":
        return "SMTP host or provider API key";

      case "mongodb":
        return "mongodb+srv://...";

      default:
        return "Enter connection value";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-[#0d0d0f] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/70 px-5 py-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
              Connect integration
            </p>

            <h2 className="mt-1 text-sm font-semibold text-zinc-100">
              {integration.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-5"
        >
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">
              Connection name
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="My Discord"
              className="h-10 w-full rounded-md border border-zinc-800 bg-[#111114] px-3 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-violet-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">
              {getCredentialLabel()}
            </label>

            <input
              type={
                integration.provider === "github" ||
                integration.provider === "mongodb"
                  ? "password"
                  : "text"
              }
              value={value}
              onChange={(event) =>
                setValue(event.target.value)
              }
              placeholder={getPlaceholder()}
              className="h-10 w-full rounded-md border border-zinc-800 bg-[#111114] px-3 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-violet-500"
            />
          </div>

          <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
            <p className="text-[11px] leading-5 text-amber-400">
              This is currently a development connection
              form. We'll add provider-specific OAuth and
              secure credential handling later.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-zinc-800/70 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-md border border-zinc-800 px-4 text-xs font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isConnecting ||
                !name.trim()
              }
              className="h-9 rounded-md bg-violet-600 px-4 text-xs font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isConnecting
                ? "Connecting..."
                : "Connect"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConnectIntegrationModal;