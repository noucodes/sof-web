'use client';
import { createContext, useContext } from 'react';
import type { Role } from '@/lib/session';

const RoleContext = createContext<Role>('viewer');

export function RoleProvider({ role, children }: { role: Role; children: React.ReactNode }) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>;
}

export const useRole = () => useContext(RoleContext);
// Viewers are read-only: action buttons hide themselves with this.
export const useCanAct = () => useContext(RoleContext) !== 'viewer';
