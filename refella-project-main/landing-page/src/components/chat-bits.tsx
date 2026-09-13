"use client";

/** Shared chat furniture used by the phone and by the feature cards. */

export function Bubble({
  incoming,
  children,
}: {
  incoming: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex animate-pop ${incoming ? "justify-start" : "justify-end"}`}>
      <p className={`bubble ${incoming ? "bubble-in" : "bubble-out"}`}>{children}</p>
    </div>
  );
}

export function TypingBubble() {
  return (
    <div className="flex animate-pop justify-start">
      <span className="bubble bubble-in flex items-center gap-1 px-3.5 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block h-1.5 w-1.5 rounded-full bg-black/30"
            style={{ animation: `typing 1.3s ${i * 0.16}s infinite ease-in-out` }}
          />
        ))}
      </span>
    </div>
  );
}

/** Time break between acts — the thing that makes a thread read as a lifecycle. */
export function Divider({ text }: { text: string }) {
  return (
    <div className="flex animate-pop justify-center py-1">
      <span className="rounded-full bg-black/[0.06] px-2.5 py-1 text-[10.5px] font-medium faint">
        {text}
      </span>
    </div>
  );
}

export function LinkCard({ title, caption }: { title: string; caption: string }) {
  return (
    <div className="flex animate-pop justify-start">
      <div
        className="w-[78%] overflow-hidden rounded-[16px]"
        style={{ background: "#f2f2f1", boxShadow: "var(--bubble-shadow)" }}
      >
        <div
          className="h-20 w-full"
          style={{
            background: "linear-gradient(135deg, #cfe6fb 0%, #eaf4fd 45%, #dff0e6 100%)",
          }}
        />
        <div className="px-3 py-2">
          <p className="text-[12px] font-semibold leading-tight">{title}</p>
          <p className="text-[11px] faint leading-tight">{caption}</p>
        </div>
      </div>
    </div>
  );
}

export function NoteChip({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex animate-pop items-center gap-2 rounded-lg px-3 py-2 text-[12px]"
      style={{ background: "rgb(0 136 255 / 0.09)", color: "#0069c7" }}
    >
      {children}
    </div>
  );
}
