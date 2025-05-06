import type {
  TAnalytics,
  TProcessData,
  TWeeklyComments,
  TWeeklyDebits,
  TWeeklyPullRequests,
  TWeeklyReviews,
} from "@/db/models";

export const transformCumulative = (data: TProcessData): TAnalytics => {
  const dateMap: Map<string, Record<string, number>> = new Map();
  const userTotals = {};
  const users: Set<string> = new Set();

  data.forEach((item) => {
    const dateObj: Date = new Date(item.created_at);
    const date: string = dateObj.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
    });
    if (!dateMap.has(date)) {
      dateMap.set(date, {});
    }
    const dayEntry = dateMap.get(date) || {};
    if (!dayEntry[item.github_username]) {
      dayEntry[item.github_username] = 0;
    }
    dayEntry[item.github_username]++;

    // Update overall total for cumulative step
    if (!userTotals[item.github_username]) {
      userTotals[item.github_username] = 0;
    }
    userTotals[item.github_username]++;

    // Track users for dynamic series
    users.add(item.github_username);
  });

  // Sort dates chronologically
  const sortedDates = Array.from(dateMap.keys()).sort(
    // @ts-ignore
    (a, b) => new Date(a) - new Date(b)
  );

  // Build cumulative result
  const result: { date: string }[] = [];
  const cumulativeCounts = {};

  sortedDates.forEach((date) => {
    const dayEntry = dateMap.get(date);
    const entry = { date };

    Object.keys(dayEntry!).forEach((user) => {
      if (!cumulativeCounts[user]) {
        cumulativeCounts[user] = 0;
      }
      cumulativeCounts[user] += dayEntry![user];
    });

    // Fill entry with current cumulative counts
    Object.keys(cumulativeCounts).forEach((user) => {
      entry[user] = cumulativeCounts[user];
    });

    result.push(entry);
  });

  // Generate dynamic series with random colors
  const series: { name: string }[] = Array.from(users).map((user) => ({
    name: user,
  }));

  return { data: result, series };
};

export const transformBalanceHistory = (data: TProcessData): TAnalytics => {
  const dateMap: Map<string, Record<string, number>> = new Map();
  const users: Set<string> = new Set();

  data.forEach((item) => {
    const dateObj: Date = new Date(item.created_at);
    const date: string = dateObj.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
    });

    if (!dateMap.has(date)) {
      dateMap.set(date, {});
    }
    const dayEntry = dateMap.get(date)!;

    if (!dayEntry[item.github_username]) {
      dayEntry[item.github_username] = 0;
    }

    // Add or subtract depending on action
    const amount = Number(item.debits);
    if (item.action === "received") {
      dayEntry[item.github_username] += amount;
    }

    // Track users for dynamic series
    users.add(item.github_username);
  });

  // Sort dates chronologically
  const sortedDates = Array.from(dateMap.keys()).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  // Build cumulative result
  const result: { date: string; [key: string]: number | string }[] = [];
  const cumulativeBalances: Record<string, number> = {};

  sortedDates.forEach((date) => {
    const dayEntry = dateMap.get(date)!;
    const entry: TAnalytics["data"][0] = { date };

    Object.keys(dayEntry).forEach((user) => {
      if (!cumulativeBalances[user]) {
        cumulativeBalances[user] = 0;
      }
      cumulativeBalances[user] += dayEntry[user];
    });

    // Fill entry with current cumulative balances
    Object.keys(cumulativeBalances).forEach((user) => {
      entry[user] = cumulativeBalances[user];
    });

    result.push(entry);
  });

  // Generate dynamic series
  const series: { name: string }[] = Array.from(users).map((user) => ({
    name: user,
  }));

  return { data: result, series };
};

type TWeeklyData = {
  week: string;
  prs: number;
  reviews: number;
  comments: number;
  karmaPoints: number;
};

export function getSeriesFromWeeklyData(
  combinedData: Array<Record<string, any>>
) {
  if (!combinedData.length) return [];
  // Get all keys except 'week' from the first item
  const { week, ...rest } = combinedData[0];
  return Object.keys(rest).map((key) => ({
    name: key,
    label: camelCaseToLabel(key),
  }));
}

export function combineWeeklyData(
  weeklyPullRequests: TWeeklyPullRequests[],
  weeklyReviews: TWeeklyReviews[],
  weeklyComments: TWeeklyComments[],
  weeklyDebits: TWeeklyDebits[]
): TWeeklyData[] {
  const combinedMap = new Map<string, TWeeklyData>();

  function upsert(key: string, updater: (entry: TWeeklyData) => void) {
    if (!combinedMap.has(key)) {
      combinedMap.set(key, {
        week: key.replace("-", "/"),
        prs: 0,
        reviews: 0,
        comments: 0,
        karmaPoints: 0,
      });
    }
    updater(combinedMap.get(key)!);
  }

  weeklyPullRequests.forEach(({ year, week_number, pr_count }) => {
    const key = `${year}-${week_number}`;
    upsert(key, (entry) => {
      entry.prs = pr_count;
    });
  });

  weeklyReviews.forEach(({ year, week_number, review_count }) => {
    const key = `${year}-${week_number}`;
    upsert(key, (entry) => {
      entry.reviews = review_count;
    });
  });

  weeklyComments.forEach(({ year, week_number, comment_count }) => {
    const key = `${year}-${week_number}`;
    upsert(key, (entry) => {
      entry.comments = comment_count;
    });
  });

  weeklyDebits.forEach(({ year, week_number, debit_count }) => {
    const key = `${year}-${week_number}`;
    upsert(key, (entry) => {
      entry.karmaPoints = debit_count;
    });
  });

  return Array.from(combinedMap.entries())
    .map(([key, value]) => {
      const [year, week_number] = key.split("-").map(Number);
      return { ...value, year, week_number };
    })
    .sort((a, b) =>
      a.year === b.year ? a.week_number - b.week_number : a.year - b.year
    )
    .map(({ year, week_number, ...rest }) => ({
      ...rest,
      week: `${week_number}/${year}`,
    }));
}

/**
 * Converts a camelCase string to a human-readable label with spaces.
 * Example: "karmaPoints" → "karma points"
 *
 * @param str - The camelCase string to convert.
 * @returns A string with spaces between words and the first letter capitalized.
 */
export function camelCaseToLabel(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
}
