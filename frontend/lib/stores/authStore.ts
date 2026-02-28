import { create } from "zustand";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/client";

interface AuthState {
    user: User | null;
    loading: boolean;
    token: string | null;
    agency: any | null;
    usage: any | null;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    setToken: (token: string | null) => void;
    fetchAgency: () => Promise<void>;
    fetchUsage: () => Promise<void>;
    initialize: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    loading: true,
    token: null,
    agency: null,
    usage: null,
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),
    setToken: (token) => set({ token }),
    fetchAgency: async () => {
        const { user } = useAuthStore.getState();
        if (!user) return;
        try {
            const { apiClient } = await import("../api");
            const resp = await apiClient.get("/settings/agency");
            set({ agency: resp.data });
        } catch (err) {
            console.error("Failed to fetch agency:", err);
        }
    },
    fetchUsage: async () => {
        const { user, agency } = useAuthStore.getState();
        if (!user) return;
        
        let targetAgency = agency;
        const { apiClient } = await import("../api");

        if (!targetAgency) {
            try {
                const resp = await apiClient.get("/settings/agency");
                targetAgency = resp.data;
                set({ agency: targetAgency });
            } catch (err) {
                console.error("Failed to fetch agency for usage:", err);
                return;
            }
        }

        try {
            const resp = await apiClient.get(`/usage/${targetAgency.id}`);
            set({ usage: resp.data });
        } catch (err) {
            console.error("Failed to fetch usage:", err);
        }
    },
    initialize: () => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const token = await user.getIdToken();
                set({ user, token, loading: false });
                const store = useAuthStore.getState();
                await store.fetchAgency();
                await store.fetchUsage();
            } else {
                set({ user: null, token: null, agency: null, usage: null, loading: false });
            }
        });
        return unsubscribe;
    },
}));
