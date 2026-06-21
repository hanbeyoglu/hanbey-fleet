import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authApi, driverPortalApi } from '../lib/api';
import { Role } from '@hanbey-fleet/shared';
import { DriverPortalProfileDto } from '../types/api';
import { ADMIN_PORTAL_URL } from '../lib/utils';

export interface FleetMembership {
  membershipId: string;
  fleetOwnerId: string;
  fleetOwnerName: string;
  role: string;
  status: string;
}

interface AuthContextValue {
  profile: DriverPortalProfileDto | null;
  fleetMemberships: FleetMembership[];
  fleetOwnerId?: string;
  fleetOwnerName?: string;
  isLoading: boolean;
  needsFleetSelection: boolean;
  login: (username: string, password: string) => Promise<Role>;
  selectFleet: (fleetOwnerId: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredFleet() {
  return {
    fleetOwnerId: localStorage.getItem('fleetOwnerId') ?? undefined,
    fleetOwnerName: localStorage.getItem('fleetOwnerName') ?? undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<DriverPortalProfileDto | null>(null);
  const [fleetMemberships, setFleetMemberships] = useState<FleetMembership[]>([]);
  const [fleetOwnerId, setFleetOwnerId] = useState<string | undefined>();
  const [fleetOwnerName, setFleetOwnerName] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const syncFleetFromStorage = useCallback(() => {
    const stored = readStoredFleet();
    setFleetOwnerId(stored.fleetOwnerId);
    setFleetOwnerName(stored.fleetOwnerName);
  }, []);

  const refreshProfile = async () => {
    const { data } = await driverPortalApi.me();
    setProfile(data);
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    syncFleetFromStorage();

    authApi
      .me()
      .then(({ data }) => {
        setFleetMemberships(data.fleetMemberships ?? []);
        if (data.fleetOwnerId) {
          setFleetOwnerId(data.fleetOwnerId);
          setFleetOwnerName(data.fleetOwnerName);
          localStorage.setItem('fleetOwnerId', data.fleetOwnerId);
          if (data.fleetOwnerName) localStorage.setItem('fleetOwnerName', data.fleetOwnerName);
        }
        return driverPortalApi.me();
      })
      .then((res) => {
        if (res) setProfile(res.data);
      })
      .catch(() => localStorage.clear())
      .finally(() => setIsLoading(false));
  }, [syncFleetFromStorage]);

  const selectFleet = async (id: string) => {
    const { data } = await authApi.selectFleet(id);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('fleetOwnerId', data.fleetOwnerId);
    localStorage.setItem('fleetOwnerName', data.fleetOwnerName);
    setFleetOwnerId(data.fleetOwnerId);
    setFleetOwnerName(data.fleetOwnerName);
    await refreshProfile();
  };

  const login = async (username: string, password: string) => {
    const { data } = await authApi.login(username, password);
    const role = data.user.role as Role;

    if (role !== Role.DRIVER) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = ADMIN_PORTAL_URL;
      return role;
    }

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setFleetMemberships(data.fleetMemberships ?? []);
    localStorage.setItem('fleetMembershipCount', String(data.fleetMemberships?.length ?? 0));

    if (data.fleetMemberships?.length === 1) {
      await selectFleet(data.fleetMemberships[0].fleetOwnerId);
    }

    await refreshProfile();
    return role;
  };

  const logout = () => {
    localStorage.clear();
    setProfile(null);
    setFleetMemberships([]);
    setFleetOwnerId(undefined);
    setFleetOwnerName(undefined);
  };

  const needsFleetSelection = !fleetOwnerId && fleetMemberships.length > 0;

  return (
    <AuthContext.Provider
      value={{
        profile,
        fleetMemberships,
        fleetOwnerId,
        fleetOwnerName,
        isLoading,
        needsFleetSelection,
        login,
        selectFleet,
        logout,
        refreshProfile,
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
