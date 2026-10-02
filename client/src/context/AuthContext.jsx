import {
  createContext,
  useContext,
  useEffect,
} from "react";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
} from "../api/authApi";

import socket from "../socket/socket";

const AuthContext =
  createContext(null);

export const AuthProvider = ({
  children,
}) => {
  const queryClient =
    useQueryClient();

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,

    retry: false,

    refetchOnWindowFocus: true,
  });

  const user =
    data?.user || null;

  useEffect(() => {
    if (user) {
      if (!socket.connected) {
        socket.connect();
      }

      return;
    }

    if (socket.connected) {
      socket.disconnect();
    }
  }, [user]);

  const loginMutation =
    useMutation({
      mutationFn: loginUser,

      onSuccess: (data) => {
        if (data?.accessToken) {
          localStorage.setItem(
            "token",
            data.accessToken
          );
        }

        queryClient.setQueryData(
          ["currentUser"],
          {
            user: data.user,
          }
        );
      },
    });

  const registerMutation =
    useMutation({
      mutationFn: registerUser,

      onSuccess: (data) => {
        if (data?.accessToken) {
          localStorage.setItem(
            "token",
            data.accessToken
          );
        }

        queryClient.setQueryData(
          ["currentUser"],
          {
            user: data.user,
          }
        );
      },
    });

  const logoutMutation =
    useMutation({
      mutationFn: logoutUser,

      onSuccess: () => {
        localStorage.removeItem(
          "token"
        );

        queryClient.setQueryData(
          ["currentUser"],
          null
        );

        if (socket.connected) {
          socket.disconnect();
        }
      },
    });

  const login = async (
    formData
  ) => {
    return loginMutation.mutateAsync(
      formData
    );
  };

  const register = async (
    formData
  ) => {
    return registerMutation.mutateAsync(
      formData
    );
  };

  const logout = async () => {
    return logoutMutation.mutateAsync();
  };


  return (
    <AuthContext.Provider
      value={{
        user,

        isAuthenticated:
          !!user,

        loading:
          isLoading,

        authError:
          isError,

        login,
        register,
        logout,

        loginLoading:
          loginMutation.isPending,

        registerLoading:
          registerMutation.isPending,

        logoutLoading:
          logoutMutation.isPending,

        loginError:
          loginMutation.error,

        registerError:
          registerMutation.error,

        logoutError:
          logoutMutation.error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};

export default AuthContext;