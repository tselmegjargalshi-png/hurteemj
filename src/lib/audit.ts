import "server-only";
import { db, type Tx } from "@/db";
import { auditLogs } from "@/db/schema";

export async function audit(
  entry: { actorId: string | null; action: string; entityType: string; entityId?: string | null; details?: Record<string, unknown> },
  tx?: Tx,
) {
  await (tx ?? db).insert(auditLogs).values({
    actorId: entry.actorId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    details: entry.details ?? null,
  });
}
