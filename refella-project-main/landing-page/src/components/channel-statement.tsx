import { brandedApps } from "./brand-icons";
import { BrandLogo } from "./app-tile";
import type { Dictionary } from "@/i18n";

/** Big statement with the channel marks set inline in the sentence. */
export function ChannelStatement({ t }: { t: Dictionary }) {
  return (
    <section className="section">
      <div className="shell">
        <h2 className="t-h2 mx-auto max-w-[22ch] text-balance text-center">
          <span className="faint">{t.channels.lead}</span>{" "}
          <span className="mx-1 inline-flex translate-y-[0.18em] -space-x-3 align-baseline">
            {brandedApps.map((app) => (
              <span
                key={app.name}
                className="inline-grid h-[1.05em] w-[1.05em] place-items-center"
                style={{ filter: "drop-shadow(0 4px 8px rgba(16,38,64,0.18))" }}
              >
                <BrandLogo app={app} size={48} className="!h-full !w-full" />
              </span>
            ))}
          </span>{" "}
          {t.channels.tail}
        </h2>
      </div>
    </section>
  );
}
