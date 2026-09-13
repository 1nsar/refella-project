import { PhoneMock } from "./phone-mock";
import { AppTile } from "./app-tile";
import { brandedApps } from "./brand-icons";
import type { Dictionary } from "@/i18n";
import { whatsappLink } from "@/lib/site";

/**
 * Messaging platforms drifting around the phone. Positions keep clear of the
 * centre column so the headline and the device stay legible.
 */
const constellation = [
  { app: 0, top: "16%", left: "7%", size: 84, rotate: -9, float: "float-a" },
  { app: 2, top: "7%", left: "80%", size: 78, rotate: 8, float: "float-c" },
  { app: 1, top: "37%", left: "17%", size: 72, rotate: 6, float: "float-b" },
  { app: 3, top: "30%", left: "91%", size: 74, rotate: -7, float: "float-a" },
  { app: 2, top: "52%", left: "81%", size: 64, rotate: 9, float: "float-b" },
  { app: 0, top: "63%", left: "8%", size: 66, rotate: -6, float: "float-c" },
  { app: 3, top: "79%", left: "76%", size: 60, rotate: 7, float: "float-a" },
  { app: 1, top: "81%", left: "21%", size: 62, rotate: -8, float: "float-b" },
];

export function Hero({ t }: { t: Dictionary }) {
  return (
    <section className="sky relative overflow-hidden pb-24 pt-28 sm:pb-32 sm:pt-32">
      {/* Floating platform tiles */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
        {constellation.map(({ app, top, left, size, rotate, float }, index) => (
          <span
            key={index}
            className={`absolute ${float}`}
            style={{ top, left, transform: "translate(-50%, -50%)" }}
          >
            <AppTile
              app={brandedApps[app]}
              size={size}
              style={{ transform: `rotate(${rotate}deg)` }}
            />
          </span>
        ))}

        {/* Loose chat bubbles drifting beside the phone */}
        <div className="absolute left-[13%] top-[57%] flex w-[225px] flex-col gap-2">
          {t.hero.floaters.map((message, index) => (
            <span
              key={index}
              className={`bubble ${message.from === "business" ? "bubble-in self-start" : "bubble-out self-end"} ${
                index === 1 ? "float-b" : "float-a"
              }`}
            >
              {message.text}
            </span>
          ))}
        </div>
      </div>

      {/* Copy */}
      <div className="shell relative text-center">
        <h1 className="t-hero mx-auto max-w-[16ch] text-balance text-white">
          <span className="text-white/65">{t.hero.title}</span>{" "}
          {t.hero.titleAccent}
        </h1>

        <p className="mx-auto mt-6 max-w-[54ch] text-pretty text-[17px] leading-relaxed text-white/85 sm:text-[19px]">
          {t.hero.subtitle}
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <a
            href={whatsappLink(t.hero.whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-emboss btn-lg"
          >
            {t.hero.primaryCta}
          </a>
          <a href="#capabilities" className="text-[14px] text-white/70 hover:text-white">
            {t.hero.secondaryCta}
          </a>
        </div>

        {/* Platform row for narrow screens, where the constellation is hidden */}
        <ul className="mt-9 flex flex-wrap items-center justify-center gap-2.5 lg:hidden">
          {brandedApps.map((app) => (
            <li key={app.name}>
              <AppTile app={app} size={46} />
            </li>
          ))}
        </ul>
      </div>

      {/* Phone */}
      <div className="relative mt-14 flex justify-center px-5">
        <PhoneMock t={t} />
      </div>
    </section>
  );
}
