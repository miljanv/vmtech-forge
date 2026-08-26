import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { listCompanies } from "@/server/services/company";

export async function GET(request: Request) {
  await requireAdmin();
  const query = new URL(request.url).searchParams.get("q") ?? "";
  const companies = await listCompanies({ query });
  return NextResponse.json({
    companies: companies.slice(0, 12).map((company) => ({
      id: company.id,
      name: company.name,
      slug: company.slug,
    })),
  });
}
