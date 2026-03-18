/**
 * PromptHub API Client
 * Handles all communication with the Laravel backend.
 * Base URL is read from NEXT_PUBLIC_API_URL env var (default: http://localhost:8000).
 */

import axios from "axios"
import { wrapAxiosWithPayment } from "x402-stacks"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
const TOKEN_KEY = "prompthub_api_token"
const COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd"

/**
 * Fetches the current STX price in USD from CoinGecko.
 * Returns a fallback of 2.5 if the request fails.
 */
export async function fetchStacksPrice(): Promise<number> {
    try {
        const apiKey = process.env.NEXT_PUBLIC_COINGECKO_API_KEY
        const url = apiKey
            ? `${COINGECKO_URL}&x_cg_pro_api_key=${apiKey}`
            : COINGECKO_URL

        const res = await fetch(url)
        const data = await res.json()

        if (data && data.blockstack && typeof data.blockstack.usd === 'number') {
            return data.blockstack.usd
        }

        console.warn("CoinGecko response missing blockstack.usd, using fallback.")
        return 2.5
    } catch (err) {
        console.error("Failed to fetch STX price:", err)
        return 2.5 // Fallback
    }
}

// Standard Axios instance for x402 protected routes
const x402Api = axios.create({
    baseURL: BASE_URL,
    headers: {
        Accept: "application/json",
    },
})

// Add Auth Token to Axios
x402Api.interceptors.request.use((config) => {
    const token = getApiToken()
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

/**
 * Creates or returns a wrapped Axios instance for x402 payments.
 * @param account The Stacks Account object (must have address and signTransaction)
 */
export function getX402Client(account: any) {
    // Create a fresh instance to avoid duplicate wrapping or interceptor conflicts
    const api = axios.create({
        baseURL: BASE_URL,
        headers: {
            Accept: "application/json",
        },
    })

    // Add auth token
    const token = getApiToken()
    if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`
    }

    return wrapAxiosWithPayment(api, account as any)
}

export function getApiToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem(TOKEN_KEY)
}

export function setApiToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
}

export function clearApiToken(): void {
    localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(
    path: string,
    options: RequestInit = {},
    skipContentType = false,
): Promise<T> {
    const token = getApiToken()

    const headers: Record<string, string> = {
        Accept: "application/json",
        ...(options.headers as Record<string, string> ?? {}),
    }

    // Auto-set JSON content type if not skipping and not a FormData body
    if (!skipContentType && !(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json"
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`
    }

    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
    })

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }))
        throw new Error(error?.message ?? "API error")
    }

    return res.json() as Promise<T>
}

// ─── Media ────────────────────────────────────────────────────────────────

export interface UploadResponse {
    cid: string
    url: string
    path: string
    ipfs_uri: string
    user?: any // The updated user model from backend
}

/**
 * POST /api/users/upload
 * Uploads a file to IPFS via the backend Pinata bridge.
 */
export async function uploadFile(file: File, type: "avatar" | "cover" | "prompt"): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", type)

    return request<UploadResponse>("/api/users/upload", {
        method: "POST",
        body: formData,
    }, true)
}

/**
 * POST /api/prompts/upload-assets
 * Uploads a file to local backend storage.
 */
export async function uploadPromptAsset(file: File): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append("file", file)

    return request<UploadResponse>("/api/prompts/upload-assets", {
        method: "POST",
        body: formData,
    }, true)
}

/**
 * POST /api/ipfs/metadata
 * Uploads JSON metadata to IPFS via the backend.
 */
export async function uploadMetadata(data: {
    name: string
    description: string
    image: string
    properties?: any
}): Promise<UploadResponse> {
    return request<UploadResponse>("/api/ipfs/metadata", {
        method: "POST",
        body: JSON.stringify(data),
    })
}

// ─── Auth ─────────────────────────────────────────────────────────────────

export interface ApiUser {
    stx_address: string
    username: string | null
    name: string | null
    bio: string | null
    avatar_url: string | null
    cover_url: string | null
    roles: string[] | null
}

export interface LoginResponse {
    token: string
    user: ApiUser
}

/**
 * POST /api/auth/login
 * Called after wallet is connected. Creates user if not exists.
 */
export async function loginWithWallet(stxAddress: string): Promise<LoginResponse> {
    const res = await request<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ stx_address: stxAddress }),
    })
    setApiToken(res.token)
    return res
}

/**
 * GET /api/users/me
 * Returns the current authenticated user's profile.
 */
export async function fetchMe(): Promise<ApiUser> {
    return request<ApiUser>("/api/users/me")
}

/**
 * GET /api/users/{address}
 * Returns a public profile for any user by address.
 */
export async function fetchUserByAddress(address: string): Promise<ApiUser> {
    return request<ApiUser>(`/api/users/${address}`)
}

/**
 * PUT /api/users/me
 * Updates the user's profile (name, bio, avatar_url, roles).
 */
export async function updateProfile(data: {
    username?: string
    name?: string
    bio?: string
    avatar_url?: string
    cover_url?: string
    roles?: string[]
}): Promise<ApiUser> {
    return request<ApiUser>("/api/users/me", {
        method: "PUT",
        body: JSON.stringify(data),
    })
}

// ─── Bookmarks ────────────────────────────────────────────────────────────

export interface BookmarkToggleResponse {
    success: boolean
    is_bookmarked: boolean
    message: string
}

/**
 * POST /api/prompts/{id}/bookmark
 * Toggles bookmark status for a prompt.
 */
export async function toggleBookmark(promptId: string | number): Promise<BookmarkToggleResponse> {
    return request<BookmarkToggleResponse>(`/api/prompts/${promptId}/bookmark`, {
        method: "POST",
    })
}

/**
 * GET /api/users/me/bookmarks
 * Returns the current user's collections.
 */
export async function fetchBookmarks(): Promise<any> {
    return request<any>("/api/users/me/bookmarks")
}

/**
 * GET /api/prompts/{id}/content
 * Returns the premium content of a prompt. Protected by x402.
 */
export async function fetchPremiumContent(promptId: string | number, account: any): Promise<{ original_content: string }> {
    const client = getX402Client(account)
    const res = await client.get(`/api/prompts/${promptId}/content`)
    return res.data
}

// ─── Prompts ────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
}

/**
 * GET /api/prompts
 * Fetches a paginated list of prompts with optional filters.
 */
export async function getPrompts(params?: Record<string, string>): Promise<PaginatedResponse<any>> {
    const qs = params ? new URLSearchParams(params).toString() : '';
    const url = `/api/prompts${qs ? `?${qs}` : ''}`;
    return request<PaginatedResponse<any>>(url);
}

/**
 * GET /api/prompts/{id}
 * Fetches details of a single prompt by its ID.
 */
export async function getPrompt(id: string): Promise<any> {
    return request<any>(`/api/prompts/${id}`);
}

/**
 * POST /api/prompts
 * Creates a new prompt.
 */
export async function createPrompt(data: any): Promise<any> {
    return request<any>("/api/prompts", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

// ─── Messages & Notifications ─────────────────────────────────────────────

export async function searchUsers(query: string): Promise<ApiUser[]> {
    return request<ApiUser[]>(`/api/users/search?q=${encodeURIComponent(query)}`);
}

export async function fetchConversations(): Promise<any[]> {
    return request<any[]>("/api/messages");
}

export async function fetchMessages(address: string, cursor?: string): Promise<any> {
    const url = cursor ? `/api/messages/${address}?cursor=${cursor}` : `/api/messages/${address}`;
    return request<any>(url);
}

export async function sendMessage(data: { receiver_address: string, content: string, attachment_url?: string }): Promise<any> {
    return request<any>("/api/messages", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function sendTypingIndicator(receiverAddress: string): Promise<any> {
    return request<any>("/api/messages/typing", {
        method: "POST",
        body: JSON.stringify({ receiver_address: receiverAddress }),
    });
}

export async function markAllMessagesRead(senderAddress: string): Promise<any> {
    return request<any>("/api/messages/read-all", {
        method: "PUT",
        body: JSON.stringify({ sender_address: senderAddress }),
    });
}

export async function markMessageRead(messageId: number): Promise<any> {
    return request<any>(`/api/messages/${messageId}/read`, {
        method: "PUT",
    });
}

export async function fetchNotifications(): Promise<any[]> {
    return request<any[]>("/api/notifications");
}

export async function markNotificationsRead(): Promise<any> {
    return request<any>("/api/notifications/read", { method: "PUT" });
}

// ─── Connections (Friends) ────────────────────────────────────────────────

export async function fetchConnections(): Promise<any[]> {
    return request<any[]>("/api/connections");
}

export async function sendFriendRequest(recipientAddress: string): Promise<any> {
    return request<any>("/api/connections", {
        method: "POST",
        body: JSON.stringify({ recipient_address: recipientAddress }),
    });
}

export async function acceptFriendRequest(connectionId: number): Promise<any> {
    return request<any>(`/api/connections/${connectionId}/accept`, { method: "PUT" });
}

export async function removeFriendConnection(connectionId: number): Promise<any> {
    return request<any>(`/api/connections/${connectionId}`, { method: "DELETE" });
}
