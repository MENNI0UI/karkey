"use client"

import * as React from "react"
import { Check, ChevronDown, AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { parsePhoneNumberFromString, CountryCode } from "libphonenumber-js"

// Country data sorted alphabetically with Morocco first
// maxLength values represent the National Significant Number (NSN) - digits after country code
// Based on ITU E.164 standards and libphonenumber metadata
const countries = [
  // Morocco first (priority)
  { code: "MA", name: "Morocco", nameAr: "المغرب", dialCode: "+212", maxLength: 9 },

  // Rest alphabetically by English name
  { code: "AF", name: "Afghanistan", nameAr: "أفغانستان", dialCode: "+93", maxLength: 9 },
  { code: "AL", name: "Albania", nameAr: "ألبانيا", dialCode: "+355", maxLength: 9 },
  { code: "DZ", name: "Algeria", nameAr: "الجزائر", dialCode: "+213", maxLength: 9 },
  { code: "AD", name: "Andorra", nameAr: "أندورا", dialCode: "+376", maxLength: 9 },
  { code: "AO", name: "Angola", nameAr: "أنغولا", dialCode: "+244", maxLength: 9 },
  { code: "AR", name: "Argentina", nameAr: "الأرجنتين", dialCode: "+54", maxLength: 13 }, // Mobile: 9+area+8 digits
  { code: "AM", name: "Armenia", nameAr: "أرمينيا", dialCode: "+374", maxLength: 8 },
  { code: "AU", name: "Australia", nameAr: "أستراليا", dialCode: "+61", maxLength: 9 },
  { code: "AT", name: "Austria", nameAr: "النمسا", dialCode: "+43", maxLength: 13 },
  { code: "AZ", name: "Azerbaijan", nameAr: "أذربيجان", dialCode: "+994", maxLength: 9 },
  { code: "BS", name: "Bahamas", nameAr: "الباهاماس", dialCode: "+1242", maxLength: 7 },
  { code: "BH", name: "Bahrain", nameAr: "البحرين", dialCode: "+973", maxLength: 8 },
  { code: "BD", name: "Bangladesh", nameAr: "بنغلاديش", dialCode: "+880", maxLength: 10 },
  { code: "BB", name: "Barbados", nameAr: "باربادوس", dialCode: "+1246", maxLength: 7 },
  { code: "BY", name: "Belarus", nameAr: "بيلاروسيا", dialCode: "+375", maxLength: 10 },
  { code: "BE", name: "Belgium", nameAr: "بلجيكا", dialCode: "+32", maxLength: 9 },
  { code: "BZ", name: "Belize", nameAr: "بليز", dialCode: "+501", maxLength: 7 },
  { code: "BJ", name: "Benin", nameAr: "بنين", dialCode: "+229", maxLength: 10 },
  { code: "BT", name: "Bhutan", nameAr: "بوتان", dialCode: "+975", maxLength: 8 },
  { code: "BO", name: "Bolivia", nameAr: "بوليفيا", dialCode: "+591", maxLength: 8 },
  { code: "BA", name: "Bosnia", nameAr: "البوسنة", dialCode: "+387", maxLength: 9 },
  { code: "BW", name: "Botswana", nameAr: "بوتسوانا", dialCode: "+267", maxLength: 8 },
  { code: "BR", name: "Brazil", nameAr: "البرازيل", dialCode: "+55", maxLength: 11 }, // 2-digit area + 9-digit mobile
  { code: "BN", name: "Brunei", nameAr: "بروناي", dialCode: "+673", maxLength: 7 },
  { code: "BG", name: "Bulgaria", nameAr: "بلغاريا", dialCode: "+359", maxLength: 9 },
  { code: "BF", name: "Burkina Faso", nameAr: "بوركينا فاسو", dialCode: "+226", maxLength: 8 },
  { code: "BI", name: "Burundi", nameAr: "بوروندي", dialCode: "+257", maxLength: 8 },
  { code: "KH", name: "Cambodia", nameAr: "كمبوديا", dialCode: "+855", maxLength: 10 },
  { code: "CM", name: "Cameroon", nameAr: "الكاميرون", dialCode: "+237", maxLength: 9 },
  { code: "CA", name: "Canada", nameAr: "كندا", dialCode: "+1", maxLength: 10 },
  { code: "CV", name: "Cape Verde", nameAr: "الرأس الأخضر", dialCode: "+238", maxLength: 7 },
  { code: "CF", name: "Central African Rep.", nameAr: "أفريقيا الوسطى", dialCode: "+236", maxLength: 8 },
  { code: "TD", name: "Chad", nameAr: "تشاد", dialCode: "+235", maxLength: 8 },
  { code: "CL", name: "Chile", nameAr: "تشيلي", dialCode: "+56", maxLength: 9 },
  { code: "CN", name: "China", nameAr: "الصين", dialCode: "+86", maxLength: 11 },
  { code: "CO", name: "Colombia", nameAr: "كولومبيا", dialCode: "+57", maxLength: 10 },
  { code: "KM", name: "Comoros", nameAr: "جزر القمر", dialCode: "+269", maxLength: 7 },
  { code: "CG", name: "Congo", nameAr: "الكونغو", dialCode: "+242", maxLength: 9 },
  { code: "CR", name: "Costa Rica", nameAr: "كوستاريكا", dialCode: "+506", maxLength: 8 },
  { code: "HR", name: "Croatia", nameAr: "كرواتيا", dialCode: "+385", maxLength: 10 },
  { code: "CU", name: "Cuba", nameAr: "كوبا", dialCode: "+53", maxLength: 8 },
  { code: "CY", name: "Cyprus", nameAr: "قبرص", dialCode: "+357", maxLength: 8 },
  { code: "CZ", name: "Czech Republic", nameAr: "التشيك", dialCode: "+420", maxLength: 9 },
  { code: "DK", name: "Denmark", nameAr: "الدنمارك", dialCode: "+45", maxLength: 8 },
  { code: "DJ", name: "Djibouti", nameAr: "جيبوتي", dialCode: "+253", maxLength: 8 },
  { code: "DO", name: "Dominican Republic", nameAr: "الدومينيكان", dialCode: "+1809", maxLength: 7 },
  { code: "CD", name: "DR Congo", nameAr: "الكونغو الديمقراطية", dialCode: "+243", maxLength: 9 },
  { code: "EC", name: "Ecuador", nameAr: "الإكوادور", dialCode: "+593", maxLength: 9 },
  { code: "EG", name: "Egypt", nameAr: "مصر", dialCode: "+20", maxLength: 10 },
  { code: "SV", name: "El Salvador", nameAr: "السلفادور", dialCode: "+503", maxLength: 8 },
  { code: "GQ", name: "Equatorial Guinea", nameAr: "غينيا الاستوائية", dialCode: "+240", maxLength: 9 },
  { code: "ER", name: "Eritrea", nameAr: "إريتريا", dialCode: "+291", maxLength: 7 },
  { code: "EE", name: "Estonia", nameAr: "إستونيا", dialCode: "+372", maxLength: 10 },
  { code: "SZ", name: "Eswatini", nameAr: "إسواتيني", dialCode: "+268", maxLength: 8 },
  { code: "ET", name: "Ethiopia", nameAr: "إثيوبيا", dialCode: "+251", maxLength: 9 },
  { code: "FJ", name: "Fiji", nameAr: "فيجي", dialCode: "+679", maxLength: 7 },
  { code: "FI", name: "Finland", nameAr: "فنلندا", dialCode: "+358", maxLength: 11 },
  { code: "FR", name: "France", nameAr: "فرنسا", dialCode: "+33", maxLength: 9 },
  { code: "GA", name: "Gabon", nameAr: "الغابون", dialCode: "+241", maxLength: 8 },
  { code: "GM", name: "Gambia", nameAr: "غامبيا", dialCode: "+220", maxLength: 7 },
  { code: "GE", name: "Georgia", nameAr: "جورجيا", dialCode: "+995", maxLength: 9 },
  { code: "DE", name: "Germany", nameAr: "ألمانيا", dialCode: "+49", maxLength: 12 }, // Variable length
  { code: "GH", name: "Ghana", nameAr: "غانا", dialCode: "+233", maxLength: 10 },
  { code: "GR", name: "Greece", nameAr: "اليونان", dialCode: "+30", maxLength: 10 },
  { code: "GT", name: "Guatemala", nameAr: "غواتيمالا", dialCode: "+502", maxLength: 8 },
  { code: "GN", name: "Guinea", nameAr: "غينيا", dialCode: "+224", maxLength: 9 },
  { code: "GW", name: "Guinea-Bissau", nameAr: "غينيا بيساو", dialCode: "+245", maxLength: 9 },
  { code: "GY", name: "Guyana", nameAr: "غيانا", dialCode: "+592", maxLength: 7 },
  { code: "HT", name: "Haiti", nameAr: "هايتي", dialCode: "+509", maxLength: 8 },
  { code: "HN", name: "Honduras", nameAr: "هندوراس", dialCode: "+504", maxLength: 8 },
  { code: "HK", name: "Hong Kong", nameAr: "هونغ كونغ", dialCode: "+852", maxLength: 9 },
  { code: "HU", name: "Hungary", nameAr: "المجر", dialCode: "+36", maxLength: 9 },
  { code: "IS", name: "Iceland", nameAr: "آيسلندا", dialCode: "+354", maxLength: 9 },
  { code: "IN", name: "India", nameAr: "الهند", dialCode: "+91", maxLength: 10 },
  { code: "ID", name: "Indonesia", nameAr: "إندونيسيا", dialCode: "+62", maxLength: 12 },
  { code: "IR", name: "Iran", nameAr: "إيران", dialCode: "+98", maxLength: 10 },
  { code: "IQ", name: "Iraq", nameAr: "العراق", dialCode: "+964", maxLength: 10 },
  { code: "IE", name: "Ireland", nameAr: "أيرلندا", dialCode: "+353", maxLength: 9 },
  { code: "IL", name: "Israel", nameAr: "إسرائيل", dialCode: "+972", maxLength: 9 },
  { code: "IT", name: "Italy", nameAr: "إيطاليا", dialCode: "+39", maxLength: 11 },
  { code: "CI", name: "Ivory Coast", nameAr: "ساحل العاج", dialCode: "+225", maxLength: 10 },
  { code: "JM", name: "Jamaica", nameAr: "جامايكا", dialCode: "+1876", maxLength: 7 },
  { code: "JP", name: "Japan", nameAr: "اليابان", dialCode: "+81", maxLength: 10 },
  { code: "JO", name: "Jordan", nameAr: "الأردن", dialCode: "+962", maxLength: 9 },
  { code: "KZ", name: "Kazakhstan", nameAr: "كازاخستان", dialCode: "+7", maxLength: 10 },
  { code: "KE", name: "Kenya", nameAr: "كينيا", dialCode: "+254", maxLength: 10 },
  { code: "KI", name: "Kiribati", nameAr: "كيريباتي", dialCode: "+686", maxLength: 8 },
  { code: "KW", name: "Kuwait", nameAr: "الكويت", dialCode: "+965", maxLength: 8 },
  { code: "KG", name: "Kyrgyzstan", nameAr: "قيرغيزستان", dialCode: "+996", maxLength: 9 },
  { code: "LA", name: "Laos", nameAr: "لاوس", dialCode: "+856", maxLength: 10 },
  { code: "LV", name: "Latvia", nameAr: "لاتفيا", dialCode: "+371", maxLength: 8 },
  { code: "LB", name: "Lebanon", nameAr: "لبنان", dialCode: "+961", maxLength: 8 },
  { code: "LS", name: "Lesotho", nameAr: "ليسوتو", dialCode: "+266", maxLength: 8 },
  { code: "LR", name: "Liberia", nameAr: "ليبيريا", dialCode: "+231", maxLength: 9 },
  { code: "LY", name: "Libya", nameAr: "ليبيا", dialCode: "+218", maxLength: 10 },
  { code: "LI", name: "Liechtenstein", nameAr: "ليختنشتاين", dialCode: "+423", maxLength: 9 },
  { code: "LT", name: "Lithuania", nameAr: "ليتوانيا", dialCode: "+370", maxLength: 8 },
  { code: "LU", name: "Luxembourg", nameAr: "لوكسمبورغ", dialCode: "+352", maxLength: 11 },
  { code: "MO", name: "Macau", nameAr: "ماكاو", dialCode: "+853", maxLength: 8 },
  { code: "MG", name: "Madagascar", nameAr: "مدغشقر", dialCode: "+261", maxLength: 10 },
  { code: "MW", name: "Malawi", nameAr: "مالاوي", dialCode: "+265", maxLength: 9 },
  { code: "MY", name: "Malaysia", nameAr: "ماليزيا", dialCode: "+60", maxLength: 10 },
  { code: "MV", name: "Maldives", nameAr: "المالديف", dialCode: "+960", maxLength: 7 },
  { code: "ML", name: "Mali", nameAr: "مالي", dialCode: "+223", maxLength: 8 },
  { code: "MT", name: "Malta", nameAr: "مالطا", dialCode: "+356", maxLength: 8 },
  { code: "MH", name: "Marshall Islands", nameAr: "جزر مارشال", dialCode: "+692", maxLength: 7 },
  { code: "MR", name: "Mauritania", nameAr: "موريتانيا", dialCode: "+222", maxLength: 8 },
  { code: "MU", name: "Mauritius", nameAr: "موريشيوس", dialCode: "+230", maxLength: 8 },
  { code: "MX", name: "Mexico", nameAr: "المكسيك", dialCode: "+52", maxLength: 10 },
  { code: "FM", name: "Micronesia", nameAr: "ميكرونيزيا", dialCode: "+691", maxLength: 7 },
  { code: "MD", name: "Moldova", nameAr: "مولدوفا", dialCode: "+373", maxLength: 8 },
  { code: "MC", name: "Monaco", nameAr: "موناكو", dialCode: "+377", maxLength: 9 },
  { code: "MN", name: "Mongolia", nameAr: "منغوليا", dialCode: "+976", maxLength: 8 },
  { code: "ME", name: "Montenegro", nameAr: "الجبل الأسود", dialCode: "+382", maxLength: 12 },
  { code: "MZ", name: "Mozambique", nameAr: "موزمبيق", dialCode: "+258", maxLength: 9 },
  { code: "MM", name: "Myanmar", nameAr: "ميانمار", dialCode: "+95", maxLength: 10 },
  { code: "NA", name: "Namibia", nameAr: "ناميبيا", dialCode: "+264", maxLength: 10 },
  { code: "NR", name: "Nauru", nameAr: "ناورو", dialCode: "+674", maxLength: 7 },
  { code: "NP", name: "Nepal", nameAr: "نيبال", dialCode: "+977", maxLength: 10 },
  { code: "NL", name: "Netherlands", nameAr: "هولندا", dialCode: "+31", maxLength: 9 },
  { code: "NC", name: "New Caledonia", nameAr: "كاليدونيا الجديدة", dialCode: "+687", maxLength: 6 },
  { code: "NZ", name: "New Zealand", nameAr: "نيوزيلندا", dialCode: "+64", maxLength: 10 },
  { code: "NI", name: "Nicaragua", nameAr: "نيكاراغوا", dialCode: "+505", maxLength: 8 },
  { code: "NE", name: "Niger", nameAr: "النيجر", dialCode: "+227", maxLength: 8 },
  { code: "NG", name: "Nigeria", nameAr: "نيجيريا", dialCode: "+234", maxLength: 10 },
  { code: "KP", name: "North Korea", nameAr: "كوريا الشمالية", dialCode: "+850", maxLength: 13 },
  { code: "MK", name: "North Macedonia", nameAr: "مقدونيا الشمالية", dialCode: "+389", maxLength: 8 },
  { code: "NO", name: "Norway", nameAr: "النرويج", dialCode: "+47", maxLength: 8 },
  { code: "OM", name: "Oman", nameAr: "عُمان", dialCode: "+968", maxLength: 8 },
  { code: "PK", name: "Pakistan", nameAr: "باكستان", dialCode: "+92", maxLength: 10 },
  { code: "PW", name: "Palau", nameAr: "بالاو", dialCode: "+680", maxLength: 7 },
  { code: "PS", name: "Palestine", nameAr: "فلسطين", dialCode: "+970", maxLength: 9 },
  { code: "PA", name: "Panama", nameAr: "بنما", dialCode: "+507", maxLength: 8 },
  { code: "PG", name: "Papua New Guinea", nameAr: "بابوا غينيا الجديدة", dialCode: "+675", maxLength: 11 },
  { code: "PY", name: "Paraguay", nameAr: "باراغواي", dialCode: "+595", maxLength: 9 },
  { code: "PE", name: "Peru", nameAr: "بيرو", dialCode: "+51", maxLength: 9 },
  { code: "PH", name: "Philippines", nameAr: "الفلبين", dialCode: "+63", maxLength: 10 },
  { code: "PL", name: "Poland", nameAr: "بولندا", dialCode: "+48", maxLength: 9 },
  { code: "PT", name: "Portugal", nameAr: "البرتغال", dialCode: "+351", maxLength: 9 },
  { code: "PR", name: "Puerto Rico", nameAr: "بورتوريكو", dialCode: "+1787", maxLength: 7 },
  { code: "QA", name: "Qatar", nameAr: "قطر", dialCode: "+974", maxLength: 8 },
  { code: "RO", name: "Romania", nameAr: "رومانيا", dialCode: "+40", maxLength: 9 },
  { code: "RU", name: "Russia", nameAr: "روسيا", dialCode: "+7", maxLength: 10 },
  { code: "RW", name: "Rwanda", nameAr: "رواندا", dialCode: "+250", maxLength: 9 },
  { code: "WS", name: "Samoa", nameAr: "ساموا", dialCode: "+685", maxLength: 7 },
  { code: "SM", name: "San Marino", nameAr: "سان مارينو", dialCode: "+378", maxLength: 10 },
  { code: "ST", name: "São Tomé", nameAr: "ساو تومي", dialCode: "+239", maxLength: 7 },
  { code: "SA", name: "Saudi Arabia", nameAr: "السعودية", dialCode: "+966", maxLength: 9 },
  { code: "SN", name: "Senegal", nameAr: "السنغال", dialCode: "+221", maxLength: 9 },
  { code: "RS", name: "Serbia", nameAr: "صربيا", dialCode: "+381", maxLength: 12 },
  { code: "SC", name: "Seychelles", nameAr: "سيشل", dialCode: "+248", maxLength: 7 },
  { code: "SL", name: "Sierra Leone", nameAr: "سيراليون", dialCode: "+232", maxLength: 8 },
  { code: "SG", name: "Singapore", nameAr: "سنغافورة", dialCode: "+65", maxLength: 8 },
  { code: "SK", name: "Slovakia", nameAr: "سلوفاكيا", dialCode: "+421", maxLength: 9 },
  { code: "SI", name: "Slovenia", nameAr: "سلوفينيا", dialCode: "+386", maxLength: 8 },
  { code: "SB", name: "Solomon Islands", nameAr: "جزر سليمان", dialCode: "+677", maxLength: 7 },
  { code: "SO", name: "Somalia", nameAr: "الصومال", dialCode: "+252", maxLength: 9 },
  { code: "ZA", name: "South Africa", nameAr: "جنوب أفريقيا", dialCode: "+27", maxLength: 9 },
  { code: "KR", name: "South Korea", nameAr: "كوريا الجنوبية", dialCode: "+82", maxLength: 11 },
  { code: "SS", name: "South Sudan", nameAr: "جنوب السودان", dialCode: "+211", maxLength: 9 },
  { code: "ES", name: "Spain", nameAr: "إسبانيا", dialCode: "+34", maxLength: 9 },
  { code: "LK", name: "Sri Lanka", nameAr: "سريلانكا", dialCode: "+94", maxLength: 9 },
  { code: "SD", name: "Sudan", nameAr: "السودان", dialCode: "+249", maxLength: 9 },
  { code: "SR", name: "Suriname", nameAr: "سورينام", dialCode: "+597", maxLength: 7 },
  { code: "SE", name: "Sweden", nameAr: "السويد", dialCode: "+46", maxLength: 13 },
  { code: "CH", name: "Switzerland", nameAr: "سويسرا", dialCode: "+41", maxLength: 9 },
  { code: "SY", name: "Syria", nameAr: "سوريا", dialCode: "+963", maxLength: 9 },
  { code: "TW", name: "Taiwan", nameAr: "تايوان", dialCode: "+886", maxLength: 10 },
  { code: "TJ", name: "Tajikistan", nameAr: "طاجيكستان", dialCode: "+992", maxLength: 9 },
  { code: "TZ", name: "Tanzania", nameAr: "تنزانيا", dialCode: "+255", maxLength: 9 },
  { code: "TH", name: "Thailand", nameAr: "تايلاند", dialCode: "+66", maxLength: 9 },
  { code: "TL", name: "Timor-Leste", nameAr: "تيمور الشرقية", dialCode: "+670", maxLength: 8 },
  { code: "TG", name: "Togo", nameAr: "توغو", dialCode: "+228", maxLength: 8 },
  { code: "TO", name: "Tonga", nameAr: "تونغا", dialCode: "+676", maxLength: 7 },
  { code: "TT", name: "Trinidad and Tobago", nameAr: "ترينيداد وتوباغو", dialCode: "+1868", maxLength: 7 },
  { code: "TN", name: "Tunisia", nameAr: "تونس", dialCode: "+216", maxLength: 8 },
  { code: "TR", name: "Turkey", nameAr: "تركيا", dialCode: "+90", maxLength: 10 },
  { code: "TM", name: "Turkmenistan", nameAr: "تركمانستان", dialCode: "+993", maxLength: 8 },
  { code: "TV", name: "Tuvalu", nameAr: "توفالو", dialCode: "+688", maxLength: 6 },
  { code: "UG", name: "Uganda", nameAr: "أوغندا", dialCode: "+256", maxLength: 9 },
  { code: "UA", name: "Ukraine", nameAr: "أوكرانيا", dialCode: "+380", maxLength: 9 },
  { code: "AE", name: "United Arab Emirates", nameAr: "الإمارات", dialCode: "+971", maxLength: 9 },
  { code: "GB", name: "United Kingdom", nameAr: "المملكة المتحدة", dialCode: "+44", maxLength: 10 },
  { code: "US", name: "United States", nameAr: "الولايات المتحدة", dialCode: "+1", maxLength: 10 },
  { code: "UY", name: "Uruguay", nameAr: "أوروغواي", dialCode: "+598", maxLength: 9 },
  { code: "UZ", name: "Uzbekistan", nameAr: "أوزبكستان", dialCode: "+998", maxLength: 9 },
  { code: "VU", name: "Vanuatu", nameAr: "فانواتو", dialCode: "+678", maxLength: 7 },
  { code: "VE", name: "Venezuela", nameAr: "فنزويلا", dialCode: "+58", maxLength: 10 },
  { code: "VN", name: "Vietnam", nameAr: "فيتنام", dialCode: "+84", maxLength: 10 },
  { code: "YE", name: "Yemen", nameAr: "اليمن", dialCode: "+967", maxLength: 9 },
  { code: "ZM", name: "Zambia", nameAr: "زامبيا", dialCode: "+260", maxLength: 9 },
  { code: "ZW", name: "Zimbabwe", nameAr: "زيمبابوي", dialCode: "+263", maxLength: 9 },
]

export type Country = typeof countries[number]

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: boolean
  className?: string
  placeholder?: string
  lang?: string
  showValidation?: boolean // Show real-time validation status
}

export function PhoneInput({
  value,
  onChange,
  onBlur,
  error,
  className,
  placeholder = "600000000",
  lang = "en",
  showValidation = true
}: PhoneInputProps) {
  const [open, setOpen] = React.useState(false)
  const [validationStatus, setValidationStatus] = React.useState<'idle' | 'valid' | 'invalid'>('idle')

  // Parse the current value to extract country and number
  const parsePhoneValue = React.useCallback((val: string) => {
    if (!val) return { country: countries[0], number: "" }

    // Find matching country by dial code (longest match first)
    const sortedCountries = [...countries].sort((a, b) => b.dialCode.length - a.dialCode.length)
    for (const country of sortedCountries) {
      if (val.startsWith(country.dialCode)) {
        return {
          country,
          number: val.slice(country.dialCode.length)
        }
      }
    }

    // Default to Morocco if no match
    return { country: countries[0], number: val.replace(/^\+/, "") }
  }, [])

  const { country: selectedCountry, number: phoneNumber } = parsePhoneValue(value)

  // Real-time validation using libphonenumber-js
  React.useEffect(() => {
    if (!phoneNumber || phoneNumber.length < 4) {
      setValidationStatus('idle')
      return
    }

    try {
      const fullNumber = selectedCountry.dialCode + phoneNumber
      const parsed = parsePhoneNumberFromString(fullNumber, selectedCountry.code as CountryCode)

      if (parsed && parsed.isValid()) {
        setValidationStatus('valid')
      } else {
        setValidationStatus('invalid')
      }
    } catch {
      setValidationStatus('invalid')
    }
  }, [phoneNumber, selectedCountry])

  const handleCountrySelect = (country: Country) => {
    const newNumber = phoneNumber.slice(0, country.maxLength)
    onChange(country.dialCode + newNumber)
    setOpen(false)
    setValidationStatus('idle') // Reset validation on country change
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, selectedCountry.maxLength)
    onChange(selectedCountry.dialCode + digits)
  }

  const isRTL = lang === "ar"

  return (
    <div className={cn("flex gap-2 relative", className)} dir="ltr">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-12 px-3 justify-between bg-gray-50 border-gray-200 hover:bg-gray-100 min-w-[120px]"
          >
            <span className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png`}
                alt={selectedCountry.name}
                className="w-5 h-4 object-cover rounded-sm"
              />
              <span className="text-sm font-medium text-gray-700">{selectedCountry.dialCode}</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder={isRTL ? "ابحث عن دولة..." : "Search country..."} />
            <CommandList>
              <CommandEmpty>{isRTL ? "لم يتم العثور على دولة" : "No country found."}</CommandEmpty>
              <CommandGroup className="max-h-[300px] overflow-auto">
                {countries.map((country) => (
                  <CommandItem
                    key={country.code + country.dialCode}
                    value={`${country.name} ${country.nameAr} ${country.dialCode}`}
                    onSelect={() => handleCountrySelect(country)}
                    className="flex items-center gap-3 cursor-pointer py-2"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                      alt={country.name}
                      className="w-6 h-4 object-cover rounded-sm flex-shrink-0"
                    />
                    <span className="flex-1 text-sm truncate">
                      {isRTL ? country.nameAr : country.name}
                    </span>
                    <span className="text-sm text-gray-500 flex-shrink-0">{country.dialCode}</span>
                    {selectedCountry.code === country.code && selectedCountry.dialCode === country.dialCode && (
                      <Check className="h-4 w-4 text-[#B8071C] flex-shrink-0" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="relative flex-1">
        <Input
          type="tel"
          inputMode="numeric"
          maxLength={selectedCountry.maxLength}
          placeholder={placeholder}
          value={phoneNumber}
          onChange={handleNumberChange}
          onBlur={onBlur}
          className={cn(
            "h-12 rounded-lg border-gray-200 focus:border-[#B8071C] focus:ring-[#B8071C]/20 w-full pr-10 text-left",
            // isRTL ? "text-right font-sans dir-rtl" : "text-left", // Kept LTR as requested by user
            error && "border-red-500",
            showValidation && validationStatus === 'valid' && "border-green-500",
            showValidation && validationStatus === 'invalid' && phoneNumber.length > 3 && "border-orange-400"
          )}
        />
        {/* Real-time validation indicator */}
        {showValidation && phoneNumber.length > 3 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {validationStatus === 'valid' && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            {validationStatus === 'invalid' && (
              <AlertCircle className="h-5 w-5 text-orange-400" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to get normalized E.164 phone number
export function getNormalizedPhone(phone: string, countryCode: string): string | null {
  try {
    const parsed = parsePhoneNumberFromString(phone, countryCode as CountryCode)
    if (parsed && parsed.isValid()) {
      return parsed.number // E.164 format: +212612345678
    }
    return null
  } catch {
    return null
  }
}

export { countries }
