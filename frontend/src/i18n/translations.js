/**
 * Real i18n dictionary. Scope, honestly: this covers the "chrome" that
 * appears on every screen — sidebar navigation labels, top nav, login/auth
 * pages, and common action buttons/words — since that's what actually makes
 * switching languages feel systemic rather than cosmetic. It does not cover
 * every sentence of body copy across all ~50 screens; that's a much larger,
 * separate effort. Keys are the exact English strings used throughout the
 * app, mapped to their Amharic equivalent, so existing components can wrap
 * any hardcoded label in t("...") without restructuring how labels are
 * defined (e.g. in data/navigation.js).
 */
export const TRANSLATIONS = {
  am: {
    // --- Sidebar navigation labels (exact matches to data/navigation.js) ---
    "Home": "ዋና ገጽ",
    "Apply for Clearance": "ክሊራንስ ማመልከቻ",
    "My Requests": "የእኔ ጥያቄዎች",
    "Upload Documents": "ሰነዶችን መስቀል",
    "Download Certificate": "ሰርተፍኬት ማውረድ",
    "Notifications": "ማሳወቂያዎች",
    "Profile & Password": "መገለጫ እና የይለፍ ቃል",
    "Pending Requests": "በመጠባበቅ ላይ ያሉ ጥያቄዎች",
    "Approval History": "የማጽደቅ ታሪክ",
    "Delegation Settings": "የውክልና ቅንብሮች",
    "Department Documents": "የመምሪያ ሰነዶች",
    "Calendar": "ቀን መቁጠሪያ",
    "Escalated Requests": "ወደ ላይ የተላለፉ ጥያቄዎች",
    "Assign / Approve Substitute": "ምትክ መመደብ / ማጽደቅ",
    "Team Performance": "የቡድን አፈጻጸም",
    "Send Reminder": "አስታዋሽ መላክ",
    "Full Clearance Matrix": "ሙሉ የክሊራንስ ሰንጠረዥ",
    "Initiate on Behalf": "ወክሎ ማስጀመር",
    "Delayed / Escalated": "የዘገዩ / ወደ ላይ የተላለፉ",
    "Certificate Management": "የሰርተፍኬት አስተዳደር",
    "Reports & Export": "ሪፖርቶች እና ማውጣት",
    "Audit Logs": "የኦዲት መዝገቦች",
    "Timeline Viewer": "የጊዜ ሰሌዳ መመልከቻ",
    "Login / Session Activity": "የመግቢያ እንቅስቃሴ",
    "Export Reports": "ሪፖርቶችን ማውጣት",
    "User & Role Management": "የተጠቃሚ እና ሚና አስተዳደር",
    "Department Management": "የመምሪያ አስተዳደር",
    "Workflow Builder": "የስራ ፍሰት ገንቢ",
    "Certificate Administration": "የሰርተፍኬት አስተዳደር",
    "Escalation Overrides": "የማሳለፍ ውሳኔዎች",
    "Reports & Analytics": "ሪፖርቶች እና ትንተና",
    "Notification Templates": "የማሳወቂያ አብነቶች",
    "Full Audit Logs": "ሙሉ የኦዲት መዝገቦች",
    "Settings": "ቅንብሮች",
    "System Monitoring": "የስርዓት ክትትል",
    "Security": "ደህንነት",
    "Backup & Recovery": "መጠባበቂያ እና ማገገሚያ",
    "Cron Job Monitor": "የራስሰር ስራ መቆጣጠሪያ",
    "Email Delivery Logs": "የኢሜይል ማድረሻ መዝገቦች",
    "Notification Settings": "የማሳወቂያ ቅንብሮች",

    // --- Top nav ---
    "Search reference no., applicant, certificate...": "በመለያ ቁጥር፣ አመልካች ወይም ሰርተፍኬት ይፈልጉ...",
    "Help & Support": "እገዛ እና ድጋፍ",
    "Log Out": "ውጣ",

    // --- Login / auth ---
    "Sign in to your account": "ወደ መለያዎ ይግቡ",
    "Use your university email and password to continue.": "ለመቀጠል የዩኒቨርሲቲ ኢሜይልዎን እና የይለፍ ቃልዎን ያስገቡ።",
    "Email or ID": "ኢሜይል ወይም መታወቂያ",
    "Password": "የይለፍ ቃል",
    "Remember me": "አስታውሰኝ",
    "Forgot Password?": "የይለፍ ቃል ረሱ?",
    "Sign In": "ግባ",
    "Digital Clearance Management System": "የዲጂታል ክሊራንስ አስተዳደር ስርዓት",

    // --- Common actions ---
    "Save": "አስቀምጥ",
    "Save Changes": "ለውጦችን አስቀምጥ",
    "Cancel": "ሰርዝ",
    "Submit": "አስገባ",
    "Approve": "አጽድቅ",
    "Reject": "ውድቅ አድርግ",
    "Hold": "አቆይ",
    "Download": "አውርድ",
    "Export": "አውጣ",
    "Export CSV": "CSV አውጣ",
    "Refresh": "አድስ",
    "Loading...": "በመጫን ላይ...",
  },
};

export function translate(language, key) {
  if (language === "am" && TRANSLATIONS.am[key]) {
    return TRANSLATIONS.am[key];
  }
  return key; // English is the identity case — keys ARE the English text
}
