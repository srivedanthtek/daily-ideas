const SPARK_PASSWORD = process.env.SPARK_PASSWORD;

export async function login(password: string): Promise<boolean> {
  if (!SPARK_PASSWORD) return false;
  return password === SPARK_PASSWORD;
}
