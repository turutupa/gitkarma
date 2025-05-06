/**
 * Converts a camelCase string to a human-readable label with spaces.
 * Example: "karmaPoints" → "karma points"
 *
 * @param str - The camelCase string to convert.
 * @returns A string with spaces between words and the first letter capitalized.
 */
export function camelCaseToLabel(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
}
