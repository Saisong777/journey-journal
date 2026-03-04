import { get, set } from "idb-keyval";

const QUEUE_KEY = "offline_sync_queue";

export interface QueueItem {
  id: string;
  type: "journal" | "devotional" | "evening";
  endpoint: string;
  method: "POST" | "PATCH";
  data: Record<string, unknown>;
  createdAt: number;
}

export async function addToQueue(item: Omit<QueueItem, "id" | "createdAt">): Promise<void> {
  const queue = await getQueue();
  queue.push({
    ...item,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  });
  await set(QUEUE_KEY, queue);
}

export async function getQueue(): Promise<QueueItem[]> {
  const queue = await get<QueueItem[]>(QUEUE_KEY);
  return queue || [];
}

export async function removeFromQueue(id: string): Promise<void> {
  const queue = await getQueue();
  await set(QUEUE_KEY, queue.filter((item) => item.id !== id));
}

export async function getQueueCount(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}

export async function clearQueue(): Promise<void> {
  await set(QUEUE_KEY, []);
}
