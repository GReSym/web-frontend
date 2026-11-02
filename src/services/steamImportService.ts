// Importing a user's public Steam library is planned (CLAUDE.md) but the backend has no endpoint yet.
// The popup talks to this interface only; replace `steamImportService` with a real implementation once the API exists.

export interface SteamImportResult {
  imported: number
  skipped: number
}

export interface SteamImportService {
  /** false while the backend doesn't support it; the popup then explains that instead of submitting */
  readonly available: boolean
  importLibrary(profileUrl: string): Promise<SteamImportResult>
}

export const steamImportService: SteamImportService = {
  available: false,
  importLibrary: () => Promise.reject(new Error('Steam import is not available yet')),
}

/** Accepts steamcommunity.com/id/<name> and /profiles/<SteamID64> links. */
export function isSteamProfileUrl(value: string): boolean {
  return /^(https?:\/\/)?(www\.)?steamcommunity\.com\/(id\/[\w-]{2,}|profiles\/\d{17})\/?$/i.test(
    value.trim(),
  )
}
