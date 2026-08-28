export function formatScheduledTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const mm = minutes === 0 ? '00' : String(minutes).padStart(2, '0');
  return `${hours}:${mm} ${ampm} ET`;
}

export function getFinalStatusLabel(statusDetail) {
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
