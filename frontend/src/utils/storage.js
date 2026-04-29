const AUTH_KEY = 'lm_auth_v2';

// Stored shape:
// { accessToken: string, user: { id, email, full_name }, createdAt: ISOString }
export function getAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuth(auth) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

export function getAccessToken() {
  return getAuth()?.accessToken || null;
}

const PLAN_KEY = 'lm_plan_v1';

export function setSelectedPlan(plan) {
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
}

export function getSelectedPlan() {
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSelectedPlan() {
  localStorage.removeItem(PLAN_KEY);
}
