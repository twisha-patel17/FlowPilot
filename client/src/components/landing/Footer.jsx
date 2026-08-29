const Footer = () => {
  const productLinks = [
    { name: "Features", href: "#product" },
    { name: "Integrations", href: "#integrations" },
    { name: "Executions", href: "#executions" },
    { name: "Pricing", href: "#pricing" },
  ];

  const resourceLinks = [
    { name: "Documentation", href: "#docs" },
    { name: "API Reference", href: "#api" },
    { name: "GitHub", href: "https://github.com" },
  ];

  const companyLinks = [
    { name: "About", href: "#about" },
    { name: "Contact", href: "#contact" },
    { name: "Privacy", href: "#privacy" },
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
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500 text-xs font-bold text-white">
                ~
              </span>

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
                  className="block text-sm text-zinc-600 transition hover:text-zinc-300"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">
              Company
            </h3>

            <div className="mt-5 space-y-3">
              {companyLinks.map((link) => (
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

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col gap-4 border-t border-zinc-900 py-6 sm:flex-row sm:items-center sm:justify-between">

          <p className="font-mono text-[10px] text-zinc-700">
            © {new Date().getFullYear()} FlowPilot. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            <a
              href="#status"
              className="text-xs text-zinc-700 transition hover:text-zinc-400"
            >
              System Status
            </a>

            <a
              href="#github"
              className="text-xs text-zinc-700 transition hover:text-zinc-400"
            >
              GitHub
            </a>
          </div>

        </div>

      </div>
    </footer>
  );
};

export default Footer;