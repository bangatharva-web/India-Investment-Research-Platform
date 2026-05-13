const TTL = 30 * 60 * 1000;

export function getCachedReport(key: string) {
  const raw = localStorage.getItem(`report:${key}`);
  if (!raw) return null;

  const parsed = JSON.parse(raw);

  if (Date.now() - parsed.createdAt > TTL) {
    localStorage.removeItem(`report:${key}`);
    return null;
  }

  return parsed.data;
}

export function setCachedReport(key: string, data: any) {
  localStorage.setItem(
    `report:${key}`,
    JSON.stringify({
      createdAt: Date.now(),
      data,
    })
  );
}