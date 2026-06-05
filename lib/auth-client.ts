const SPARK_PASSWORD = process.env.NEXT_PUBLIC_SPARK_PASSWORD || process.env.SPARK_PASSWORD || "spark-demo";

export async function login(password: string): Promise<boolean> {
  if (password === SPARK_PASSWORD) {
    return true;
  }
  return false;
}