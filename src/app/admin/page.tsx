import { AdminConsole } from "@/components/admin/admin-console";
import { requirePageAccess } from "@/lib/auth/page-guard";

export default async function AdminPage() {
  await requirePageAccess("/admin", "ADMIN");

  return <AdminConsole />;
}
