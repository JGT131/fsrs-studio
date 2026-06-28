// Persistent client id (since real auth is mocked).
// Sent as `X-Client-Id` header by all FSRS API calls.
// Optional `X-Guest-Code` header is also attached when the user has
// activated a Founder's Guest beta code (see Studio header UI).
import axios from "axios";

const KEY = "fsrs_client_id";
const GUEST_KEY = "fsrs_guest_code";

function generate() {
    // RFC4122 v4 fallback (crypto.randomUUID where available)
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export function getClientId() {
    if (typeof window === "undefined") return "ssr";
    let id = localStorage.getItem(KEY);
    if (!id) {
        id = generate();
        localStorage.setItem(KEY, id);
    }
    return id;
}

export function getGuestCode() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(GUEST_KEY) || null;
}

export function setGuestCode(code) {
    if (typeof window === "undefined") return;
    if (code) localStorage.setItem(GUEST_KEY, code);
    else localStorage.removeItem(GUEST_KEY);
}

export function clearGuestCode() {
    setGuestCode(null);
}

// Install global axios interceptor — attach X-Client-Id (+ X-Guest-Code) to every request
let installed = false;
export function installAxiosClientId() {
    if (installed) return;
    installed = true;
    axios.interceptors.request.use((cfg) => {
        cfg.headers = cfg.headers || {};
        cfg.headers["X-Client-Id"] = getClientId();
        const guest = getGuestCode();
        if (guest) cfg.headers["X-Guest-Code"] = guest;
        return cfg;
    });
}
