import { requireSessionUser } from "@/lib/auth-session";
import { DashboardLayout } from "@/components/DashboardLayout";

export default async function RootDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await requireSessionUser();

  return (
    <DashboardLayout user={sessionUser}>
      {children}
    </DashboardLayout>
  );
}
