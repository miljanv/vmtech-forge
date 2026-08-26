"use client";

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { SALES_STATUS_LABELS, SALES_STATUSES, type SalesStatus } from "@/lib/sales/status";
import { updateStatusAction } from "@/server/actions";

type Card = {
  id: string;
  name: string | null;
  slug: string;
  salesStatus: SalesStatus;
  dealValueMinor: number;
  contactName: string | null;
  contactEmail: string | null;
};

export function PipelineBoard({ companies }: { companies: Card[] }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function onDragEnd(event: DragEndEvent) {
    const to = event.over?.id;
    const id = event.active.id;
    if (!to || typeof to !== "string" || typeof id !== "string") return;
    if (!SALES_STATUSES.includes(to as SalesStatus)) return;
    await updateStatusAction(id, to as SalesStatus);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {SALES_STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            companies={companies.filter((company) => company.salesStatus === status)}
          />
        ))}
      </div>
    </DndContext>
  );
}

function Column({ status, companies }: { status: SalesStatus; companies: Card[] }) {
  const { setNodeRef } = useDroppable({ id: status });
  return (
    <section ref={setNodeRef} className="w-72 shrink-0 rounded-2xl bg-muted/40 p-3">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium">{SALES_STATUS_LABELS[status]}</h2>
        <span className="text-xs text-muted-foreground">{companies.length}</span>
      </header>
      <div className="space-y-2">
        {companies.map((company) => (
          <CardItem key={company.id} company={company} />
        ))}
      </div>
    </section>
  );
}

function CardItem({ company }: { company: Card }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: company.id });
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className="rounded-xl border bg-card p-3 shadow-sm"
      {...listeners}
      {...attributes}
    >
      <Link href={`/admin/companies/${company.id}`} className="font-medium hover:underline">
        {company.name ?? company.slug}
      </Link>
      <p className="text-xs text-muted-foreground">{company.contactName ?? company.contactEmail ?? "—"}</p>
    </article>
  );
}
