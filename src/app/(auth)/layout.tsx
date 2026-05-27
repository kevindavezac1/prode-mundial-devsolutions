export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4" style={{ background: "#07090f" }}>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
