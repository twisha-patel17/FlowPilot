import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { refreshAccessToken } from "../api/authApi";

const GithubCallbackPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const completeGithubLogin = async () => {
      try {
        const data = await refreshAccessToken();

        if (!data?.accessToken) {
          throw new Error("Access token was not returned");
        }

        localStorage.setItem("token", data.accessToken);

        if (data.user) {
          queryClient.setQueryData(["currentUser"], {
            user: data.user,
          });
        } else {
          await queryClient.invalidateQueries({
            queryKey: ["currentUser"],
          });
        }

        navigate("/app", { replace: true });
      } catch (error) {
        console.error(
          "GitHub login completion failed:",
          error
        );

        localStorage.removeItem("token");

        navigate("/login?github=error", {
          replace: true,
        });
      }
    };

    completeGithubLogin();
  }, [navigate, queryClient]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-violet-500" />

        <h1 className="text-lg font-medium">
          Signing you in...
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Completing GitHub authentication
        </p>
      </div>
    </div>
  );
};

export default GithubCallbackPage;