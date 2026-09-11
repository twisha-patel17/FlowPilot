import { useAuth } from "../../context/AuthContext";
import { useWorkspace } from "../../context/WorkspaceContext";

const OverviewHeader = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const userName =
    user?.name ||
    user?.username ||
    "there";

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
        {getGreeting()}, {userName}
      </h1>

      <p className="mt-1 text-sm text-zinc-500">
        Here's what's happening with your workflows
        {currentWorkspace?.name
          ? ` in ${currentWorkspace.name}.`
          : "."}
      </p>
    </div>
  );
};

export default OverviewHeader;