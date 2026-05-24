const SESSION_DISMISS_KEY = 'wuw_push_prompt_dismissed';

export function wasPushPromptDismissedThisSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function markPushPromptDismissedThisSession(): void {
  try {
    sessionStorage.setItem(SESSION_DISMISS_KEY, '1');
  } catch {
    /* ignore */
  }
}
