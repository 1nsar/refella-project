export function Logo({ tone = "dark" }: { tone?: "light" | "dark" }) {
  const ink = tone === "light" ? "#fff" : "var(--color-ink)";

  return (
    <span className="inline-flex shrink-0 items-center gap-2">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="10" fill={ink} />
        <path
          d="M9 22.5V12.5A2.5 2.5 0 0 1 11.5 10h9a2.5 2.5 0 0 1 2.5 2.5V17a2.5 2.5 0 0 1-2.5 2.5H13L9 22.5Z"
          fill="none"
          stroke={tone === "light" ? "#6aaee2" : "#fff"}
          strokeWidth="2.3"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="text-[19px] font-bold tracking-[-0.04em]"
        style={{ color: ink }}
      >
        Refella
      </span>
    </span>
  );
}
