const DEV_USERS = {
  "david.branton@example.mil": { id: "user-david", displayName: "David Branton", email: "david.branton@example.mil", role: "admin" },
  "reviewer@example.mil": { id: "user-reviewer", displayName: "Functional Reviewer", email: "reviewer@example.mil", role: "reviewer" },
  "owner@example.mil": { id: "user-owner", displayName: "Product Owner", email: "owner@example.mil", role: "reviewer" },
};

export function actorFromRequestHeaders(headers) {
  const email = header(headers, "x-forwarded-email") || header(headers, "x-databricks-user-email");
  const name = header(headers, "x-forwarded-preferred-username") || header(headers, "x-forwarded-user");
  if (!email) throw Object.assign(new Error("Authenticated Databricks user required"), { status: 401 });
  return DEV_USERS[email.toLowerCase()] || { id: `user-${email.toLowerCase()}`, displayName: name || email, email, role: "reviewer" };
}

function header(headers, name) {
  const value = headers[name];
  return typeof value === "string" ? value.trim() : "";
}
