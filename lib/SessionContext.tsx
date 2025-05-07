"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface SessionContextType {
  session: any;
  profile: any;
  loading: boolean;
  setSession: React.Dispatch<React.SetStateAction<any>>;
  setProfile: React.Dispatch<React.SetStateAction<any>>;
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  profile: null,
  loading: true,
  setSession: () => {},
  setProfile: () => {},
});

export const useSessionContext = () => useContext(SessionContext);

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    let lastSessionId: string | null = null;
    let debounceTimeout: NodeJS.Timeout | null = null;

    const fetchSession = async (incomingSession?: any) => {
      let sessionToUse = incomingSession;
      if (!sessionToUse) {
        const { data: { session } } = await supabase.auth.getSession();
        sessionToUse = session;
      }
      // Only update if session actually changed
      if (sessionToUse?.user?.id !== lastSessionId) {
        setLoading(true);
        setSession(sessionToUse);
        lastSessionId = sessionToUse?.user?.id || null;
        if (sessionToUse) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', sessionToUse.user.id)
            .single();
          setProfile(profile);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    };
    fetchSession();

    // Listen for auth state changes, debounce fetchSession
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (debounceTimeout) clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        fetchSession(newSession);
      }, 2000); // Increased debounce to 2000ms
    });
    return () => {
      listener?.subscription.unsubscribe();
      if (debounceTimeout) clearTimeout(debounceTimeout);
    };
  }, []);

  return (
    <SessionContext.Provider value={{ session, profile, loading, setSession, setProfile }}>
      {children}
    </SessionContext.Provider>
  );
};
