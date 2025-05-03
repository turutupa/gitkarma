import type { TAnalytics, TProcessData } from "@/db/models";

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
