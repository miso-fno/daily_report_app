import { auth } from "@/auth";

import CustomersPageClient from "./CustomersPageClient";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const session = await auth();
  return <CustomersPageClient session={session} />;
}
