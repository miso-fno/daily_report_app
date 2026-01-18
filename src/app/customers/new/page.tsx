import { auth } from "@/auth";

import NewCustomerPageClient from "./NewCustomerPageClient";

export const dynamic = "force-dynamic";

export default async function CustomerCreatePage() {
  const session = await auth();
  return <NewCustomerPageClient session={session} />;
}
