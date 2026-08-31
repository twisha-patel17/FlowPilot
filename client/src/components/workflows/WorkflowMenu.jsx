import { useEffect, useRef } from "react";
import {
  FiEdit2,
  FiCopy,
  FiPower,
  FiTrash2,
} from "react-icons/fi";

const WorkflowMenu = ({
  workflow,
  open,
  onClose,
  onEdit,
  onDuplicate,
  onToggle,
  onDelete,
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, [open, onClose]);

  if (!open || !workflow) {
    return null;
  }

  const isActive = workflow.status === "Active";

  const handleAction = (action) => {
    action(workflow);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-4 z-30 mt-1 w-44 overflow-hidden rounded-lg border border-zinc-800 bg-[#151517] p-1 shadow-xl shadow-black/30"
    >
      {/* Edit */}
      <button
        type="button"
        onClick={() => handleAction(onEdit)}
        className="flex h-9 w-full items-center gap-3 rounded-md px-3 text-left text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
      >
        <FiEdit2 className="h-3.5 w-3.5" />
        Edit
      </button>

      {/* Duplicate */}
      <button
        type="button"
        onClick={() => handleAction(onDuplicate)}
        className="flex h-9 w-full items-center gap-3 rounded-md px-3 text-left text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
      >
        <FiCopy className="h-3.5 w-3.5" />
        Duplicate
      </button>

      {/* Activate / Deactivate */}
      <button
        type="button"
        onClick={() => handleAction(onToggle)}
        className="flex h-9 w-full items-center gap-3 rounded-md px-3 text-left text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
      >
        <FiPower className="h-3.5 w-3.5" />
        {isActive ? "Deactivate" : "Activate"}
      </button>

      <div className="my-1 h-px bg-zinc-800/70" />

      {/* Delete */}
      <button
        type="button"
        onClick={() => handleAction(onDelete)}
        className="flex h-9 w-full items-center gap-3 rounded-md px-3 text-left text-xs text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
      >
        <FiTrash2 className="h-3.5 w-3.5" />
        Delete
      </button>
    </div>
  );
};

export default WorkflowMenu;