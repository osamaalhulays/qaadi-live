export interface Q21Maps {
  /** Map from unit symbols to their dimensional categories */
  unitsToDimensional: Record<string, string>;
  /** Map from figure keywords to diagram styles */
  figuresToDiagrams: Record<string, string>;
}

export const unitsToDimensional: Record<string, string> = {
  m: "length",
  s: "time",
  kg: "mass",
  A: "electric current",
  K: "temperature",
  mol: "amount of substance",
  cd: "luminous intensity",
};

export const figuresToDiagrams: Record<string, string> = {
  bar: "bar diagram",
  line: "line diagram",
  pie: "pie diagram",
};

/**
 * Central access point for Q21 standard mappings.
 */
export const Q21: Q21Maps = {
  unitsToDimensional,
  figuresToDiagrams,
};

/**
 * Helper to merge Q21 fields into a report-like object.
 *
 * Example:
 * ```ts
 * const merged = mergeQ21Fields({ units: "m", figure: "bar" });
 * // => { units: "m", figure: "bar", dimensional: "length", diagram: "bar diagram" }
 * ```
 */
export function mergeQ21Fields<T extends { units?: string; figure?: string }>(input: T) {
  return {
    ...input,
    dimensional: input.units ? unitsToDimensional[input.units] : undefined,
    diagram: input.figure ? figuresToDiagrams[input.figure] : undefined,
  };
}
