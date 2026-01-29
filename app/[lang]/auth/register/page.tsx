"use client"

import React, { useState, useRef, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { registerUser } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Check, ChevronRight, ChevronLeft, X, AlertCircle, Eye, EyeOff } from "lucide-react"
import { validateUsername, validateEmail, validatePassword, validatePhoneInternational, validateName, validateUserType } from "@/lib/validations"
import { safeStringCompare } from "@/lib/security-utils"
import Image from "next/image"
import { useTranslation } from "@/lib/i18n-context"
import { EmailVerification } from "@/components/auth/email-verification"
import { PhoneInput } from "@/components/ui/phone-input"

export default function RegisterPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const params = useParams()
  const lang = (params?.lang as string) || "en"
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)
  const [emailVerified, setEmailVerified] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Debounce timer ref for username check
  const usernameDebounceRef = useRef<NodeJS.Timeout | null>(null)
  // Debounce timer ref for email check
  const emailDebounceRef = useRef<NodeJS.Timeout | null>(null)

  // Helper to translate validation error keys
  const tv = (key: string) => {
    if (!key) return ""
    // If it's a translation key (starts with "validation."), translate it
    if (key.startsWith("validation.")) {
      return t(key as any)
    }
    return key
  }

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone_number: "+212",
    prenom: "",
    nom: "",
    user_type: "individual",
  })

  // Consent checkbox state
  const [consentTerms, setConsentTerms] = useState(false)

  // Check username availability in database with debounce
  const checkUsernameAvailability = useCallback((username: string) => {
    // Clear previous timer
    if (usernameDebounceRef.current) {
      clearTimeout(usernameDebounceRef.current)
    }

    // First validate format immediately
    const formatResult = validateUsername(username)
    if (!formatResult.isValid) {
      setUsernameAvailable(null)
      if (username.length > 0) {
        setValidationErrors((prev) => ({ ...prev, username: formatResult.error! }))
      }
      return
    }

    // Clear format error if valid
    setValidationErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors.username
      return newErrors
    })

    // Debounce the API call (300ms delay)
    setCheckingUsername(true)
    usernameDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`)
        const data = await res.json()

        if (data.available) {
          setUsernameAvailable(true)
          setValidationErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors.username
            return newErrors
          })
        } else {
          setUsernameAvailable(false)
          setValidationErrors((prev) => ({ ...prev, username: t("auth.register.username_taken") }))
        }
      } catch {
        // On error, don't block - let server validate on submit
        setUsernameAvailable(null)
      } finally {
        setCheckingUsername(false)
      }
    }, 300)
  }, [t])

  // Check email availability in database with debounce
  const checkEmailAvailability = useCallback((email: string) => {
    // Clear previous timer
    if (emailDebounceRef.current) {
      clearTimeout(emailDebounceRef.current)
    }

    // First validate format immediately
    const formatResult = validateEmail(email)
    if (!formatResult.isValid) {
      setEmailAvailable(null)
      if (email.length > 0) {
        setValidationErrors((prev) => ({ ...prev, email: formatResult.error! }))
      }
      return
    }

    // Clear format error if valid
    setValidationErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors.email
      return newErrors
    })

    // Debounce the API call (300ms delay)
    setCheckingEmail(true)
    emailDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`)
        const data = await res.json()

        if (data.available) {
          setEmailAvailable(true)
          setValidationErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors.email
            return newErrors
          })
        } else {
          setEmailAvailable(false)
          setValidationErrors((prev) => ({ ...prev, email: t("auth.register.email_taken") }))
        }
      } catch {
        // On error, don't block - let server validate on submit
        setEmailAvailable(null)
      } finally {
        setCheckingEmail(false)
      }
    }, 300)
  }, [t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] ========== FORM SUBMISSION STARTED ==========")
    console.log("[v0] Current form data:", {
      email: formData.email,
      phone: formData.phone_number,
      prenom: formData.prenom,
      nom: formData.nom,
      user_type: formData.user_type,
    })

    const finalErrors: Record<string, string> = {}

    // Validate personal info
    const firstNameValid = validateName(formData.prenom, "First name")
    const lastNameValid = validateName(formData.nom, "Last name")
    const userTypeValid = validateUserType(formData.user_type)
    const phoneValid = validatePhoneInternational(formData.phone_number)

    if (!firstNameValid.isValid) finalErrors.prenom = firstNameValid.error!
    if (!lastNameValid.isValid) finalErrors.nom = lastNameValid.error!
    if (!userTypeValid.isValid) finalErrors.user_type = userTypeValid.error!
    if (!phoneValid.isValid) finalErrors.phone_number = phoneValid.error!

    if (!consentTerms) {
      finalErrors.consent = "validation.consent_required"
    }

    if (Object.keys(finalErrors).length > 0) {
      console.log("[v0] ❌ Validation failed:", finalErrors)
      setValidationErrors(finalErrors)
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("[v0] Calling registerUser server action...")
      const dataToSend = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phone_number: formData.phone_number,
        prenom: formData.prenom,
        nom: formData.nom,
        user_type: formData.user_type,
      }

      console.log("[v0] Data being sent:", {
        ...dataToSend,
        password: "***REDACTED***",
        confirmPassword: "***REDACTED***",
      })

      const result = await registerUser(dataToSend)

      console.log("[v0] Registration result:", result)

      if (result.success) {
        console.log("[v0] ✅ Registration successful!")

        // Auto-login using NextAuth
        const { signIn } = await import("next-auth/react")
        const loginResult = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        })

        if (loginResult?.error) {
          console.error("[v0] ❌ Auto-login failed after registration:", loginResult.error)
          window.location.href = "/auth/login?error=auto_login_failed"
          return
        }

        console.log("[v0] ✅ Auto-login successful!")

        // Notify other windows/components
        try {
          window.dispatchEvent(new CustomEvent("auth:changed", {
            detail: { action: "login" }
          }))
        } catch { }

        // Navigate to the redirect (server suggested) or home
        if (result.redirect) {
          window.location.href = result.redirect
        } else {
          window.location.href = "/"
        }
      } else {
        console.log("[v0] ❌ Registration failed")
        const resultError = (result as any).error
        console.log("[v0] Error message:", resultError)
        const errorMsg = typeof resultError === 'object' && resultError?.message
          ? resultError.message
          : (typeof resultError === 'string' ? resultError : "Registration failed. Please try again.")
        setError(errorMsg)
      }
    } catch (err) {
      const error = err as any
      console.error("[v0] ❌ CRITICAL ERROR during registration:", error)
      setError(error?.message || "An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
      console.log("[v0] ========== FORM SUBMISSION ENDED ==========")
    }
  }

  const handleChange = (field: string, value: string) => {
    let nextValue: string = value

    if (field === "prenom" || field === "nom") {
      // Collapse excessive whitespace
      nextValue = value.replace(/\s+/g, " ")
    }

    setFormData((prev) => {
      const newFormData = { ...prev, [field]: nextValue }

      // Real-time validation for confirmPassword when password changes
      if (field === "password" && prev.confirmPassword) {
        // Re-validate confirm password against the new password
        if (nextValue !== prev.confirmPassword) {
          setValidationErrors((prevErrors) => ({ ...prevErrors, confirmPassword: "validation.password_mismatch" }))
        } else {
          setValidationErrors((prevErrors) => {
            const newErrors = { ...prevErrors }
            delete newErrors.confirmPassword
            return newErrors
          })
        }
      }

      // Real-time validation for confirmPassword field itself
      if (field === "confirmPassword") {
        if (nextValue && !safeStringCompare(nextValue, prev.password)) {
          setValidationErrors((prevErrors) => ({ ...prevErrors, confirmPassword: "validation.password_mismatch" }))
        } else if (safeStringCompare(nextValue, prev.password)) {
          setValidationErrors((prevErrors) => {
            const newErrors = { ...prevErrors }
            delete newErrors.confirmPassword
            return newErrors
          })
        }
      }

      return newFormData
    })

    // Clear validation error for this field (except confirmPassword which is handled above)
    if (field !== "confirmPassword") {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    // Validate only when we have a minimally complete value (avoid noisy errors while typing)
    if (field === "phone_number") {
      if (nextValue.length === "+212".length + 9) validateField(field, nextValue)
    } else if (field !== "confirmPassword") {
      // confirmPassword is handled above in setFormData
      validateField(field, nextValue)
    }
  }

  const validateField = (field: string, value: string) => {
    let result
    switch (field) {
      case "prenom":
        result = validateName(value, "First name")
        break
      case "nom":
        result = validateName(value, "Last name")
        break
      case "username":
        result = validateUsername(value)
        break
      case "email":
        result = validateEmail(value)
        break
      case "password":
        result = validatePassword(value)
        break
      case "phone_number":
        result = validatePhoneInternational(value)
        break
      case "user_type":
        result = validateUserType(value)
        break
      case "confirmPassword":
        if (!safeStringCompare(value, formData.password)) {
          result = { isValid: false, error: "validation.password_mismatch" }
        } else {
          result = { isValid: true }
        }
        break
      default:
        return
    }

    if (!result.isValid && result.error) {
      setValidationErrors((prev) => ({ ...prev, [field]: result.error! }))
    }
  }

  const nextStep = () => {
    if (currentStep === 1) {
      const usernameValid = validateUsername(formData.username)
      const emailValid = validateEmail(formData.email)
      const passwordValid = validatePassword(formData.password)
      const passwordsMatch = formData.password === formData.confirmPassword

      const errors: Record<string, string> = {}
      if (!usernameValid.isValid) errors.username = usernameValid.error!
      if (!emailValid.isValid) errors.email = emailValid.error!
      if (!passwordValid.isValid) errors.password = passwordValid.error!
      if (!passwordsMatch) errors.confirmPassword = "Passwords do not match"

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors)
        return
      }
    }

    // Step 2 is email verification - handled by EmailVerification component

    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const canProceedStep1 =
    formData.username && formData.email && formData.password && formData.confirmPassword && formData.phone_number.length > 4
  const canSubmit = formData.prenom && formData.nom && formData.user_type && consentTerms

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Left Side - Branding Image (Fixed) */}
      <div className="hidden lg:block fixed top-0 left-0 h-full w-1/2 bg-[#111] overflow-hidden z-0">
        <Image
          src="/images/car.jpg"
          alt="Luxury Car"
          layout="fill"
          objectFit="cover"
          className="opacity-90"
          priority
        />
        <div className="absolute inset-0 bg-[#B8071C]/20 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 p-12 text-white z-10">
          <Link href={`/${lang}`} className="inline-block mb-6 group transition-transform hover:scale-110 duration-300">
            <Image
              src="/logo.png"
              alt="Karkey Logo"
              width={320}
              height={120}
              className="h-28 w-auto object-contain brightness-0 invert scale-[1.35]"
              priority
            />
          </Link>
          <h2 className="text-3xl font-bold mb-4 leading-tight">
            Join the Future of <br /> Car Trading
          </h2>
          <p className="text-gray-200 text-lg max-w-md">
            Experience a secure, transparent, and premium way to buy and sell vehicles in Morocco.
          </p>
        </div>
      </div>

      {/* Right Side - Registration Form (Scrollable) */}
      <div className="w-full lg:fixed lg:top-0 lg:right-0 lg:h-full lg:w-1/2 lg:overflow-y-auto flex flex-col p-4 md:p-8 lg:p-8 bg-white relative z-10">
        <Link href={`/${lang}`} aria-label="Karkey home" className="lg:hidden absolute top-6 right-6">
          <X className="w-6 h-6 text-gray-400" />
        </Link>

        <div className="max-w-3xl mx-auto w-full my-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-12 text-center flex justify-center">
            <Link href={`/${lang}`} className="inline-block transform active:scale-95 transition-transform">
              <Image
                src="/logo.png"
                alt="Karkey Logo"
                width={240}
                height={80}
                className="h-20 w-auto object-contain scale-[1.7]"
              />
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold font-serif text-[#103090] mb-2 font-serif">
              {currentStep === 1 && t("auth.register.step1")}
              {currentStep === 2 && t("auth.register.step2")}
              {currentStep === 3 && t("auth.register.step3")}
            </h2>
            <p className="text-[#717171] font-serif">
              {t("auth.register.subtitle")}
            </p>
          </div>

          {/* Progress Bar - 3 steps now */}
          <div className="flex items-center justify-between mb-8 relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-[#ececec] -z-10 rounded-full" />
            <div
              className="absolute top-1/2 left-0 h-1 bg-[#B8071C] -z-10 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
            />

            {[1, 2, 3].map((step) => (
              <div key={step} className={`flex flex-col items-center bg-white px-2 font-serif`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ${currentStep >= step ? "bg-[#B8071C] text-white" : "bg-gray-200 text-gray-500"
                  }`}>
                  {currentStep > step ? <Check className="w-4 h-4" /> : step}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert className="bg-destructive/10 border-destructive/20 rounded-xl">
                <AlertDescription className="text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {tv(error)}
                </AlertDescription>
              </Alert>
            )}

            {/* Step 1: Account Info */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#222222] font-serif">{t("auth.register.username")}</label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="johndoe123"
                      value={formData.username}
                      onChange={(e) => {
                        const value = e.target.value
                        handleChange("username", value)
                        // Real-time validation with debounced API check
                        if (value.length >= 3) {
                          checkUsernameAvailability(value)
                        } else {
                          setUsernameAvailable(null)
                          if (value.length > 0) {
                            const result = validateUsername(value)
                            if (!result.isValid) {
                              setValidationErrors((prev) => ({ ...prev, username: result.error! }))
                            }
                          }
                        }
                      }}
                      onBlur={(e) => {
                        validateField("username", e.target.value)
                      }}
                      className={`h-12 rounded-lg border-gray-200 focus:border-[#B8071C] focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-4 focus:ring-[#B8071C]/10 pe-10 font-serif ${validationErrors.username ? "border-red-500" : usernameAvailable === true ? "border-green-500" : ""
                        }`}
                    />
                    {/* Status indicator */}
                    <div className="absolute end-3 top-1/2 -translate-y-1/2">
                      {checkingUsername ? (
                        <div className="w-4 h-4 border-2 border-[#B8071C] border-t-transparent rounded-full animate-spin" />
                      ) : usernameAvailable === true ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : usernameAvailable === false ? (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      ) : null}
                    </div>
                  </div>
                  <div className={`h-3 text-xs leading-3 ${usernameAvailable === true ? "text-green-500" : "text-red-500"}`}>
                    {tv(validationErrors.username) || (usernameAvailable === true ? t("auth.register.username_available") : "")}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#222222] font-serif">{t("auth.register.email")}</label>
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => {
                        const value = e.target.value
                        handleChange("email", value)
                        // Real-time validation with debounced API check
                        if (value.includes("@") && value.includes(".")) {
                          checkEmailAvailability(value)
                        } else {
                          setEmailAvailable(null)
                          if (value.length > 0) {
                            const result = validateEmail(value)
                            if (!result.isValid) {
                              setValidationErrors((prev) => ({ ...prev, email: result.error! }))
                            }
                          }
                        }
                      }}
                      onBlur={(e) => validateField("email", e.target.value)}
                      className={`h-12 rounded-lg border-gray-200 focus:border-[#B8071C] focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-4 focus:ring-[#B8071C]/10 pe-10 font-serif ${validationErrors.email ? "border-red-500" : emailAvailable === true ? "border-green-500" : ""
                        }`}
                    />
                    {/* Status indicator */}
                    <div className="absolute end-3 top-1/2 -translate-y-1/2">
                      {checkingEmail ? (
                        <div className="w-4 h-4 border-2 border-[#B8071C] border-t-transparent rounded-full animate-spin" />
                      ) : emailAvailable === true ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : emailAvailable === false ? (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      ) : null}
                    </div>
                  </div>
                  <div className={`h-3 text-xs leading-3 ${emailAvailable === true ? "text-green-500" : "text-red-500"}`}>
                    {tv(validationErrors.email) || (emailAvailable === true ? t("auth.register.email_available") : "")}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#222222] font-serif">{t("auth.register.phone")}</label>
                  <PhoneInput
                    value={formData.phone_number}
                    onChange={(value) => handleChange("phone_number", value)}
                    onBlur={() => validateField("phone_number", formData.phone_number)}
                    error={!!validationErrors.phone_number}
                    lang={lang}
                    placeholder="600000000"
                  />
                  <div className="h-3 text-xs leading-3 text-red-500">{tv(validationErrors.phone_number)}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#222222] font-serif">{t("auth.register.password")}</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        onBlur={(e) => validateField("password", e.target.value)}
                        className={`h-12 rounded-lg border-gray-200 focus:border-[#B8071C] focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-4 focus:ring-[#B8071C]/10 pe-10 font-serif ${validationErrors.password ? "border-red-500" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="h-3 text-xs leading-3 text-red-500">{tv(validationErrors.password)}</div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#222222] font-serif">{t("auth.register.confirm_password")}</label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange("confirmPassword", e.target.value)}
                        onBlur={(e) => validateField("confirmPassword", e.target.value)}
                        className={`h-12 rounded-lg border-gray-200 focus:border-[#B8071C] focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-4 focus:ring-[#B8071C]/10 pe-10 font-serif ${validationErrors.confirmPassword ? "border-red-500" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="h-3 text-xs leading-3 text-red-500">{tv(validationErrors.confirmPassword)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Email Verification */}
            {currentStep === 2 && (
              <EmailVerification
                email={formData.email}
                lang={lang}
                onVerified={() => {
                  setEmailVerified(true)
                  setCurrentStep(3)
                }}
                onBack={() => {
                  setCurrentStep(1)
                  setEmailVerified(false)
                }}
              />
            )}

            {/* Step 3: Personal Info */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#222222] font-serif">
                      {t("auth.register.firstname")}
                    </label>
                    <Input
                      type="text"
                      placeholder="John"
                      value={formData.prenom}
                      onChange={(e) => handleChange("prenom", e.target.value)}
                      onBlur={(e) => validateField("prenom", e.target.value)}
                      className={`h-12 rounded-lg border-gray-200 focus:border-[#B8071C] focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-4 focus:ring-[#B8071C]/10 font-serif ${validationErrors.prenom ? "border-red-500" : ""}`}
                    />
                    <div className="h-3 text-xs leading-3 text-red-500">{tv(validationErrors.prenom)}</div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#222222] font-serif">
                      {t("auth.register.lastname")}
                    </label>
                    <Input
                      type="text"
                      placeholder="Doe"
                      value={formData.nom}
                      onChange={(e) => handleChange("nom", e.target.value)}
                      onBlur={(e) => validateField("nom", e.target.value)}
                      className={`h-12 rounded-lg border-gray-200 focus:border-[#B8071C] focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-4 focus:ring-[#B8071C]/10 font-serif ${validationErrors.nom ? "border-red-500" : ""}`}
                    />
                    <div className="h-3 text-xs leading-3 text-red-500">{tv(validationErrors.nom)}</div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#222222] font-serif">{t("auth.register.usertype")}</label>
                  <Select value={formData.user_type} onValueChange={(value) => handleChange("user_type", value)}>
                    <SelectTrigger className="h-12 rounded-lg border-gray-200 focus:border-[#B8071C] focus:ring-4 focus:ring-[#B8071C]/10 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-serif">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start">
                      <SelectItem value="individual">{t("auth.register.individual")}</SelectItem>
                      <SelectItem value="dealer">{t("auth.register.professional")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="h-3 text-xs leading-3 text-red-500">{tv(validationErrors.user_type)}</div>
                </div>



                {/* Consent to terms and privacy policy */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center mt-0.5">
                    <input
                      type="checkbox"
                      checked={consentTerms}
                      onChange={(e) => setConsentTerms(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${consentTerms ? "bg-[#B8071C] border-[#B8071C]" : "border-gray-300 group-hover:border-[#B8071C]"}`}>
                      {consentTerms && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <span className="text-sm text-gray-700 leading-tight font-serif">
                    {t("auth.register.terms_checkbox")}{" "}
                    <Link href={`/${lang}/privacy`} target="_blank" className="text-[#B8071C] underline hover:no-underline">
                      {t("auth.register.privacy_policy_link")}
                    </Link>
                  </span>
                </label>
                {validationErrors.consent && (
                  <p className="text-xs text-red-500">{tv(validationErrors.consent)}</p>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-3">
              {currentStep > 1 && currentStep !== 2 && (
                <Button type="button" onClick={prevStep} variant="outline" className="flex-1 h-12 rounded-xl border-gray-200 hover:bg-gray-50 font-serif">
                  {t("auth.register.back")}
                </Button>
              )}

              {currentStep === 1 && (
                <Button type="button" onClick={nextStep} className="flex-1 h-12 rounded-xl bg-[#B8071C] hover:bg-[#1d4ed8] text-white font-serif">
                  {t("auth.register.next")}
                </Button>
              )}

              {currentStep === 3 && (
                <Button type="submit" disabled={!canSubmit || loading} className="flex-1 h-12 rounded-xl bg-[#B8071C] hover:bg-[#1d4ed8] text-white font-serif">
                  {loading ? t("auth.register.uploading") : t("auth.register.submit")}
                </Button>
              )}
            </div>
          </form>

          {currentStep === 1 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              {t("auth.register.has_account")} <Link href={`/${lang}/auth/login`} className="text-[#B8071C] font-semibold hover:underline">{t("auth.login.submit")}</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
