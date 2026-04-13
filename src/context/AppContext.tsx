'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Workspace, Member, Category, BlueRate } from '@/types';
import { getBlueRate } from '@/lib/blueRate';
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
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setupWorkspace: (name: string, displayName: string, currency: 'ARS' | 'USD') => Promise<void>;
  joinWorkspace: (code: string, displayName: string) => Promise<void>;
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
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setState(s => ({ ...s, isLoading: false })); return; }
      await loadUserData(session.user.id);
    } catch {
      setState(s => ({ ...s, isLoading: false }));
    }
  }

  async function loadUserData(userId: string) {
    // Always look up the member by user_id from the DB (works across devices)
    const { data: member } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (!member) {
      setState(s => ({ ...s, isAuthenticated: true, isLoading: false }));
      return;
    }

    // Persist to localStorage for faster future loads
    localStorage.setItem(WS_KEY, member.workspace_id);
    localStorage.setItem(MEM_KEY, member.id);

    const [{ data: ws }, { data: cats }, { data: mems }, blue] = await Promise.all([
      supabase.from('workspaces').select('*').eq('id', member.workspace_id).single(),
      supabase.from('categories').select('*').eq('workspace_id', member.workspace_id).order('sort_order'),
      supabase.from('members').select('*').eq('workspace_id', member.workspace_id),
      getBlueRate(),
    ]);

    setState({
      workspace: ws, currentMember: member, members: mems ?? [],
      categories: cats ?? [], blueRate: blue,
      isAuthenticated: true, isLoading: false,
    });

    // Update last seen info, then refresh members list so UI shows current data
    updateLastSeen(member.id, member.workspace_id);
  }

  async function updateLastSeen(memberId: string, workspaceId: string) {
    try {
      const device = parseDevice(navigator.userAgent);
      let location = 'Desconocida';
      try {
        const GEO_KEY = 'gastly_geo';
        const GEO_AT_KEY = 'gastly_geo_at';
        const cached = localStorage.getItem(GEO_KEY);
        const cachedAt = Number(localStorage.getItem(GEO_AT_KEY) ?? 0);
        if (cached && Date.now() - cachedAt < 86_400_000) {
          location = cached;
        } else {
          const res = await fetch('https://ip-api.com/json/?fields=city,country,status', { signal: AbortSignal.timeout(4000) });
          if (res.ok) {
            const json = await res.json();
            if (json.status === 'success') {
              location = `${json.city}, ${json.country}`;
              localStorage.setItem(GEO_KEY, location);
              localStorage.setItem(GEO_AT_KEY, String(Date.now()));
            }
          }
        }
      } catch { /* ignore geo errors */ }
      const now = new Date().toISOString();
      const { error } = await supabase.from('members').update({
        last_seen_at: now,
        last_device: device,
        last_location: location,
      }).eq('id', memberId);
      if (error) return;
      // Refresh members in state so UI reflects updated values immediately
      const { data: mems } = await supabase.from('members').select('*').eq('workspace_id', workspaceId);
      setState(s => ({ ...s, members: mems ?? [], currentMember: mems?.find(m => m.id === memberId) ?? s.currentMember }));
    } catch { /* ignore */ }
  }

  function parseDevice(ua: string): string {
    if (/iPhone/.test(ua)) return 'iPhone';
    if (/iPad/.test(ua)) return 'iPad';
    if (/Android.*Mobile/.test(ua)) return 'Android (móvil)';
    if (/Android/.test(ua)) return 'Android (tablet)';
    if (/Macintosh/.test(ua)) return 'Mac';
    if (/Windows/.test(ua)) return 'Windows';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Desconocido';
  }

  async function login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    await loadUserData(data.user.id);
  }

  async function register(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('No se pudo crear el usuario');
    setState(s => ({ ...s, isAuthenticated: true, isLoading: false }));
  }

  async function logout() {
    await supabase.auth.signOut();
    localStorage.removeItem(WS_KEY);
    localStorage.removeItem(MEM_KEY);
    setState({ workspace: null, currentMember: null, members: [], categories: [], blueRate: null, isAuthenticated: false, isLoading: false });
  }

  async function setupWorkspace(name: string, displayName: string, currency: 'ARS' | 'USD') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { data: ws, error: wsErr } = await supabase
      .from('workspaces')
      .insert({ name, pin_hash: '', default_currency: currency })
      .select().single();
    if (wsErr || !ws) throw new Error(wsErr?.message);

    const { data: member, error: memErr } = await supabase
      .from('members')
      .insert({ workspace_id: ws.id, user_id: user.id, display_name: displayName.toUpperCase().slice(0, 4), role: 'owner' })
      .select().single();
    if (memErr || !member) throw new Error(memErr?.message);

    const { data: cats } = await supabase
      .from('categories')
      .insert(DEFAULT_CATEGORIES.map(c => ({ ...c, workspace_id: ws.id, is_default: true })))
      .select();

    localStorage.setItem(WS_KEY, ws.id);
    localStorage.setItem(MEM_KEY, member.id);

    const blue = await getBlueRate();
    setState(s => ({ ...s, workspace: ws, currentMember: member, members: [member], categories: cats ?? [], blueRate: blue }));
  }

  async function joinWorkspace(code: string, displayName: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    // code is the workspace id
    const { data: ws, error: wsErr } = await supabase
      .from('workspaces').select('*').eq('id', code.trim()).single();
    if (wsErr || !ws) throw new Error('Código inválido — verificá que esté bien escrito');

    const { data: member, error: memErr } = await supabase
      .from('members')
      .insert({ workspace_id: ws.id, user_id: user.id, display_name: displayName.toUpperCase().slice(0, 4), role: 'member' })
      .select().single();
    if (memErr || !member) throw new Error(memErr?.message);

    const [{ data: cats }, { data: mems }, blue] = await Promise.all([
      supabase.from('categories').select('*').eq('workspace_id', ws.id).order('sort_order'),
      supabase.from('members').select('*').eq('workspace_id', ws.id),
      getBlueRate(),
    ]);

    localStorage.setItem(WS_KEY, ws.id);
    localStorage.setItem(MEM_KEY, member.id);
    setState(s => ({ ...s, workspace: ws, currentMember: member, members: mems ?? [], categories: cats ?? [], blueRate: blue }));
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
    <AppContext.Provider value={{
      ...state,
      hasWorkspace: !!state.workspace,
      login, register, logout,
      setupWorkspace, joinWorkspace, reloadCategories, reloadMembers, refreshBlueRate,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
