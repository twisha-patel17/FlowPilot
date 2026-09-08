import { useState } from "react";
import { FiX } from "react-icons/fi";

const CreateWorkspaceModal = ({
  isOpen,
  onClose,
  onCreate,
  loading,
}) => {
  const [name, setName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) return;

    await onCreate(name.trim());

    setName("");
  };

  const handleClose = () => {
    setName("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-[#111113] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Create workspace
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Create a new workspace for your workflows.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
          >
            <FiX size={17} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5">
          <label className="mb-2 block text-xs font-medium text-zinc-300">
            Workspace name
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. My Projects"
            autoFocus
            maxLength={100}
            className="w-full rounded-lg border border-zinc-800 bg-[#0d0d0f] px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-500"
          />

          {/* Buttons */}
          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create workspace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWorkspaceModal;