import {
    GoogleAuthProvider,
    GithubAuthProvider,
    signInWithPopup,
    signInWithPhoneNumber,
    RecaptchaVerifier,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    signOut,
    updateProfile,
    ConfirmationResult,
    User,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { apiClient } from "@/lib/api";

let confirmationResult: ConfirmationResult | null = null;

export async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.addScope("email");
    provider.addScope("profile");
    const result = await signInWithPopup(auth, provider);
    await createOrUpdateAgency(result.user, "google");
    return result.user;
}

export async function signInWithGitHub() {
    const provider = new GithubAuthProvider();
    provider.addScope("user:email");
    const result = await signInWithPopup(auth, provider);
    await createOrUpdateAgency(result.user, "github");
    return result.user;
}

export async function sendPhoneOTP(phoneNumber: string) {
    const recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
    });
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return { success: true };
}

export async function verifyPhoneOTP(code: string) {
    if (!confirmationResult) throw new Error("No OTP sent yet");
    const result = await confirmationResult.confirm(code);
    await createOrUpdateAgency(result.user, "phone");
    return result.user;
}

export async function registerWithEmail(
    email: string,
    password: string,
    name: string,
    plan: string = "free_trial"
) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    await createOrUpdateAgency(result.user, "email", { plan });
    await sendEmailVerification(result.user);
    return result.user;
}

export async function loginWithEmail(email: string, password: string) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
}

export async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
}

export async function logout() {
    await signOut(auth);
    if (typeof window !== "undefined") {
        window.location.href = "/";
    }
}

export async function getIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken(false);
}

async function createOrUpdateAgency(
    user: User,
    loginMethod: string,
    extra?: { plan?: string }
) {
    try {
        const token = await user.getIdToken();
        await apiClient.post(
            "/settings/agency",
            {
                firebase_uid: user.uid,
                name: user.displayName || user.email || "User",
                email: user.email || "",
                photo_url: user.photoURL || "",
                login_method: loginMethod,
                plan: extra?.plan || "free_trial",
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
    } catch (error) {
        console.error("Failed to create/update agency:", error);
    }
}
