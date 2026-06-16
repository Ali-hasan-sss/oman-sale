function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 24 24">
      <path
        d="M23.52 12.27c0-.85-.07-1.47-.22-2.11H12v3.83h6.52c-.13 1.03-.83 2.58-2.39 3.62l-.02.14 3.48 2.7.24.02c2.2-2.03 3.47-5.02 3.47-8.2z"
        fill="#4285F4"
      />
      <path
        d="M12 23c3.24 0 5.96-1.07 7.95-2.9l-3.79-2.94c-1.01.68-2.36 1.16-4.16 1.16-3.18 0-5.88-2.1-6.84-5.02l-.14.01-3.7 2.86-.05.13C3.87 20.79 7.6 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.16 14.3c-.25-.74-.39-1.53-.39-2.3s.14-1.56.38-2.3l-.01-.15-3.75-2.9-.12.06A11.86 11.86 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.88-3.1z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.74c2.25 0 3.77.97 4.64 1.78l3.39-3.31C17.93 1.19 15.24 0 12 0 7.6 0 3.87 2.21 1.28 5.4l3.88 3.1C6.12 5.84 8.82 4.74 12 4.74z"
        fill="#EA4335"
      />
    </svg>
  );
}

type GoogleSignInButtonProps = {
  disabled?: boolean;
  label: string;
  onClick: () => void;
};

export function GoogleSignInButton({ disabled, label, onClick }: GoogleSignInButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <GoogleIcon className="h-5 w-5 shrink-0" />
      <span>{label}</span>
    </button>
  );
}
