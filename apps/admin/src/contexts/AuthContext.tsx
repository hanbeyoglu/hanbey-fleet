import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authApi } from '../lib/api';
import { JwtPayload, Role } from '@hanbey-fleet/shared';

export interface FleetMembership {
  membershipId: string;
  fleetOwnerId: string;
  fleetOwnerName: string;
  role: string;
  status: string;
}

interface AuthUser extends JwtPayload {
  name: string;
  fleetOwnerName?: string;
  fleetMemberships?: FleetMembership[];
}

interface AuthContextValue {
  user: AuthUser | null;
  fleetMemberships: FleetMembership[];
  isLoading: boolean;
  needsFleetSelection: boolean;
  login: (username: string, password: string) => Promise<{ user: AuthUser; memberships: FleetMembership[] }>;
  selectFleet: (fleetOwnerId: string) => Promise<void>;
  enterGlobalMode: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ADMIN_ROLES: Role[] = [Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER, Role.ACCOUNTANT];

function readStoredFleet(): { fleetOwnerId?: string; fleetOwnerName?: string } {
  const fleetOwnerId = localStorage.getItem('fleetOwnerId') ?? undefined;
  const fleetOwnerName = localStorage.getItem('fleetOwnerName') ?? undefined;
  return { fleetOwnerId, fleetOwnerName };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [fleetMemberships, setFleetMemberships] = useState<FleetMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const applyFleetToUser = useCallback((base: AuthUser): AuthUser => {
    const stored = readStoredFleet();
    return {
      ...base,
      fleetOwnerId: stored.fleetOwnerId ?? base.fleetOwnerId,
      fleetOwnerName: stored.fleetOwnerName ?? base.fleetOwnerName,
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    authApi
      .me()
      .then(({ data }) => {
        if (!ADMIN_ROLES.includes(data.role as Role)) {
          localStorage.clear();
          setUser(null);
          return;
        }
        setFleetMemberships(data.fleetMemberships ?? []);
        setUser(applyFleetToUser(data));
      })
      .catch(() => localStorage.clear())
      .finally(() => setIsLoading(false));
  }, [applyFleetToUser]);

  const selectFleet = async (fleetOwnerId: string) => {
    const { data } = await authApi.selectFleet(fleetOwnerId);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('fleetOwnerId', data.fleetOwnerId);
    localStorage.setItem('fleetOwnerName', data.fleetOwnerName);

    setUser((prev) =>
      prev
        ? {
            ...prev,
            fleetOwnerId: data.fleetOwnerId,
            fleetOwnerName: data.fleetOwnerName,
          }
        : null,
    );
  };

  const enterGlobalMode = async () => {
    const { data } = await authApi.clearFleet();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.removeItem('fleetOwnerId');
    localStorage.removeItem('fleetOwnerName');
    setUser((prev) => (prev ? { ...prev, fleetOwnerId: undefined, fleetOwnerName: undefined } : null));
  };

  const login = async (username: string, password: string) => {
    const { data } = await authApi.login(username, password);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    const memberships: FleetMembership[] = data.fleetMemberships ?? [];
    setFleetMemberships(memberships);

    const authUser: AuthUser = { ...data.user, fleetMemberships: memberships };
    setUser(authUser);

    return { user: authUser, memberships };
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setFleetMemberships([]);
  };

  const needsFleetSelection =
    !!user &&
    user.role !== Role.SUPER_ADMIN &&
    !user.fleetOwnerId &&
    fleetMemberships.length > 0;

  return (
    <AuthContext.Provider
      value={{
        user,
        fleetMemberships,
        isLoading,
        needsFleetSelection,
        login,
        selectFleet,
        enterGlobalMode,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
