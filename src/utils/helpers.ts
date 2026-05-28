import { FestivalItem } from "../types";

/**
 * Extracts month numbers from a Korean style date string (e.g., "2025. 8. 1. ~ 8. 3.")
 * Returns an array of representing months (e.g., [8])
 */
export function getMonthsFromDateString(dateStr: string): number[] {
  if (!dateStr) return [];
  
  // Extract all contiguous digits
  const numbers = dateStr.match(/\d+/g)?.map(Number) || [];
  if (numbers.length < 2) return [];

  // If first number is a year (usually 4 digits), start month is the second number
  let startMonthIdx = 1;
  const isFirstNumYear = numbers[0] > 1000;
  
  if (!isFirstNumYear) {
    startMonthIdx = 0;
  }

  const startMonth = numbers[startMonthIdx];
  const months: number[] = [];
  
  if (startMonth >= 1 && startMonth <= 12) {
    months.push(startMonth);
  }

  // Check if there is an end month in the text, e.g. "2025. 10. 25. ~ 11. 3." -> numbers: [2025, 10, 25, 11, 3]
  // In this case, numbers[3] is the end month if it represents " ~ 11."
  // Let's see if there are at least 5 numbers (Year, StartMonth, StartDay, EndMonth, EndDay)
  if (isFirstNumYear && numbers.length >= 5) {
    const endMonth = numbers[3];
    if (endMonth >= 1 && endMonth <= 12 && endMonth !== startMonth) {
      months.push(endMonth);
      // Fill months if there range encompasses more months (e.g. 10 to 12)
      let current = startMonth + 1;
      while (current < endMonth) {
        months.push(current);
        current++;
      }
    }
  } else if (!isFirstNumYear && numbers.length >= 4) {
    const endMonth = numbers[2];
    if (endMonth >= 1 && endMonth <= 12 && endMonth !== startMonth) {
      months.push(endMonth);
    }
  }

  return months;
}

/**
 * Maps a month to a distinct season in Korea
 */
export function getSeasonFromMonth(month: number): "spring" | "summer" | "autumn" | "winter" | null {
  if (month >= 3 && month <= 5) return "spring";     // 3, 4, 5
  if (month >= 6 && month <= 8) return "summer";     // 6, 7, 8
  if (month >= 9 && month <= 11) return "autumn";    // 9, 10, 11
  if (month === 12 || month === 1 || month === 2) return "winter"; // 12, 1, 2
  return null;
}

/**
 * Checks if a festival occurs within a given season
 */
export function matchesSeason(dateStr: string, targetSeason: string): boolean {
  if (targetSeason === "all") return true;
  
  const months = getMonthsFromDateString(dateStr);
  if (months.length === 0) return false;

  return months.some((m) => getSeasonFromMonth(m) === targetSeason);
}

/**
 * Strips bracketed locales from festival titles.
 * e.g., "부산바다축제(한,영, 중간,중번,일)" -> "부산바다축제"
 */
export function cleanTitle(title: string): string {
  if (!title) return "";
  return title.replace(/\([^)]+\)/g, "").trim();
}
