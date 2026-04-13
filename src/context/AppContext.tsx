'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Workspace, Member, Category, BlueRate } from '@/types';
import { getBlueRate } from '@/lib/blueRate';
import { hashPin } from '@/lib/pin';
import { DEFAULT_CATEGORIES } from '@/lib/defaultCategories';

const WS_KEY = 'gastly_workspace_id';
const MEM_KEY = 'gastly_member_id';

interface AppState {
  workspace: Workspace | null;
  currentMember: Member | null;
  members: Member[];
  categories: Category[];
  blueRate: BlueRate | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AppCtx extends AppState {
  hasWorkspace: boolean;
  unlockWithPin: (pin: string) => Promise<boolean>;
  lockApp: () => void;
  setupWorkspace: (name: string, pin: string, displayName: string, currency: 'ARS' | 'USD') => Promise<void>;
  reloadCategories: () => Promise<void>;
  reloadMembers: () => Promise<void>;
  refreshBlueRate: () => Promise<void>;
}

const AppContext = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    workspace: null, currentMember: null, members: [], categories: [],
    blueRate: null, isAuthenticated: false, isLoading: true,
  });

  useEffect(() => { initialize(); }, []);

  async function initialize() {
    const workspaceId = localStorage.getItem(WS_KEY);
    const memberId = localStorage.getItem(MEM_KEY);
    if (!workspaceId || !memberId) { setState(s => ({ ...s, isLoading: false })); return; }
    try {
      const [{ data: ws }, { data: member }, { data: cats }, { data: mems }, blue] = await Promise.all([
        supabase.from('workspaces').select('*').eq('id', workspaceId).single(),
        supabase.from('members').select('*').eq('id', memberId).single(),
        supabase.from('categories').select('*').eq('workspace_id', workspaceId).order('sort_order'),
        supabase.from('members').select('*').eq('workspace_id', workspaceId),
        getBlueRate(),
      ]);
      setState({ workspace: ws, currentMember: member, members: mems ?? [], categories: cats ?? [], blueRate: blue, isAuthenticated: false, isLoading: false });
    } catch { setState(s => ({ ...s, isLoading: false })); }
  }

  async function unlockWithPin(pin: string): Promise<boolean> {
    if (!state.workspace) return false;
    if (hashPin(pin) !== state.workspace.pin_hash) return false;
    setState(s => ({ ...s, isAuthenticated: true }));
    return true;
  }

  function lockApp() { setState(s => ({ ...s, isAuthenticated: false })); }

  async function setupWorkspace(name: string, pin: string, displayName: string, currency: 'ARS' | 'USD') {
    const pin_hash = hashPin(pin);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `gastly_${Date.now()}@gastly.app`,
      password: `${pin}_gastly_${Date.now()}`,
    });
    if (authError || !authData.user) throw new Error(authError?.message ?? 'Auth error');

    const { data: ws, error: wsErr } = await supabase.from('workspaces').insert({ name, pin_hash, default_currency: currency }).select().single();
    if (wsErr || !ws) throw new Error(wsErr?.message);

    const { data: member, error: memErr } = await supabase.from('members').insert({ workspace_id: ws.id, user_id: authData.user.id, display_name: displayName.toUpperCase().slice(0, 4), role: 'owner' }).select().single();
    if (memErr || !member) throw new Error(memErr?.message);

    const { data: cats } = await supabase.from('categories').insert(DEFAULT_CATEGORIES.map(c => ({ ...c, workspace_id: ws.id, is_default: true }))).select();

    localStorage.setItem(WS_KEY, ws.id);
    localStorage.setItem(MEM_KEY, member.id);
    const blue = await getBlueRate();
    setState({ workspace: ws, currentMember: member, members: [member], categories: cats ?? [], blueRate: blue, isAuthenticated: true, isLoading: false });
  }

  async function reloadCategories() {
    if (!state.workspace) return;
    const { data } = await supabase.from('categories').select('*').eq('workspace_id', state.workspace.id).order('sort_order');
    setState(s => ({ ...s, categories: data ?? [] }));
  }

  async function reloadMembers() {
    if (!state.workspace) return;
    const { data } = await supabase.from('members').select('*').eq('workspace_id', state.workspace.id);
    setState(s => ({ ...s, members: data ?? [] }));
  }

  async function refreshBlueRate() {
    const blue = await getBlueRate();
    setState(s => ({ ...s, blueRate: blue }));
  }

  return (
    <AppContext.Provider value={{ ...state, hasWorkspace: !!state.workspace, unlockWithPin, lockApp, setupWorkspace, reloadCategories, reloadMembers, refreshBlueRate }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
