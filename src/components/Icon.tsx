export function Icon({
  name = "arrow",
  size = 20,
}: {
  name?: string;
  size?: number;
}) {
  const paths: Record<string, string> = {
    arrow: "M4 12h16m-6-6 6 6-6 6",
    check: "m5 12 4 4L19 6",
    shield: "M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6z M8 12l3 3 5-6",
    terminal: "m5 6 5 6-5 6m8 0h6",
    copy: "M9 9h11v11H9z M15 9V4H4v11h5",
    download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
    folder: "M3 6h7l2 3h9v11H3z",
    cloud: "M6 18a5 5 0 0 1 0-10 7 7 0 0 1 13 2 4 4 0 0 1-1 8z",
    lock: "M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4",
    clock: "M12 8v5l3 2M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0",
    globe:
      "M2 12h20M12 2a18 18 0 0 1 0 20 18 18 0 0 1 0-20M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0",
    github:
      "M9 19c-4 1-4-2-6-2m12 5v-4c0-1-.2-2-1-3 4 0 7-2 7-6a5 5 0 0 0-1-4 5 5 0 0 0 0-4s-2-1-4 1a14 14 0 0 0-8 0C5 0 3 1 3 1a5 5 0 0 0 0 4 5 5 0 0 0-1 4c0 4 3 6 7 6-1 1-1 2-1 3v4",
    plus: "M12 5v14M5 12h14",
  };
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name] || paths.arrow} />
    </svg>
  );
}
export function Mark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 40" className="brand-mark">
      <rect width="40" height="40" rx="10" fill="currentColor" />
      <path d="M10 12h6v6h8v-6h6v18H10z" fill="#daf6a6" />
      <path d="M17 23h6v7h-6z" fill="currentColor" />
    </svg>
  );
}
