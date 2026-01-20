import { LucideIcon } from "lucide-react";

// ============ CONSTANTS ============
export const NOTIF_CACHE_KEY = "notifications_cache";
export const NOTIF_CACHE_TS_KEY = "notifications_cache_ts";
export const UNREAD_CACHE_KEY = "unread_count";
export const NOTIF_CACHE_TTL_MS = 30 * 1000;
export const USER_CACHE_KEY = "header_user_cache";
export const USER_CACHE_TTL_MS = 60 * 60 * 1000;
export const LANGUAGE_STORAGE_KEY = "karkey:lang";

// Shared CSS classes for dropdown items
export const DROPDOWN_ITEM_CLASS = "w-full flex items-center gap-3 px-4 py-[7px] text-[13px] text-gray-700 hover:bg-[#B8071C]/5 hover:text-[#B8071C] transition-colors text-left font-serif";
export const CREATE_BTN_CLASS = "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold bg-[#B8071C] text-white rounded-lg hover:bg-[#910515] transition-colors shadow-sm font-serif";
export const GUIDE_BTN_CLASS = "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-[#B8071C] hover:border-[#B8071C]/30 transition-all shadow-sm font-serif";
export const EXPANDED_ACTIONS_CLASS = "px-4 py-2 bg-gray-50/50 border-t border-b border-gray-100 flex gap-2 animate-in slide-in-from-top-1 duration-200";

// ============ TYPES ============
export type HeaderUserSnapshot = {
    id?: number | null;
    userId?: number | null;
    username?: string | null;
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    profile_picture?: string | null;
    initial?: string | null;
    [k: string]: any;
} | null;

export interface HeaderProps {
    initialLoggedIn?: boolean;
}
