'use client';

export function AssistantTypingIndicator({ label }: { label: string }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-2xl rounded-tl-sm bg-[#EFEFEF] px-3.5 py-2.5"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className="text-[13px] text-[#6B6B6B]">{label}</span>
      <span className="assistant-typing-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </div>
  );
}
