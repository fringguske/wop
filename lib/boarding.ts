export const BOARDING_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

export type BoardingDay = (typeof BOARDING_DAYS)[number];

export function cleanBoardingSchedule(value: unknown): BoardingDay[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return BOARDING_DAYS.filter((day) => value.includes(day));
}
