import { createContext, useContext, useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { getWorkspaces } from "../api/workspaceApi";

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const [currentWorkspace, setCurrentWorkspace] = useState(null);

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["workspaces"],
    queryFn: getWorkspaces,
  });

  const workspaces = data?.workspaces || [];

  // Select the first workspace when workspaces are loaded
  useEffect(() => {
    console.log("WORKSPACES FROM API:", workspaces);
    if (!currentWorkspace && workspaces.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentWorkspace(workspaces[0]);
    }
  }, [workspaces, currentWorkspace]);

  const switchWorkspace = (workspace) => {
  console.log("SWITCHED WORKSPACE:", workspace);
  console.log("WORKSPACE ID:", workspace?._id);
  setCurrentWorkspace(workspace);
};

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        switchWorkspace,
        loading: isLoading,
        error: isError,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error(
      "useWorkspace must be used inside WorkspaceProvider"
    );
  }

  return context;
};

export default WorkspaceContext;