import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await context.params;
  const job = await prisma.generationJob.findFirst({
    where: { OR: [{ id }, { companyId: id }] },
    include: { steps: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ job });
}
