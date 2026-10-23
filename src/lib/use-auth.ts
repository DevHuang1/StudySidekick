"use client";

import { useSyncExternalStore } from "react";
import {
  getAuthSnapshot,
  getServerAuthSnapshot,
  subscribeToAuth,
  type AuthSnapshot,
} from "@/lib/auth";

export function useAuth(): AuthSnapshot {
  return useSyncExternalStore(subscribeToAuth, getAuthSnapshot, getServerAuthSnapshot);
}
