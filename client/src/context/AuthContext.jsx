import { createContext, useContext } from "react";
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

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
    retry: false,
  });

  const user = data?.user || null;

  const loginMutation = useMutation({
    mutationFn: loginUser,

    onSuccess: (data) => {

      sessionStorage.setItem(
        "accessToken",
        data.accessToken
      );

      queryClient.setQueryData(
        ["currentUser"],
        {
          user: data.user,
        }
      );
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerUser,

    onSuccess: (data) => {
   
      sessionStorage.setItem(
        "accessToken",
        data.accessToken
      );

      queryClient.setQueryData(
        ["currentUser"],
        {
          user: data.user,
        }
      );
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutUser,

    onSuccess: () => {

      sessionStorage.removeItem("accessToken");

      queryClient.clear();
    },
  });

  const login = async (formData) => {
    return loginMutation.mutateAsync(formData);
  };

  const register = async (formData) => {
    return registerMutation.mutateAsync(formData);
  };

  const logout = async () => {
    return logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading: isLoading,

        login,
        register,
        logout,

        loginLoading: loginMutation.isPending,
        registerLoading: registerMutation.isPending,
        logoutLoading: logoutMutation.isPending,

        loginError: loginMutation.error,
        registerError: registerMutation.error,
        logoutError: logoutMutation.error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};