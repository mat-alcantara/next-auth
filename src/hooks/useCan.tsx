import { validateUserPermissions } from "../utils/validateUserPermissions";
import { useAuth } from "./useAuth";

type UseCamParams = {
  permissions?: string[];
  roles?: string[];
};
export function useCan({ permissions, roles }: UseCamParams) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return false;
  }

  const userHasValidPermisions = validateUserPermissions({
    user,
    permissions,
    roles,
  });

  return userHasValidPermisions;
}
