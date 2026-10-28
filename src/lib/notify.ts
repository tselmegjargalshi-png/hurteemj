import "server-only";
import { db, type Tx } from "@/db";
import { notifications } from "@/db/schema";

/**
 * Сайт доторх бичгэн мэдэгдэл. Дуут мэдэгдэл ашигладаггүй тул сонсголгүй хэрэглэгч бүх мэдээллийг бичгээр авна.
 * SMS/имэйл илгээх үйлчилгээ одоогоор ХОЛБОГДООГҮЙ — зөвхөн сайт дээр харагдана.
 */
export async function notify(userId: string, title: string, body: string, link?: string, tx?: Tx) {
  await (tx ?? db).insert(notifications).values({ userId, title, body, link: link ?? null });
}
