import RegisterForm from "../components/auth/RegisterForm";
import flowpilotIcon from "../assets/flowpilot-icon-512.png";

const RegisterPage = () => {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090b] px-5 py-12">

      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-600/10 blur-[120px]" />

      <div className="relative w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <a
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-zinc-100"
          >
            <img
              src={flowpilotIcon}
              alt="FlowPilot"
              className="h-7 w-7 rounded-md"
            />

            <span>FlowPilot</span>
          </a>
        </div>

        {/* Heading */}
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Your first three workflows are free.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-zinc-800 bg-[#0d0d0f] p-6 shadow-2xl shadow-black/20 sm:p-7">
          <RegisterForm />
        </div>

      </div>
    </main>
  );
};

export default RegisterPage;