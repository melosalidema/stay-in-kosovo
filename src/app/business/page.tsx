import { BusinessDashboard } from "@/components/business/business-dashboard";
import { requirePageAccess } from "@/lib/auth/page-guard";

export default async function BusinessPage() {
  await requirePageAccess("/business", "BUSINESS_OWNER");

  return <BusinessDashboard />;
}
