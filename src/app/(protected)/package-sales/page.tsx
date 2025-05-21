"use client";

import { withPageAuth } from "@/lib/auth";
import PackageSalesClient from "./PackageSalesClient";

function PackageSalesPage() {
  return <PackageSalesClient />;
}

export default withPageAuth(PackageSalesPage);