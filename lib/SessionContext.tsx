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
    const fetchSession = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        setProfile(profile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    };
    fetchSession();

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, _session) => {
      fetchSession();
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={{ session, profile, loading, setSession, setProfile }}>
      {children}
    </SessionContext.Provider>
  );
};
