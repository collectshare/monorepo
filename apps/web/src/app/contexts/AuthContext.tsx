import * as Sentry from '@sentry/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { createContext, useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { clarity } from 'react-microsoft-clarity';

import { localStorageKeys } from '../config/localStorageKeys';
import type { IUserProfile } from '../entities/IUserProfile';
import { accountsService } from '../services/accountsService';

interface IAuthContextValue {
  signedIn: boolean;
  user: IUserProfile | undefined;
  signin(accessToken: string, refreshToken: string): void;
  signout(): void;
}

export const AuthContext = createContext<IAuthContextValue>(
  {} as IAuthContextValue,
);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [signedIn, setSignedIn] = useState<boolean>(() => {
    const storedAccessToken = localStorage.getItem(
      localStorageKeys.ACCESS_TOKEN,
    );

    return !!storedAccessToken;
  });

  const { isError, isLoading, isSuccess, data } = useQuery({
    queryKey: ['accounts', 'me'],
    queryFn: () => accountsService.me(),
    enabled: signedIn,
    staleTime: Infinity,
  });

  const signin = useCallback((accessToken: string, refreshToken: string) => {
    localStorage.setItem(localStorageKeys.ACCESS_TOKEN, accessToken);
    localStorage.setItem(localStorageKeys.REFRESH_TOKEN, refreshToken);

    setSignedIn(true);
  }, []);

  const signout = useCallback(() => {
    localStorage.removeItem(localStorageKeys.ACCESS_TOKEN);
    localStorage.removeItem(localStorageKeys.REFRESH_TOKEN);
    queryClient.removeQueries({ queryKey: ['users', 'me'] });

    setSignedIn(false);
    Sentry.setUser(null);
  }, [queryClient]);

  useEffect(() => {
    if (isError) {
      toast.error('Sua sessão expirou!');
      signout();
    }

    if (data) {
      Sentry.setUser({
        id: data.id,
        email: data.email,
      });

      if (clarity.hasStarted()) {
        clarity.identify(data.id, { email: data.email });
      }
    }
  }, [isError, signout]);

  return (
    <AuthContext.Provider
      value={{
        signedIn: isSuccess && signedIn,
        user: data,
        signin,
        signout,
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
}
