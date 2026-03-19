type CafeMode = "demo" | "interactive";

type CafeAccess = {
  mode: CafeMode;
  canInput: boolean;
  showLogin: boolean;
};

export function resolveCafeAccess(user: unknown): CafeAccess {
  if (user) {
    return { mode: "interactive", canInput: true, showLogin: false };
  }
  return { mode: "demo", canInput: false, showLogin: true };
}
