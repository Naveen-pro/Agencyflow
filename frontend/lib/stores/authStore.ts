import { create } from "zustand";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/client";

interface AuthState {
    user: User | null;
    loading: boolean;
    token: string | null;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    setToken: (token: string | null) => void;
    initialize: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    loading: true,
    token: null,
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),
    setToken: (token) => set({ token }),
    initialize: () => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const token = await user.getIdToken();
                set({ user, token, loading: false });
            } else {
                set({ user: null, token: null, loading: false });
            }
        });
        return unsubscribe;
    },
}));
