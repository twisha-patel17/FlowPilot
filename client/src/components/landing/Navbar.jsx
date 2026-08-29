import { useState } from "react";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-zinc-800/70 bg-[#09090b]/95 backdrop-blur-sm">
      <nav className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-5 lg:px-8">

        {/* Logo */}
        <a
          href="/"
          className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-zinc-100"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500 text-xs font-bold text-white">
            ~
          </span>

          <span>FlowPilot</span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#product"
            className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
          >
            Product
          </a>

          <a
            href="#integrations"
            className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
          >
            Integrations
          </a>

          <a
            href="#docs"
            className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
          >
            Docs
          </a>

          <a
            href="#pricing"
            className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
          >
            Pricing
          </a>
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-5 md:flex">
          <a
            href="/login"
            className="text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100"
          >
            Sign in
          </a>

          <a
            href="/signup"
            className="rounded-lg bg-violet-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-violet-400"
          >
            Get started
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-300 hover:bg-zinc-800 md:hidden"
          aria-label="Toggle navigation"
        >
          <span className="text-xl">
            {menuOpen ? "×" : "☰"}
          </span>
        </button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="border-t border-zinc-800/70 bg-[#09090b] px-5 py-5 md:hidden">
          <div className="flex flex-col gap-4">

            <a
              href="#product"
              onClick={() => setMenuOpen(false)}
              className="text-sm text-zinc-400 hover:text-zinc-100"
            >
              Product
            </a>

            <a
              href="#integrations"
              onClick={() => setMenuOpen(false)}
              className="text-sm text-zinc-400 hover:text-zinc-100"
            >
              Integrations
            </a>

            <a
              href="#docs"
              onClick={() => setMenuOpen(false)}
              className="text-sm text-zinc-400 hover:text-zinc-100"
            >
              Docs
            </a>

            <a
              href="#pricing"
              onClick={() => setMenuOpen(false)}
              className="text-sm text-zinc-400 hover:text-zinc-100"
            >
              Pricing
            </a>

            <div className="mt-2 flex flex-col gap-3 border-t border-zinc-800/70 pt-4">
              <a
                href="/login"
                className="text-sm font-medium text-zinc-400 hover:text-zinc-100"
              >
                Sign in
              </a>

              <a
                href="/signup"
                className="rounded-lg bg-violet-500 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-violet-400"
              >
                Get started
              </a>
            </div>

          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;