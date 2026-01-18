import { auth } from "@/auth";

import CustomerEditPageClient from "./CustomerEditPageClient";

export const dynamic = "force-dynamic";

export default async function CustomerEditPage() {
  const session = await auth();
  return <CustomerEditPageClient session={session} />;
}
