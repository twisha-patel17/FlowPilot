import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Hero = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleCreateWorkflow = () => {
    if (isAuthenticated) {
      navigate("/app/workflows/new");
    } else {
      navigate("/login", {
        state: {
          from: "/app/workflows/new",
        },
      });
    }
  };

  return (
    <section className="relative overflow-hidden bg-[#09090b] px-5 pb-24 pt-32 sm:px-8">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-32 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/10 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl text-center">

        {/* Version Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-2 font-mono text-xs text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
          <span>v2.4</span>
          <span className="text-zinc-600">—</span>
          <span>Scheduled triggers are here</span>
        </div>

        {/* Heading */}
        <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-[1.05] tracking-[-0.045em] text-zinc-50 sm:text-6xl lg:text-7xl">
          Automate your workflows.
          <br />
          Build them{" "}
          <span className="text-violet-500">visually.</span>
        </h1>

        {/* Description */}
        <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
          Connect triggers, logic, and actions into automated workflows that
          run in production — with full visibility into every execution.
        </p>

        {/* Buttons */}
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">

          <button
            type="button"
            onClick={handleCreateWorkflow}
            className="rounded-lg bg-violet-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400"
          >
            Create Workflow
          </button>

          <a
            href="#demo"
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800"
          >
            View Demo
          </a>

        </div>

        {/* Workflow Preview */}
        <div
          id="demo"
          className="mx-auto mt-20 max-w-4xl overflow-hidden rounded-xl border border-zinc-800 bg-[#111113] text-left shadow-2xl shadow-black/30"
        >

          {/* Window Header */}
          <div className="flex h-16 items-center gap-2 border-b border-zinc-800 px-6">

            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />

            <span className="ml-3 font-mono text-xs text-zinc-500">
              high-priority-issues.flow
            </span>

          </div>

          {/* Workflow */}
          <div className="overflow-x-auto px-8 py-10">

            <div className="flex min-w-[720px] items-center justify-center">

              {/* GitHub */}
              <div className="w-36 shrink-0 rounded-lg border border-violet-500/40 bg-zinc-900 px-4 py-4">

                <div className="flex items-center gap-2">
                  <span className="text-sm">🐙</span>

                  <span className="text-sm font-semibold text-zinc-100">
                    GitHub
                  </span>
                </div>

                <p className="mt-2 font-mono text-xs text-zinc-500">
                  Issue Created
                </p>

              </div>

              <div className="relative h-px w-12 shrink-0 bg-zinc-700">
                <span className="flow-dot absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.9)]" />
              </div>

              {/* Filter */}
              <div className="w-36 shrink-0 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-4">

                <div className="flex items-center gap-2">
                  <span className="text-sm">⚙</span>

                  <span className="text-sm font-semibold text-zinc-100">
                    Filter
                  </span>
                </div>

                <p className="mt-2 font-mono text-xs text-zinc-500">
                  priority == HIGH
                </p>

              </div>

              <div className="relative h-px w-10 shrink-0 bg-zinc-700">
                <span className="flow-dot absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.9)]" />
              </div>

              {/* Discord */}
              <div className="w-36 shrink-0 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-4">

                <div className="flex items-center gap-2">
                  <span className="text-sm">💬</span>

                  <span className="text-sm font-semibold text-zinc-100">
                    Discord
                  </span>
                </div>

                <p className="mt-2 font-mono text-xs text-zinc-500">
                  #development
                </p>

              </div>

              <div className="relative h-px w-10 shrink-0 bg-zinc-700">
                <span className="flow-dot absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.9)]" />
              </div>

              {/* HTTP */}
              <div className="w-36 shrink-0 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-4">

                <div className="flex items-center gap-2">
                  <span className="text-sm">🚀</span>

                  <span className="text-sm font-semibold text-zinc-100">
                    HTTP Request
                  </span>
                </div>

                <p className="mt-2 font-mono text-xs text-zinc-500">
                  POST /notify
                </p>

              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;