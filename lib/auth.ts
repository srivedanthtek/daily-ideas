import { cookies } from "next/headers";

export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = cookies();
    const authCookie = cookieStore.get("spark_auth");
    return authCookie?.value === "authenticated";
  } catch {
    return false;
  }
}

export async function logout(): Promise<void> {
  try {
    const cookieStore = cookies();
    cookieStore.set("spark_auth", "", { maxAge: 0, path: "/" });
  } catch {
    // ignore
  }
}
