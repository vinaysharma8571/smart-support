export async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    // 401 means "not logged in" (for example the session expired).
    // Send the person to the login page instead of showing an empty screen.
    if (
      response.status === 401 &&
      typeof window !== "undefined" &&
      window.location.pathname !== "/login"
    ) {
      window.location.href = "/login";
    }

    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "Something went wrong");
  }

  return response.json();
}