export const INTERNAL_API_URL = import.meta.env.DEV
  ? "http://localhost:8080"
  : "http://localhost:8080";

export async function makeInternalRequest(endpoint, method, body) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  };

  if (body) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(`${INTERNAL_API_URL}/${endpoint}`, options);
  const data = await response.json();
  return { data, status: response.status };
}
