export const formatTime12h = (timeStr) => {
  if (!timeStr) return '';
  if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

export const formatTime24h = (timeStr) => {
  if (!timeStr) return '';
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return timeStr;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const p = match[3] ? match[3].toUpperCase() : null;
  if (p === 'PM' && h < 12) h += 12;
  if (p === 'AM' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${m}`;
};

export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 99999;
  const clean = timeStr.trim().toUpperCase();
  if (!clean) return 99999;

  // 1. Check 12-hour format with AM/PM: "8:00 AM", "08:30 PM", "12:00 PM", "12:15 AM"
  const match12 = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const period = match12[3];

    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // 2. Check simple format without minutes: "8 AM", "10 PM"
  const matchSimple = clean.match(/^(\d{1,2})\s*(AM|PM)$/);
  if (matchSimple) {
    let hours = parseInt(matchSimple[1], 10);
    const period = matchSimple[2];

    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60;
  }

  // 3. Check 24-hour format: "08:00", "14:30", "22:00", "8:00"
  const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }

  return 99999;
};

export const sortTasksChronologically = (taskList) => {
  if (!Array.isArray(taskList)) return [];
  return [...taskList].sort((a, b) => {
    const timeA = parseTimeToMinutes(a?.startTime || a?.time);
    const timeB = parseTimeToMinutes(b?.startTime || b?.time);

    if (timeA !== timeB) {
      return timeA - timeB; // Ascending: AM (e.g. 8:00 AM) -> PM (e.g. 10:00 PM) -> Untimed
    }

    // Tie-breaker: preserve stable order by creation timestamp
    const createdA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const createdB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (createdA !== createdB) {
      return createdA - createdB;
    }

    return String(a?._id || '').localeCompare(String(b?._id || ''));
  });
};

export const getCurrentTimeMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

export const timeStringToMinutes = (timeStr) => {
  const mins = parseTimeToMinutes(timeStr);
  return mins === 99999 ? 0 : mins;
};

