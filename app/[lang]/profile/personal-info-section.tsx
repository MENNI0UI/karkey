"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { User, Mail, Phone, MapPin, Globe2, Edit2, LogOut } from "lucide-react";

export type Profile = {
  id?: number;
  username: string;
  email: string;
  full_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  bio?: string;
  profile_picture?: string;
};

type Props = {
  profile: Profile;
  userId: number;
  successFlag?: boolean;
};

export default function PersonalInfoSection({ profile, userId, successFlag }: Props) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile);
  const [loading, setLoading] = useState(false);
  const { user: authUser } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...formData }),
      });

      if (response.ok) {
        setIsEditing(false);
        window.location.href = "/profile?success=true";
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // FAST-PATH: ensure header updates immediately when viewing profile page.
  // Store profile picture + user id in localStorage and dispatch auth:changed so Header picks it up.
  useEffect(() => {
    try {
      const pic = profile?.profile_picture ?? null;
      const uid = profile?.id ?? userId ?? null;
      // Only write the `auth_profile_*` fast-path when the viewed profile belongs
      // to the current authenticated user. Avoid overwriting the header's auth
      // fast-path when viewing another user's profile.
      try {
        const authUser = (window as any).__initialAuthUser ?? null;
      } catch { }
      // useAuth is a client hook; obtain current auth user if available
      try {
        // lazy require/useAuth to avoid hydration issues
      } catch { }
      // We'll check auth context below (fallback to not setting if unknown)
      try {
        const currentAuth = (window as any).__auth_user ?? null
      } catch { }
      // Prefer checking via auth context when available
      const isOwnProfile = !!(authUser && uid && Number((authUser as any).id) === Number(uid));
      if (pic && uid && isOwnProfile) {
        try {
          localStorage.setItem("auth_profile_picture", String(pic));
          localStorage.setItem("auth_profile_userid", String(uid));
        } catch { }
        try {
          window.dispatchEvent(
            new CustomEvent("auth:changed", {
              detail: { action: "profile-sync", user: { id: uid, profile_picture: pic }, url: pic, userId: uid },
            })
          );
        } catch { }
      } else {
        // Do not override auth fast-path when viewing another user's profile.
        // Keep per-profile cached entries (`profile:picture:${uid}`) handled elsewhere.
      }
    } catch { }
  }, [profile?.profile_picture, profile?.id, userId]);

  return (
    <section className="w-full max-w-3xl mx-auto px-4 py-10 flex flex-col items-center relative">
      {/* زر تعديل دائري أعلى يمين */}
      {!isEditing && (
        <Button
          onClick={() => setIsEditing(true)}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#B8071C] hover:bg-[#910515] text-white shadow-lg flex items-center justify-center"
          title={t("profile.edit")}
          aria-label={t("profile.edit")}
        >
          <Edit2 className="w-5 h-5" />
        </Button>
      )}

      {/* عنوان الصفحة وتحية */}
      <div className="w-full text-center mb-2">
        <h2 className="text-2xl font-bold font-serif text-[#B8071C] mb-1">{t("profile.personal_info")}</h2>
        <p className="text-lg text-[#717171] font-bold font-serif mb-2">Good Morning {profile.full_name || profile.username}!</p>
      </div>

      {/* المعلومات بشكل Grid منظم مع صورة في المنتصف */}
      {!isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-16 gap-y-8 w-full items-start">
          {/* يسار: Email */}
          <InfoCard icon={<Mail className="w-5 h-5" />} label={t("profile.email")} value={profile.email || "—"} valueClassName="professional-font" />
          {/* الوسط: صورة البروفايل */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-28 h-28 rounded-full overflow-hidden shadow-lg border-4 border-[#d1f2e1] bg-white mx-auto">
              {profile.profile_picture ? (
                <Image src={profile.profile_picture} alt={profile.username} fill className="object-cover" unoptimized priority />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold bg-[#B8071C] text-white">
                  {profile.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            <h3 className="font-bold text-xl font-serif text-[#B8071C] mt-3 text-center">{profile.username}</h3>
          </div>
          {/* يمين: Phone */}
          <InfoCard icon={<Phone className="w-5 h-5" />} label={t("profile.phone")} value={profile.phone || "—"} valueClassName="professional-font" />

          {/* صف ثانٍ: الاسم، المدينة، الدولة */}
          <InfoCard icon={<User className="w-5 h-5" />} label={t("profile.full_name")} value={profile.full_name || "—"} />
          <InfoCard icon={<Globe2 className="w-5 h-5" />} label={t("profile.city")} value={profile.city || "—"} />
          <InfoCard icon={<Globe2 className="w-5 h-5" />} label={t("profile.country")} value={profile.country || "—"} />

          {/* صف ثالث: العنوان بعرض كامل */}
          <div className="md:col-span-3">
            <InfoCard icon={<MapPin className="w-5 h-5" />} label={t("profile.address")} value={profile.address || "—"} />
          </div>

          {/* صف أخير: Bio بعرض كامل */}
          <div className="md:col-span-3">
            <InfoCard icon={<Mail className="w-5 h-5" />} label={t("profile.bio")} value={profile.bio || "—"} />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 w-full items-start mt-2">
          {/* الحقول في الأعلى */}
          <div>
            <Label htmlFor="full_name" className="text-sm text-[#B8071C]">{t("profile.full_name")}</Label>
            <Input
              id="full_name"
              name="full_name"
              value={formData.full_name || ""}
              onChange={handleChange}
              className="rounded-xl border-[#d1f2e1] focus:border-[#B8071C] focus:ring-[#B8071C]"
            />
          </div>
          <div>
            <Label htmlFor="phone" className="text-sm text-[#B8071C]">{t("profile.phone")}</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone || ""}
              onChange={handleChange}
              className="rounded-xl border-[#d1f2e1] focus:border-[#B8071C] focus:ring-[#B8071C]"
            />
          </div>
          {/* صورة البروفايل في منتصف الشبكة */}
          <div className="md:col-span-2 flex flex-col items-center justify-center my-2">
            <div className="relative w-28 h-28 rounded-full overflow-hidden shadow-lg border-4 border-[#d1f2e1] bg-white mb-2 mx-auto">
              {profile.profile_picture ? (
                <Image
                  src={profile.profile_picture}
                  alt={profile.username}
                  fill
                  className="object-cover"
                  unoptimized
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white" style={{ backgroundColor: "#B8071C" }}>
                  {profile.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            <h3 className="font-bold text-xl text-[#B8071C] mt-2">{profile.username}</h3>
            <p className="text-xs text-[#717171]">{profile.email}</p>
          </div>
          {/* باقي الحقول */}
          <div>
            <Label htmlFor="address" className="text-sm text-[#B8071C]">{t("profile.address")}</Label>
            <Input
              id="address"
              name="address"
              value={formData.address || ""}
              onChange={handleChange}
              className="rounded-xl border-[#d1f2e1] focus:border-[#B8071C] focus:ring-[#B8071C]"
            />
          </div>
          <div>
            <Label htmlFor="city" className="text-sm text-[#B8071C]">{t("profile.city")}</Label>
            <Input
              id="city"
              name="city"
              value={formData.city || ""}
              onChange={handleChange}
              className="rounded-xl border-[#d1f2e1] focus:border-[#B8071C] focus:ring-[#B8071C]"
            />
          </div>
          <div>
            <Label htmlFor="country" className="text-sm text-[#B8071C]">{t("profile.country")}</Label>
            <Input
              id="country"
              name="country"
              value={formData.country || ""}
              onChange={handleChange}
              className="rounded-xl border-[#d1f2e1] focus:border-[#B8071C] focus:ring-[#B8071C]"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="bio" className="text-sm text-[#B8071C]">{t("profile.bio")}</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio || ""}
              onChange={handleChange}
              rows={3}
              className="rounded-xl border-[#cfe0ff] focus:border-[#B8071C] focus:ring-[#B8071C]"
            />
          </div>
          {/* زر الحفظ والإلغاء */}
          <div className="md:col-span-2 flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData(profile);
                setIsEditing(false);
              }}
              disabled={loading}
              className="rounded-xl border-[#d1f2e1] hover:bg-white text-[#B8071C]"
            >
              {t("profile.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#B8071C] hover:bg-[#910515] text-white rounded-xl px-5 py-2 font-medium shadow"
            >
              {loading ? t("profile.saving") : t("profile.save")}
            </Button>
          </div>
        </form>
      )}

      {/* زر تسجيل خروج أسفل البطاقة */}
      <div className="w-full flex justify-center mt-8">
        <Button
          onClick={() => {
            // حذف التخزين المحلي قبل إعادة التحميل
            try {
              localStorage.removeItem("auth_token");
              localStorage.removeItem("auth_profile_picture");
              localStorage.removeItem("auth_profile_userid");
              localStorage.setItem("auth:disabled", "1");
              localStorage.setItem("auth:logout", String(Date.now()));
            } catch { }
            fetch("/api/auth/logout", { method: "POST" }).then(() => {
              // إجبار إعادة تحميل كاملة للصفحة
              window.location.reload();
            });
          }}
          className="flex items-center gap-2 px-6 py-2 rounded-xl bg-[#B8071C] text-white hover:bg-[#910515] font-semibold shadow"
        >
          <LogOut className="h-5 w-5" />
          {t("profile.logout")}
        </Button>
      </div>
    </section>
  );
}

// بطاقة معلومة واحدة بشكل جميل
function InfoCard({
  icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-4 rounded-2xl bg-[#f2faf5] shadow-sm border border-[#d1f2e1] w-full">
      <span className="text-[#B8071C]">{icon}</span>
      <div>
        <div className="text-xs text-[#B8071C] font-semibold">{label}</div>
        <div className={`text-base text-[#B8071C] font-medium ${valueClassName ?? ""}`}>{value}</div>
      </div>
    </div>
  );
}
