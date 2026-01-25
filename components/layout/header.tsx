"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";
import { LuxuryLoader } from "@/components/ui/luxury-loader";

// Components
import { LanguageSwitcher } from "./header/language-switcher";
import { AuthButtons } from "./header/auth-buttons";
import { UserMenu } from "./header/user-menu";
import { HeaderNotifications } from "./header/header-notifications";
import { MobileNav } from "./header/mobile-nav";
import { DesktopNav } from "./header/desktop-nav";
import { SellMegaMenu } from "./header/sell-mega-menu";

// Logic
import { useHeaderLogic } from "./header/use-header-logic";

// Types
import { HeaderProps } from "./header/types";

// Dynamically load notifications panel to reduce header initial bundle
const DynamicNotificationsPanel = React.lazy(() => import("./header-notifications-panel"));

function HeaderContent({ initialLoggedIn }: HeaderProps) {
	const logic = useHeaderLogic();
	const {
		authUser,
		serverUser,
		hydrated,
		authCheckCompleted,
		isLoggingOut,
		authDisabledFlag,
		localProfilePic,
		notifOpen,
		menuOpen,
		sellDropdownOpen,
		profileDropdownOpen,
		languageOpen,
		mobileLangOpen,
		expandedSellItem,
		notifications,
		unreadCount,
		loadingNotifs,
		isRTL,
		language,
		pathname,
		router,
		t,
		setNotifOpen,
		setMenuOpen,
		setSellDropdownOpen,
		setProfileDropdownOpen,
		setLanguageOpen,
		setMobileLangOpen,
		setExpandedSellItem,
		setLanguage,
		handleFullLogout,
		fetchNotifications,
		markAsRead,
		markAllAsRead,
		handleCreateClick,
		handleSellMouseEnter,
		handleSellMouseLeave,
		sellNavItems,
		isSellActive,
		isAuctionsActive,
		sellDropdownRef,
		panelRef,
		notifPanelRef,
		btnRef,
		headerRef,
		profileDropdownRef,
		languageDropdownRef,
		stablePicRef,
	} = logic;

	// Only show authenticated specialized UI if we have evidence of a session
	// Start with initialLoggedIn for SSR consistency
	const [serverAuthVerified] = React.useState(!!initialLoggedIn);
	const isAuthenticated = !!(authUser || serverUser || serverAuthVerified);
	const showAuthenticatedUI = hydrated && isAuthenticated && !authDisabledFlag;

	// Derived values for UserMenu
	const effectiveUser = serverUser || authUser;
	const effectiveName = serverUser?.first_name || authUser?.name || "";
	const effectiveInitial = serverUser?.initial || (effectiveName ? effectiveName.charAt(0).toUpperCase() : "");

	let ProfileSlot = null;
	if (showAuthenticatedUI) {
		ProfileSlot = (
			<UserMenu
				language={language}
				t={t}
				serverUser={serverUser}
				authUser={authUser}
				profileDropdownOpen={profileDropdownOpen}
				setProfileDropdownOpen={setProfileDropdownOpen}
				handleCreateClick={handleCreateClick}
				handleFullLogout={handleFullLogout}
				expandedSellItem={expandedSellItem}
				setExpandedSellItem={setExpandedSellItem}
				dropdownRef={profileDropdownRef}
				stablePicRef={stablePicRef}
				localProfilePic={localProfilePic}
				setLocalProfilePic={logic.setLocalProfilePic}
				effectiveInitial={effectiveInitial}
				effectiveName={effectiveName}
				effectiveUser={effectiveUser}
				isAuthenticated={isAuthenticated}
				setNotifOpen={setNotifOpen}
				router={router}
				isRTL={isRTL}
				getStoredProfilePic={() => logic.stablePicRef.current}
			/>
		);
	} else {
		ProfileSlot = (
			<div className="flex items-center gap-3 bg-white/50 backdrop-blur px-1 rounded-full">
				<Link href={`/${language}/auth/login`} className="px-4 py-2 rounded-full text-[14px] font-semibold text-[#1e2a5e] hover:text-[#B8071C] hover:bg-[#1e2a5e]/5 transition-colors">{t("nav.signin")}</Link>
			</div>
		);
	}

	const GuestContent = <AuthButtons language={language} t={t} />;

	const clientRender = isLoggingOut ? (
		<div className="flex items-center gap-3 bg-white/50 backdrop-blur px-4 py-2 rounded-full">
			<LuxuryLoader size="sm" />
			<span className="text-[14px] font-medium text-gray-500 font-serif">{t("common.loading")}</span>
		</div>
	) : showAuthenticatedUI ? (
		<>
			<HeaderNotifications
				language={language}
				unreadCount={unreadCount}
				notifOpen={notifOpen}
				setNotifOpen={setNotifOpen}
				fetchNotifications={fetchNotifications}
				notifications={notifications}
				loadingNotifs={loadingNotifs}
				markAsRead={markAsRead}
				markAllAsRead={markAllAsRead}
				clientAuth={isAuthenticated}
				authUser={authUser}
				serverUser={serverUser}
				router={router}
				panelRef={panelRef}
				btnRef={btnRef}
				notifPanelRef={notifPanelRef}
				DynamicNotificationsPanel={DynamicNotificationsPanel}
			/>
			{ProfileSlot}
		</>
	) : GuestContent;

	return (
		<>
			<header
				ref={headerRef}
				className="bg-white/95 backdrop-blur-md border-b border-gray-100 supports-[backdrop-filter]:bg-white/80"
				dir={isRTL ? "rtl" : "ltr"}
				style={{
					background: "rgba(255, 255, 255, 0.95)",
					position: "fixed",
					top: 0,
					left: 0,
					right: 0,
					zIndex: 100000,
					height: "var(--site-header-height, 76px)",
					willChange: "transform",
					transform: "translateZ(0)",
					backfaceVisibility: "hidden",
				}}
			>
				<div className="w-full px-6 lg:px-12 xl:px-20 2xl:px-28">
					<div className="flex items-center h-[76px] w-full lg:hidden">
						<div className="grid grid-cols-[1fr_auto_1fr] items-center w-full relative">
							{/* Left Slot: Menu */}
							<div className="flex items-center justify-start">
								<button
									className="p-3 -ms-3 md:-ms-4 rounded-md text-[#DEB735] hover:text-[#B8071C] hover:bg-gold/5 transition-colors w-16 h-16 md:w-22 md:h-22 flex items-center justify-center"
									aria-label="Menu"
									aria-expanded={menuOpen}
									type="button"
									onClick={() => setMenuOpen(true)}
								>
									<svg viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-6 md:w-12 md:h-9">
										<rect x="0" y="1" width="20" height="2" rx="1" fill="currentColor" />
										<rect x="0" y="7" width="20" height="2" rx="1" fill="currentColor" />
										<rect x="0" y="13" width="20" height="2" rx="1" fill="currentColor" />
									</svg>
								</button>
							</div>

							{/* Center Slot: Logo */}
							<Link href={`/${language}`} className="flex items-center justify-center pointer-events-auto h-20 w-auto overflow-hidden">
								<Image
									src="/logo.png"
									alt="Karkey Logo"
									width={240}
									height={80}
									className="h-20 w-auto object-contain scale-[1.8] md:scale-[2.4] translate-y-3.5 md:translate-y-5.5"
									priority
								/>
							</Link>

							{/* Right Slot: Auth/Profile */}
							<div className="flex items-center justify-end" suppressHydrationWarning>
								{showAuthenticatedUI ? ProfileSlot : GuestContent}
							</div>
						</div>
					</div>

					<div className="hidden lg:flex items-center h-[76px] w-full">
						<Link href={`/${language}`} className="flex items-center group transition-transform hover:scale-110 duration-300 overflow-hidden h-[76px]">
							<Image
								src="/logo.png"
								alt="Karkey Logo"
								width={320}
								height={120}
								className="h-28 w-auto object-contain scale-[1.35] translate-y-2.5"
								priority
							/>
						</Link>

						<DesktopNav
							language={language}
							t={t}
							pathname={pathname}
							handleSellMouseEnter={handleSellMouseEnter}
							handleSellMouseLeave={handleSellMouseLeave}
							sellDropdownOpen={sellDropdownOpen}
							isSellActive={isSellActive}
							isAuctionsActive={isAuctionsActive}
						/>

						<div className="hidden md:flex items-center gap-2 header-actions ms-auto">
							<LanguageSwitcher
								language={language}
								languageOpen={languageOpen}
								setLanguageOpen={setLanguageOpen}
								setLanguage={setLanguage}
								setProfileDropdownOpen={setProfileDropdownOpen}
								setNotifOpen={setNotifOpen}
								pathname={pathname}
								router={router}
								isRTL={isRTL}
								dropdownRef={languageDropdownRef}
							/>

							<div suppressHydrationWarning className="flex items-center gap-4">
								{clientRender}
							</div>
						</div>
					</div>
				</div>
			</header>

			<SellMegaMenu
				sellDropdownOpen={sellDropdownOpen}
				handleSellMouseEnter={handleSellMouseEnter}
				handleSellMouseLeave={handleSellMouseLeave}
				sellNavItems={sellNavItems ?? {}}
				setSellDropdownOpen={setSellDropdownOpen}
			/>

			<MobileNav
				language={language}
				t={t}
				menuOpen={menuOpen}
				setMenuOpen={setMenuOpen}
				mobileLangOpen={mobileLangOpen}
				setMobileLangOpen={setMobileLangOpen}
				isAuthenticated={isAuthenticated}
				hasCachedUser={!!serverUser}
				shouldShowAuthButtons={!isAuthenticated && authCheckCompleted}
				effectiveName={effectiveName}
				effectiveInitial={effectiveInitial}
				handleFullLogout={handleFullLogout}
				pathname={pathname}
				router={router}
				setLanguage={setLanguage}
				stablePicRef={stablePicRef}
				localProfilePic={localProfilePic}
				serverUser={serverUser}
			/>
		</>
	);
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
	constructor(props: any) {
		super(props);
		this.state = { hasError: false };
	}
	static getDerivedStateFromError() {
		return { hasError: true };
	}
	componentDidCatch(error: any, info: any) {
		console.error("[Header] caught error:", error, info);
	}
	render() {
		if (this.state.hasError) {
			return (
				<header className="bg-white border-b border-[#ececec]" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100000 }}>
					<div className="max-w-7xl 3xl:max-w-[1800px] tv:max-w-[2200px] 4xl:max-w-[2600px] mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex items-center justify-between h-[76px]">
							<span className="flex items-center cursor-pointer" onClick={() => (window as any).location.href = '/'}>
								<span className="font-display text-[26px] font-extrabold text-[#B8071C]">Karkey</span>
							</span>
						</div>
					</div>
				</header>
			);
		}
		return this.props.children;
	}
}

export default function Header({ initialLoggedIn }: { initialLoggedIn?: boolean }) {
	const MemoHeaderContent = React.memo(HeaderContent);
	return (
		<ErrorBoundary>
			<MemoHeaderContent initialLoggedIn={initialLoggedIn} />
		</ErrorBoundary>
	);
}
