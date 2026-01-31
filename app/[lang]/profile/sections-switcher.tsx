"use client";

import { getUserAuctions, getUserDirectSales, getWatchlistForUser, getDirectSalesWatchlistForUser, updateUserProfile, checkEmailAvailability } from "./actions"; // Import Server Actions
import logger from "@/lib/logger";
import React, { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { Shield, CheckCircle, Clock, AlertCircle, BadgeCheck, Sparkles, X } from "lucide-react";
import { m } from "framer-motion";
import { useRouter } from "next/navigation";

import ListingsSection from "./listings-section";
import { useTranslation } from "@/lib/i18n-context";
import ProfilePictureUpload from "./profile-picture-upload";
import StatisticsSection from "./statistics-section";
import { UserProfile, ListingItem } from "./types";
// -- New Imports --
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";

import { validateEmail, validatePhoneInternational } from "@/lib/validations";
import { EmailVerification } from "@/components/auth/email-verification";

/* -------- Props -------- */
interface SectionsSwitcherProps {
  profile: UserProfile;
  userId: number;
  auctions?: ListingItem[]; // optional now
  watchlist?: ListingItem[];
  dsWatchlist?: ListingItem[];
  successFlag?: boolean;
  initialTab?: string;
}

/* ========================================================== */
export default function SectionsSwitcher({
  profile,
  userId,
  auctions,
  watchlist, // deprecated
  dsWatchlist, // deprecated
  initialTab = "personal-info",
}: SectionsSwitcherProps) {
  const p = profile;
  const { t, language } = useTranslation();
  const router = useRouter();

  // Handle legacy my-showroom tab by defaulting it to listings
  const normalizedInitialTab = initialTab === "my-showroom" ? "listings" : initialTab;

  // Use local state for active tab - initialized from server but updated client-side
  const [active, setActive] = useState(normalizedInitialTab);
  const [targetSubTab, setTargetSubTab] = useState<"all">(
    "all"
  );

  // Listen for custom tabchange event from profile-menu
  useEffect(() => {
    const handleTabChange = (e: CustomEvent) => {
      if (e.detail === "my-showroom") {
        setActive("listings");
        setTargetSubTab("all");
      } else {
        setActive(e.detail);
        // Only reset if we transition to listings normally without a sub-target
        if (e.detail === "listings") setTargetSubTab("all");
      }
    };
    window.addEventListener("tabchange", handleTabChange as EventListener);

    // Also handle browser back/forward
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab") || "personal-info";
      setActive(tab);
    };
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("tabchange", handleTabChange as EventListener);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Local state management
  const [favoritesState, setFavoritesState] = useState<ListingItem[] | undefined>(undefined);
  const [auctionsState, setAuctionsState] = useState<ListingItem[] | undefined>(() => (Array.isArray(auctions) ? auctions : undefined));
  const [isFetching, startTransition] = useTransition();
  const [resubmitSuccess, setResubmitSuccess] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // -- Edit Info State --
  const [showEditInfoModal, setShowEditInfoModal] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [editForm, setEditForm] = useState({ email: "", phone_number: "" });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when profile changes
  useEffect(() => {
    if (p) {
      setEditForm({
        email: p.email || "",
        phone_number: p.phone_number || "",
      });
    }
  }, [p]);

  const handleSaveProfile = async () => {
    // Validate
    const emailRes = validateEmail(editForm.email);
    const phoneRes = validatePhoneInternational(editForm.phone_number);
    const newErrors: Record<string, string> = {};
    if (!emailRes.isValid) newErrors.email = emailRes.error!;
    if (!phoneRes.isValid) newErrors.phone_number = phoneRes.error!;

    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      return;
    }

    // Check if email changed
    if (editForm.email !== p.email) {
      // Check if email is already taken
      setIsSaving(true);
      try {
        const availability = await checkEmailAvailability(editForm.email);
        if (!availability.available) {
          setValidationErrors(prev => ({ ...prev, email: t("auth.register.email_taken") || availability.error || "Email already registered" }));
          setIsSaving(false);
          return;
        }
      } catch (err) {
        logger.error("[sections-switcher] Error checking email availability:", err);
        setIsSaving(false);
        return;
      }
      setIsSaving(false);

      setShowVerification(true);
      return;
    }

    await saveData();
  };

  const saveData = async () => {
    setIsSaving(true);
    try {
      const res = await updateUserProfile(userId, editForm);
      if (res.success) {
        setShowEditInfoModal(false);
        setShowVerification(false);
        router.refresh(); // Refresh to show updated data
      } else {
        alert("Failed to update profile: " + (res.error || "Unknown error"));
      }
    } catch (e) {
      alert("An error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  // Keep auctionsState in sync if server prop changes
  useEffect(() => {
    if (Array.isArray(auctions)) setAuctionsState(auctions)
  }, [auctions])

  // Fetch Favorites if missing
  useEffect(() => {
    if (typeof favoritesState !== "undefined") return;
    if (!userId) {
      // logger.warn("[SectionsSwitcher] No userId provided, skipping favorites fetch.");
      return;
    }

    const fetchAll = async () => {
      try {
        const [watchRes, dsWatchRes] = await Promise.all([
          getWatchlistForUser(userId),
          getDirectSalesWatchlistForUser(userId)
        ]);

        // Merge and sort
        const merged = [...(watchRes || []), ...(dsWatchRes || [])].sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });

        setFavoritesState(merged);
      } catch (err) {
        logger.error("[SectionsSwitcher] Error fetching favorites:", err);
        setFavoritesState([]);
      }
    };
    fetchAll();
  }, [userId, favoritesState]);

  // Fetch Auctions and Direct Sales if missing
  useEffect(() => {
    if (typeof auctionsState !== "undefined") return;
    if (!userId) return;

    const fetchListings = async () => {
      try {
        const [aucRes, dsRes] = await Promise.all([
          getUserAuctions(userId),
          getUserDirectSales(userId)
        ]);

        const aucs = aucRes?.success && aucRes?.auctions ? aucRes.auctions : [];
        const dSales = dsRes?.success && dsRes?.directSales ? dsRes.directSales : [];

        // Merge and sort everything by creation date descending
        const merged = [...aucs, ...dSales].sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });

        setAuctionsState(merged);
      } catch (err) {
        logger.error("[SectionsSwitcher] Error fetching my listings:", err);
        setAuctionsState([]);
      }
    };
    fetchListings();
  }, [userId, auctionsState]);

  // Persist profile picture + uid + initial (for instant header paint)
  useEffect(() => {
    try {
      if (userId) {
        localStorage.setItem("profile:lastUid", String(userId));
        const initial =
          (p?.first_name || p?.username || "U").toString().charAt(0).toUpperCase();
        localStorage.setItem(`profile:initial:${userId}`, initial);
      }
      if (p?.profile_picture && userId) {
        localStorage.setItem(`profile:picture:${userId}`, p.profile_picture);
        window.dispatchEvent(
          new CustomEvent("profile:picture-updated", { detail: { userId, url: p.profile_picture } })
        );
      }
    } catch {
      // ignore storage errors
    }
  }, [p?.first_name, p?.username, p?.profile_picture, userId]);

  const showPersonal = active === "personal-info";

  const showListings = active === "listings";
  const showFavorites = active === "favorites";
  const showStatistics = active === "statistics";



  // Render Edit Info Modal
  const renderEditInfoModal = () => {
    if (!showEditInfoModal) return null;

    return createPortal(
      <div className="fixed inset-0 z-[100005] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => {
            setShowEditInfoModal(false);
            setShowVerification(false);
            setEditForm({ email: p.email || "", phone_number: p.phone_number || "" }); // Reset form on close
          }}
        />
        <div className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold font-serif text-[#008E46]">
              {showVerification ? t("verification.title") : t("profile.edit_info")}
            </h3>
            <button
              onClick={() => {
                setShowEditInfoModal(false);
                setShowVerification(false);
                setEditForm({ email: p.email || "", phone_number: p.phone_number || "" }); // Reset form on close
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {showVerification ? (
              <EmailVerification
                email={editForm.email}
                lang={language}
                onVerified={() => saveData()}
                onBack={() => setShowVerification(false)}
              />
            ) : (
              <div className="space-y-5">
                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#222222] font-serif">{t("profile.email")}</label>
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      value={editForm.email}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditForm(prev => ({ ...prev, email: val }));
                        // Real-time validation
                        if (validationErrors.email) {
                          const res = validateEmail(val);
                          if (res.isValid) {
                            setValidationErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.email;
                              return newErrors;
                            });
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const res = validateEmail(e.target.value);
                        if (!res.isValid) setValidationErrors(prev => ({ ...prev, email: res.error || "Invalid email" }));
                      }}
                      className={`h-12 rounded-lg border-gray-200 focus:border-[#008E46] focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-4 focus:ring-[#008E46]/10 pe-10 font-serif ${validationErrors.email ? "border-red-500" : ""}`}
                    />
                  </div>
                  {validationErrors.email && (
                    <div className="h-3 text-xs leading-3 text-red-500">{t(validationErrors.email as any) || validationErrors.email}</div>
                  )}
                </div>

                {/* Phone Input */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#222222] font-serif">{t("profile.phone")}</label>
                  <PhoneInput
                    value={editForm.phone_number}
                    onChange={(val) => {
                      setEditForm(prev => ({ ...prev, phone_number: val }));
                      if (validationErrors.phone_number) {
                        const res = validatePhoneInternational(val);
                        if (res.isValid) {
                          setValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.phone_number;
                            return newErrors;
                          });
                        }
                      }
                    }}
                    onBlur={() => {
                      const res = validatePhoneInternational(editForm.phone_number);
                      if (!res.isValid) setValidationErrors(prev => ({ ...prev, phone_number: res.error || "Invalid phone" }));
                    }}
                    error={!!validationErrors.phone_number}
                    lang={language}
                    placeholder="600000000"
                  />
                  {validationErrors.phone_number && (
                    <div className="h-3 text-xs leading-3 text-red-500">{t(validationErrors.phone_number as any) || validationErrors.phone_number}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {!showVerification && (
            <div className="p-6 border-t border-gray-100 flex items-center gap-3 bg-gray-50/50">
              <button
                onClick={() => {
                  setShowEditInfoModal(false);
                  setEditForm({ email: p.email || "", phone_number: p.phone_number || "" }); // Reset form on close
                }}
                className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                disabled={isSaving}
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex-1 py-3 bg-[#008E46] text-white rounded-xl font-bold hover:bg-[#007A3D] transition-colors shadow-lg shadow-[#008E46]/20 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t("profile.saving")}
                  </>
                ) : (
                  t("profile.save")
                )}
              </button>
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div
      style={{ minHeight: "100vh" }}
      className="px-3 pb-6 md:px-0 md:pb-0"
    >
      {/* ---------------- PERSONAL INFO ---------------- */}
      {/* ---------------- PERSONAL INFO ---------------- */}
      {showPersonal && (
        <div id="personal-info" className="scroll-mt-20 animate-fadeIn min-h-[60vh] flex flex-col items-center justify-center py-10">

          {/* Premium Header Section */}
          <div className="flex flex-col items-center text-center space-y-6 max-w-2xl mx-auto">

            {/* Profile Picture - Centered & Premium */}
            <div className="relative group cursor-pointer hover:scale-105 transition-transform duration-500 ease-out" onClick={() => setShowProfileModal(true)}>
              <div className="absolute inset-0 bg-gradient-to-tr from-[#008E46]/20 to-[#B8071C]/20 rounded-full blur-xl opacity-50 animate-pulse"></div>
              {p.profile_picture ? (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-2xl relative z-10 box-border ring-1 ring-slate-100">
                  <Image
                    src={p.profile_picture}
                    alt={p.username}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 rounded-full">
                    <span className="text-white text-xs font-bold uppercase tracking-widest bg-black/50 px-3 py-1 rounded-full backdrop-blur-md border border-white/20">{t("profile.edit_picture")}</span>
                  </div>
                </div>
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-[#008E46] to-[#007A3D] flex items-center justify-center text-5xl font-serif text-white border-4 border-white shadow-2xl relative z-10 ring-1 ring-slate-100">
                  {p.username?.charAt(0)?.toUpperCase() || "U"}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 rounded-full">
                    <span className="text-white text-xs font-bold uppercase tracking-widest bg-black/50 px-3 py-1 rounded-full backdrop-blur-md border border-white/20">{t("profile.edit_picture")}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Name & Title */}
            <div className="space-y-2">

              <h1 className="text-4xl md:text-6xl font-serif text-[#008E46] tracking-tight leading-none relative inline-block">
                {p.first_name || p.username} <span className="text-[#B8071C] italic">{p.last_name || ""}</span>
                <m.span
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="absolute -bottom-2 left-0 h-[2px] bg-[linear-gradient(to_right,transparent,#008E46,#B8071C,transparent)]"
                />
              </h1>
              <p className="text-lg md:text-xl text-slate-400 font-light font-serif tracking-wide">@{p.username}</p>
            </div>

            {/* Elegant Divider */}
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent my-8" />

            {/* Contact Details - Clean & Centered */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 w-full text-center">
              <div className="flex flex-col items-center group">
                <span className="text-xs font-bold text-[#B8071C] uppercase tracking-[0.2em] mb-2 group-hover:text-[#910515] transition-colors">{t("profile.email")}</span>
                <span className="text-xl md:text-2xl font-serif text-[#008E46] border-b border-transparent group-hover:border-slate-200 transition-all pb-1">{p.email}</span>
              </div>
              <div className="flex flex-col items-center group">
                <span className="text-xs font-bold text-[#B8071C] uppercase tracking-[0.2em] mb-2 group-hover:text-[#910515] transition-colors">{t("profile.phone")}</span>
                <span className="text-xl md:text-2xl font-serif text-[#008E46] border-b border-transparent group-hover:border-slate-200 transition-all pb-1">{p.phone_number || "—"}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-12">
              <button
                onClick={() => setShowEditInfoModal(true)}
                className="group relative px-8 py-3 bg-white text-[#008E46] border border-slate-200 rounded-xl hover:border-[#B8071C] hover:text-[#B8071C] transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <span className="relative flex items-center gap-2 font-serif text-lg">
                  <span>{t("profile.edit_button")}</span>
                  <Sparkles className="w-4 h-4" />
                </span>
              </button>
            </div>

          </div>

          {/* Fade-in Animation */}
          <style jsx global>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-fadeIn {
              animation: fadeIn 0.6s ease-out;
            }
          `}</style>
        </div>
      )}



      {/* ---------------- LISTINGS ---------------- */}
      {showListings && (
        <div id="listings" className="scroll-mt-20 animate-fadeIn py-10">
          <div className="w-full px-4 sm:px-6">
            <div className="mx-auto w-full max-w-[1400px]">
              {/* Premium Centered Header */}
              <div className="flex flex-col items-center text-center mb-10 space-y-2">
                <h1 className="text-4xl md:text-5xl font-serif text-[#008E46] relative">
                  <Sparkles className="w-4 h-4 text-[#B8071C] absolute -top-3 -left-1" />
                  <span className="relative inline-block">
                    {t("profile.my_listings")}
                    <m.span
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className="absolute -bottom-2 left-0 h-[2px] bg-gradient-to-r from-transparent via-[#008E46] to-transparent"
                    />
                  </span>
                  <span className="text-[#B8071C] text-2xl font-bold opacity-60 ml-2">
                    {auctionsState?.length || 0}
                  </span>
                </h1>
                <p className="text-gray-500 font-serif max-w-lg mx-auto">{t("profile.listings_subtitle")}</p>

                <div className="mt-4">
                  <Link
                    href={`/${language}/direct-sales/create`}
                    className="group relative inline-flex items-center gap-2 px-8 py-3 bg-[#B8071C] text-white rounded-full font-serif text-lg overflow-hidden shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="relative font-medium flex items-center gap-2">
                      <span className="text-xl">+</span> {t("profile.create_listing")}
                    </span>
                  </Link>
                </div>
              </div>

              <ListingsSection auctions={auctionsState} initialSubTab={targetSubTab} />
            </div>
          </div>
        </div>
      )}

      {/* ---------------- FAVORITES ---------------- */}
      {showFavorites && (
        <div id="favorites" className="scroll-mt-20 animate-fadeIn py-10">
          <div className="w-full px-4 sm:px-6">
            <div className="mx-auto w-full max-w-[1400px]">
              {/* Premium Centered Header */}
              <div className="flex flex-col items-center text-center mb-10 space-y-2">
                <h1 className="text-4xl md:text-5xl font-serif text-[#008E46] relative">
                  <Sparkles className="w-4 h-4 text-[#008E46] absolute -top-3 -left-1" />
                  <span className="relative inline-block">
                    {t("nav.my_favorites")}
                    <m.span
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className="absolute -bottom-2 left-0 h-[2px] bg-gradient-to-r from-transparent via-[#008E46] to-transparent"
                    />
                  </span>
                  <span className="text-[#B8071C] text-2xl font-bold opacity-60 ml-2">
                    {favoritesState?.length || 0}
                  </span>
                </h1>
                <p className="text-gray-500 font-serif max-w-lg mx-auto">{t("profile.favorites_subtitle")}</p>
              </div>
              <ListingsSection auctions={favoritesState} mode="watchlist" />
            </div>
          </div>
        </div>
      )}

      {/* ---------------- STATISTICS ---------------- */}
      {showStatistics && (
        <div id="statistics" className="scroll-mt-20 animate-fadeIn py-10">
          <div className="w-full px-4 sm:px-6">
            <div className="mx-auto w-full max-w-[1400px]">
              <StatisticsSection userId={userId} />
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal (Picture Upload) */}
      {showProfileModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100005] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowProfileModal(false)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold font-serif text-gray-900">{t("nav.profile")}</h3>
            </div>

            {/* Image Preview */}
            <div className="aspect-square w-full bg-gray-50 relative overflow-hidden flex items-center justify-center">
              {p.profile_picture ? (
                <Image
                  src={p.profile_picture}
                  alt={p.username}
                  width={400}
                  height={400}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-[#B8071C] flex items-center justify-center text-5xl font-bold text-white shadow-xl">
                  {p.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>

            {/* Modal Footer (Actions) */}
            <div className="p-4 space-y-3">
              <ProfilePictureUpload
                userId={userId}
                currentPicture={p.profile_picture || null}
              >
                <div className="w-full py-3 px-4 bg-[#B8071C] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#910515] transition-colors shadow-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  {t("profile.change_photo")}
                </div>
              </ProfilePictureUpload>
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Info Modal (Email & Phone) */}
      {renderEditInfoModal()}
    </div>
  );

}
