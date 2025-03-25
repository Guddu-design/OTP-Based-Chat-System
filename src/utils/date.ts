export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours <= 0 && minutes <= 0) return 'expired';
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}