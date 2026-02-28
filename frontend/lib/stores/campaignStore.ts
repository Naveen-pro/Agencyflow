import { create } from "zustand";

interface CampaignState {
    channel: string;
    uploadId: string | null;
    contacts: Array<{ name?: string; phone?: string; email?: string }>;
    validCount: number;
    invalidCount: number;
    message: string;
    enhancedMessage: string | null;
    subject: string;
    voice: string;
    speed: string;
    campaignId: string | null;
    status: "idle" | "uploading" | "composing" | "sending" | "streaming" | "completed";
    setChannel: (channel: string) => void;
    setUpload: (uploadId: string, contacts: any[], validCount: number, invalidCount: number) => void;
    setMessage: (message: string) => void;
    setEnhancedMessage: (message: string | null) => void;
    setSubject: (subject: string) => void;
    setVoice: (voice: string) => void;
    setSpeed: (speed: string) => void;
    setCampaignId: (id: string) => void;
    setStatus: (status: CampaignState["status"]) => void;
    reset: () => void;
}

export const useCampaignStore = create<CampaignState>((set) => ({
    channel: "sms",
    uploadId: null,
    contacts: [],
    validCount: 0,
    invalidCount: 0,
    message: "",
    enhancedMessage: null,
    subject: "",
    voice: "female-en",
    speed: "normal",
    campaignId: null,
    status: "idle",
    setChannel: (channel) => set({ channel }),
    setUpload: (uploadId, contacts, validCount, invalidCount) =>
        set({ uploadId, contacts, validCount, invalidCount, status: "composing" }),
    setMessage: (message) => set({ message }),
    setEnhancedMessage: (enhancedMessage) => set({ enhancedMessage }),
    setSubject: (subject) => set({ subject }),
    setVoice: (voice) => set({ voice }),
    setSpeed: (speed) => set({ speed }),
    setCampaignId: (campaignId) => set({ campaignId, status: "streaming" }),
    setStatus: (status) => set({ status }),
    reset: () =>
        set({
            uploadId: null,
            contacts: [],
            validCount: 0,
            invalidCount: 0,
            message: "",
            enhancedMessage: null,
            subject: "",
            voice: "female-en",
            speed: "normal",
            campaignId: null,
            status: "idle",
        }),
}));
