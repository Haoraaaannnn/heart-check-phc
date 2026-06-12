interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const s = status.toLowerCase().trim();

  if (['on progress', 'serving', 'consulting'].includes(s)) {
    return (
      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1 w-max">
        <span className="w-2 h-2 bg-green-500 rounded-full"></span> Serving
      </span>
    );
  }
  if (['pending', 'waiting', 'assigned'].includes(s)) {
    return (
      <span className="px-3 py-1 bg-orange-100 text-orange-600 text-xs font-bold rounded-full flex items-center gap-1 w-max">
        <span className="w-2 h-2 bg-orange-500 rounded-full"></span> {status}
      </span>
    );
  }
  if (['completed', 'done', 'served'].includes(s)) {
    return (
      <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full flex items-center gap-1 w-max">
        ✓ Done
      </span>
    );
  }
  return (
    <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full">
      {status}
    </span>
  );
}