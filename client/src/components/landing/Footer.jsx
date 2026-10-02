import flowpilotIcon from "../../assets/flowpilot-icon-512.png";

const Footer = () => {
  const productLinks = [
    { name: "Features", href: "#product" },
    { name: "Integrations", href: "#integrations" },
    { name: "Executions", href: "#executions" },
    { name: "Pricing", href: "#pricing" },
  ];

  const resourceLinks = [
    {
      name: "Documentation",
      href: "https://github.com/twisha-patel17/FlowPilot",
      external: true,
    },
    {
      name: "GitHub",
      href: "https://github.com/twisha-patel17/FlowPilot",
      external: true,
    },
  ];

  const companyLinks = [
    { name: "Get Started", href: "/register" },
    { name: "Sign In", href: "/login" },
    {
      name: "Contact",
      href: "mailto:flowpilot.dev@gmail.com",
      external: true,
    },
  ];

  return (
    <footer className="border-t border-zinc-900 bg-[#070708] px-5 sm:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Main Footer */}
        <div className="grid gap-12 py-16 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <a
              href="/"
              className="flex w-fit items-center gap-2 text-[15px] font-semibold tracking-tight text-zinc-100"
            >
              <img
                src={flowpilotIcon}
                alt="FlowPilot"
                className="h-7 w-7 rounded-md"
              />

              <span>FlowPilot</span>
            </a>

            <p className="mt-5 max-w-xs text-sm leading-6 text-zinc-600">
              Visual workflow automation for developers. Connect triggers,
              logic, and actions and let your workflows run automatically.
            </p>

            <p className="mt-6 font-mono text-[10px] uppercase tracking-wider text-zinc-700">
              Built for developers
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">
              Product
            </h3>

            <div className="mt-5 space-y-3">
              {productLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="block text-sm text-zinc-600 transition hover:text-zinc-300"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">
              Resources
            </h3>

            <div className="mt-5 space-y-3">
              {resourceLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-1.5 text-sm text-zinc-600 transition hover:text-zinc-300"
                >
                  {link.name}
                  {link.external && (
                    <span className="text-[10px] text-zinc-700">↗</span>
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">
              Get Started
            </h3>

            <div className="mt-5 space-y-3">
              {companyLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className="block text-sm text-zinc-600 transition hover:text-zinc-300"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col gap-4 border-t border-zinc-900 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[10px] text-zinc-700">
            © {new Date().getFullYear()} FlowPilot. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            <a
              href="https://github.com/twisha-patel17/FlowPilot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-700 transition hover:text-zinc-400"
            >
              GitHub ↗
            </a>

            <a
              href="/register"
              className="text-xs text-zinc-700 transition hover:text-zinc-400"
            >
              Start building →
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;