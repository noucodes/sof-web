// The "(123)" next to a list page's title. Takes the page's data promise so the
// title renders immediately and only the number waits, inside its own Suspense.
export default async function AsyncCount({ data }: { data: Promise<{ total: number }> }) {
  const { total } = await data;
  return <span className="text-sm font-normal text-muted">({total})</span>;
}
