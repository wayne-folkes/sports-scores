// ESPN start times are UTC; show them in Eastern time (EDT/EST handled by Intl).
const EASTERN_TIME = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

export function formatScheduledTime(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  const parts = Object.fromEntries(EASTERN_TIME.formatToParts(date).map(({ type, value }) => [type, value]));
  return `${parts.hour}:${parts.minute} ${parts.dayPeriod} ET`;
}

export function getFinalStatusLabel(statusDetail: string | null | undefined): string {
  if (!statusDetail) return 'FINAL';

  const overtimeMatch = statusDetail.match(/(?:final\/)?(\d*ot)/i);
  if (overtimeMatch) {
    return `FINAL / ${overtimeMatch[1].toUpperCase()}`;
  }

  const extraInningsMatch = statusDetail.match(/(?:final\/|f\/)(\d{2}|\d{1})/i);
  if (extraInningsMatch) {
    return `FINAL / ${extraInningsMatch[1]} INN`;
  }

  return 'FINAL';
}
