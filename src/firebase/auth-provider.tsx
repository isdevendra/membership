"use client";

import { useAuth, useUser } from "@/firebase";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";
import React, { useEffect } from "react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const { isUserLoading, user } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth]);
  
  return <>{children}</>;
}
