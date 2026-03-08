/**
 * PromptHub API Client
 * Handles all communication with the Laravel backend.
 * Base URL is read from NEXT_PUBLIC_API_URL env var (default: http://localhost:8000).
 */

import axios from "axios"
import { wrapAxiosWithPayment } from "x402-stacks"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
const TOKEN_KEY = "prompthub_api_token"

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
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

/**
 * Creates or returns a wrapped Axios instance for x402 payments.
 * @param account The Stacks Account object (must have address and signTransaction)
 */
export function getX402Client(account: any) {
    return wrapAxiosWithPayment(x402Api, account as any)
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
    user?: any // The updated user model from backend
}

/**
 * POST /api/users/upload
 * Uploads a file to IPFS via the backend Pinata bridge.
 */
export async function uploadFile(file: File, type: "avatar" | "cover"): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", type)

    return request<UploadResponse>("/api/users/upload", {
        method: "POST",
        body: formData,
    }, true)
}

// ─── Auth ─────────────────────────────────────────────────────────────────

export interface ApiUser {
    stx_address: string
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
