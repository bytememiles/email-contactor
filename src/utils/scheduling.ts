import { ScheduledSendTime } from '@/types/job';
import { ProcessedReceiver } from '@/types/receiver';

/**
 * Calculate optimal send time (default 10 AM local time) for each recipient based on timezone
 */
export function calculateSendTimes(
  receivers: ProcessedReceiver[],
  baseDate: Date = new Date(),
  sendHour: number = 10,
  sendMinute: number = 0
): ScheduledSendTime[] {
  // Group receivers by timezone
  const timezoneGroups = new Map<string, string[]>();

  receivers.forEach((receiver) => {
    if (receiver.isValid && receiver.timezone) {
      const tz = receiver.timezone;
      if (!timezoneGroups.has(tz)) {
        timezoneGroups.set(tz, []);
      }
      timezoneGroups.get(tz)!.push(receiver.id);
    }
  });

  // Calculate 10 AM local time for each timezone
  const scheduledTimes: ScheduledSendTime[] = [];

  timezoneGroups.forEach((receiverIds, timezone) => {
    try {
      // Get current date/time in the target timezone
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const parts = formatter.formatToParts(now);
      const year = parseInt(parts.find((p) => p.type === 'year')?.value || '0');
      const month =
        parseInt(parts.find((p) => p.type === 'month')?.value || '0') - 1;
      const day = parseInt(parts.find((p) => p.type === 'day')?.value || '0');

      // Create date for specified time in the target timezone
      // We'll create it in UTC and then convert
      const sendTime = new Date(
        Date.UTC(year, month, day, sendHour, sendMinute, 0, 0)
      );

      // Adjust for timezone offset
      const tzOffset = getTimezoneOffset(timezone, sendTime);
      sendTime.setUTCHours(sendHour - tzOffset, sendMinute);

      // If the calculated time is in the past, schedule for tomorrow
      if (sendTime < now) {
        sendTime.setUTCDate(sendTime.getUTCDate() + 1);
      }

      scheduledTimes.push({
        timezone,
        sendTime,
        receiverIds,
      });
    } catch (error) {
      console.error(
        `Error calculating send time for timezone ${timezone}:`,
        error
      );
      // Fallback: schedule for specified time UTC tomorrow
      const fallbackTime = new Date(baseDate);
      fallbackTime.setUTCDate(fallbackTime.getUTCDate() + 1);
      fallbackTime.setUTCHours(sendHour, sendMinute, 0, 0);

      scheduledTimes.push({
        timezone,
        sendTime: fallbackTime,
        receiverIds,
      });
    }
  });

  // Sort by send time
  scheduledTimes.sort((a, b) => a.sendTime.getTime() - b.sendTime.getTime());

  return scheduledTimes;
}

/**
 * Get timezone offset in hours for a given timezone at a specific date
 */
function getTimezoneOffset(timezone: string, date: Date): number {
  try {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(
      date.toLocaleString('en-US', { timeZone: timezone })
    );
    return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
  } catch {
    return 0;
  }
}

/**
 * Get the earliest send time from scheduled times
 */
export function getEarliestSendTime(
  scheduledTimes: ScheduledSendTime[]
): Date | null {
  if (scheduledTimes.length === 0) return null;
  return scheduledTimes[0].sendTime;
}
