const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export async function getAISafetyAdvice(activityLogs) {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key is not configured");
  }

  const logsText = activityLogs
    .map(
      (log, idx) =>
        `${idx + 1}. URL: ${log.url}, Risk: ${log.risk_level}, Time: ${
          log.timestamp
        }`
    )
    .join("\n");

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile", // Updated to current model
      messages: [
        {
          role: "system",
          content:
            "You are a cybersecurity safety coach. Analyze user browsing activity and provide personalized security advice and recommendations.",
        },
        {
          role: "user",
          content: `Analyze this browsing activity and give security advice:\n\n${logsText}\n\nProvide: 1) Overall security assessment 2) Specific risks identified 3) Actionable recommendations`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to get AI advice");
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "No advice generated";
}

// Get AI analysis for medium risk URLs
export async function analyzeMediumRiskUrl(url) {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key is not configured");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a cybersecurity expert. Analyze medium-risk URLs and provide specific threat warnings and safety tips. Respond in JSON format with 'threats' (array of detected threats) and 'tips' (array of safety recommendations).",
        },
        {
          role: "user",
          content: `Analyze this medium-risk URL and provide specific warnings: ${url}\n\nIdentify what makes it risky (executable files, archives, scripts, etc.) and provide 3-5 specific safety tips. Return ONLY valid JSON in this exact format:\n{\n  "threats": ["threat 1", "threat 2"],\n  "tips": ["tip 1", "tip 2", "tip 3"]\n}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to get AI analysis");
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || "{}";

  try {
    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = content;
    if (content.includes("```json")) {
      jsonStr = content.split("```json")[1].split("```")[0].trim();
    } else if (content.includes("```")) {
      jsonStr = content.split("```")[1].split("```")[0].trim();
    }

    const analysis = JSON.parse(jsonStr);
    return {
      threats: analysis.threats || [],
      tips: analysis.tips || [],
    };
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    // Fallback if JSON parsing fails
    return {
      threats: ["Potentially dangerous file type detected"],
      tips: [
        "Verify the source before downloading",
        "Scan with antivirus software",
        "Only download from trusted websites",
      ],
    };
  }
}

// Chatbot function for interactive conversation
export async function chatWithAI(messages, activityContext = null) {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key is not configured");
  }

  // Build system message with activity context
  let systemMessage =
    "You are CyberShield AI, a friendly cybersecurity assistant. Help users understand online threats, answer security questions, and provide safety tips. Be conversational, helpful, and educational.";

  if (activityContext && activityContext.length > 0) {
    const contextText = activityContext
      .slice(0, 10) // Last 10 activities
      .map((log) => `${log.url} (${log.risk_level} risk)`)
      .join(", ");
    systemMessage += `\n\nUser's recent activity: ${contextText}`;
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemMessage }, ...messages],
      temperature: 0.8,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to get AI response");
  }

  const data = await response.json();
  return (
    data.choices[0]?.message?.content ||
    "I'm having trouble responding right now."
  );
}

export function classifyRisk(url) {
  const urlLower = url.toLowerCase();

  // FIRST: Check for trusted domains (whitelist) - highest priority
  const trustedDomains = [
    // Major Global Tech Companies
    "google.com",
    "youtube.com",
    "facebook.com",
    "twitter.com",
    "x.com",
    "instagram.com",
    "linkedin.com",
    "github.com",
    "gitlab.com",
    "stackoverflow.com",
    "stackexchange.com",
    "microsoft.com",
    "apple.com",
    "amazon.com",
    "ebay.com",
    "wikipedia.org",
    "reddit.com",
    "medium.com",
    "netflix.com",
    "spotify.com",
    "dropbox.com",
    "zoom.us",
    "slack.com",
    "office.com",
    "live.com",
    "outlook.com",
    "bing.com",
    "yahoo.com",
    "duckduckgo.com",
    "cloudflare.com",
    "mozilla.org",
    "w3.org",
    "npmjs.com",
    "pypi.org",

    // AI & Productivity Tools
    "openai.com",
    "chatgpt.com",
    "anthropic.com",
    "claude.ai",
    "notion.so",
    "trello.com",
    "asana.com",
    "monday.com",
    "airtable.com",
    "canva.com",
    "figma.com",
    "adobe.com",
    "salesforce.com",
    "hubspot.com",

    // Communication & Collaboration
    "discord.com",
    "telegram.org",
    "whatsapp.com",
    "signal.org",
    "teams.microsoft.com",
    "meet.google.com",
    "webex.com",
    "skype.com",

    // Cloud & Development
    "aws.amazon.com",
    "azure.com",
    "vercel.com",
    "netlify.com",
    "heroku.com",
    "digitalocean.com",
    "linode.com",
    "docker.com",
    "kubernetes.io",
    "jenkins.io",
    "bitbucket.org",

    // E-commerce & Payment
    "paypal.com",
    "stripe.com",
    "shopify.com",
    "etsy.com",
    "aliexpress.com",
    "wish.com",

    // News & Media
    "bbc.com",
    "cnn.com",
    "nytimes.com",
    "theguardian.com",
    "reuters.com",
    "bloomberg.com",
    "techcrunch.com",
    "wired.com",
    "theverge.com",
    "engadget.com",

    // Education & Learning
    "coursera.org",
    "udemy.com",
    "edx.org",
    "khanacademy.org",
    "duolingo.com",
    "codecademy.com",
    "freecodecamp.org",
    "w3schools.com",
    "mdn.mozilla.org",

    // Indian Websites & Services (10% focus)
    "flipkart.com",
    "amazon.in",
    "myntra.com",
    "paytm.com",
    "phonepe.com",
    "googlepay.com",
    "bharatpe.com",
    "cred.club",
    "zerodha.com",
    "groww.in",
    "upstox.com",
    "swiggy.com",
    "zomato.com",
    "ola.cab",
    "uber.com",
    "irctc.co.in",
    "makemytrip.com",
    "goibibo.com",
    "cleartrip.com",
    "yatra.com",
    "bookmyshow.com",
    "hotstar.com",
    "sonyliv.com",
    "zee5.com",
    "voot.com",
    "jiocinema.com",
    "ndtv.com",
    "thehindu.com",
    "timesof india.com",
    "indianexpress.com",
    "hindustantimes.com",
    "moneycontrol.com",
    "livemint.com",
    "economictimes.com",
    "bharatmatrimony.com",
    "shaadi.com",
    "naukri.com",
    "shine.com",
    "monster.com",
    "indeed.com",
    "glassdoor.com",
    "justdial.com",
    "sulekha.com",
    "quikr.com",
    "olx.in",
    "99acres.com",
    "magicbricks.com",
    "housing.com",
    "policybazaar.com",
    "bankbazaar.com",
    "paisabazaar.com",
    "byju.com",
    "unacademy.com",
    "vedantu.com",
    "toppr.com",
    "extramarks.com",
    "meritnation.com",
    "aakash.ac.in",
    "allen.ac.in",
    "fiitjee.com",
    "resonance.ac.in",
    "nic.in",
    "gov.in",
    "india.gov.in",
    "digitalindia.gov.in",
    "mygov.in",
    "uidai.gov.in",
    "incometax.gov.in",
    "gst.gov.in",
    "epfindia.gov.in",
    "esic.in",
    "eci.gov.in",
    "sbi.co.in",
    "hdfcbank.com",
    "icicibank.com",
    "axisbank.com",
    "kotakbank.com",
    "pnb.in",
    "bankof baroda.in",
    "canarabank.in",
    "unionbankofindia.co.in",
    "indianbank.in",

    // Government & Official
    ".gov",
    ".gov.in",
    ".edu",
    ".edu.in",
    ".ac.in",
    ".org",
    ".mil",
  ];

  // Check if URL contains any trusted domain with improved accuracy
  if (
    trustedDomains.some((domain) => {
      // More precise matching - ensure it's actually the domain, not just substring
      if (domain.startsWith(".")) {
        // For TLDs like .gov, .edu - check if URL ends with it or contains it properly
        return urlLower.endsWith(domain) || urlLower.includes(domain + "/");
      }

      // For regular domains, use strict matching
      try {
        // Extract hostname from URL
        let hostname = urlLower;
        if (urlLower.includes("://")) {
          hostname = urlLower.split("://")[1].split("/")[0].split("?")[0];
        } else if (urlLower.startsWith("//")) {
          hostname = urlLower.substring(2).split("/")[0].split("?")[0];
        }

        // Remove port if present
        hostname = hostname.split(":")[0];

        // Check exact match or subdomain match
        return (
          hostname === domain ||
          hostname.endsWith("." + domain) ||
          hostname === "www." + domain
        );
      } catch (e) {
        // Fallback to basic matching if URL parsing fails
        return (
          urlLower.includes("://" + domain + "/") ||
          urlLower.includes("://" + domain + "?") ||
          urlLower.includes("://www." + domain) ||
          urlLower === domain ||
          urlLower === "www." + domain
        );
      }
    })
  ) {
    return "low";
  }

  // CRITICAL: High risk patterns (phishing, scams, malware, fraud)
  const highRiskPatterns = [
    // Phishing & Account Verification Scams (with word boundaries)
    "verify-account",
    "suspended-account",
    "account-suspended",
    "confirm-identity",
    "verify-payment",
    "update-billing",
    "confirm-account",
    "secure-login",
    "re-activate",
    "account-locked",
    "unusual-activity",
    "verify-information",
    "confirm-payment",
    "account-verification",
    "update-payment",
    "security-alert",
    "action-required",
    "suspended-notice",
    "verify-information",
    "confirm-payment",
    "account-verification",

    // Financial Scams
    "free-money",
    "claim-prize",
    "you-won",
    "lottery-winner",
    "cash-prize",
    "get-rich",
    "make-money-fast",
    "bitcoin-giveaway",
    "crypto-giveaway",
    "free-bitcoin",
    "double-your-money",
    "investment-opportunity",
    "guaranteed-profit",
    "easy-money",
    "work-from-home-scam",

    // Malware & Hacking
    "hack-tool",
    "crack-software",
    "keygen",
    "free-crack",
    "software-crack",
    "password-hack",
    "hack-account",
    "free-hack",
    "cheat-tool",
    "malware",
    "trojan",
    "ransomware",
    "spyware",

    // Tech Support Scams
    "tech-support-scam",
    "virus-detected",
    "computer-infected",
    "call-support",
    "microsoft-support",
    "apple-support-scam",
    "security-alert",
    "critical-alert",
    "system-warning",

    // Fake Services & Downloads
    "free-download-virus",
    "fake-update",
    "urgent-update",
    "flash-update",
    "java-update-scam",
    "codec-required",
    "player-required",

    // Romance & Catfish Scams
    "romance-scam",
    "fake-dating",
    "catfish",
    "send-money-love",

    // Pharma & Counterfeit
    "cheap-viagra",
    "discount-pharmacy",
    "no-prescription",
    "fake-pills",
    "miracle-cure",

    // Tax & IRS Scams
    "irs-scam",
    "tax-refund-scam",
    "government-grant",
    "stimulus-check-scam",

    // Gift Card & Payment Scams
    "gift-card-scam",
    "pay-with-giftcard",
    "itunes-card-payment",
    "steam-card-scam",
    "google-play-scam",

    // Fake Jobs & Employment
    "fake-job",
    "job-scam",
    "work-from-home-fake",
    "pay-to-apply",
    "employment-scam",
    "pyramid-scheme",
    "mlm-scam",

    // URL Manipulation & Typosquatting (more specific patterns)
    "paypa1.com",
    "paypal-",
    "amazn.com",
    "amazon-",
    "g00gle",
    "micros0ft",
    "facebo0k",
    "netfliix",
    "netfl1x",
    "appl3.com",
    "app1e.com",
    "signin-",
    "login-",
    "secure-",
    "account-",
    "verify-",
    "update-",

    // Suspicious TLDs (common in scams)
    ".tk",
    ".ml",
    ".ga",
    ".cf",
    ".gq", // free domains

    // Click fraud
    "click-here-now",
    "limited-time",
    "act-now",
    "dont-miss",
    "last-chance",
    "expires-today",
    "urgent-action",
    "immediate-response",

    // Data harvesting
    "survey-scam",
    "free-iphone",
    "free-gift-card",
    "claim-reward",
    "complete-survey",
    "win-prize",
    "congratulations-winner",
  ];

  if (highRiskPatterns.some((pattern) => urlLower.includes(pattern))) {
    return "high";
  }

  // Check for typosquatting of popular brands (Levenshtein distance check)
  const popularBrands = [
    "google",
    "facebook",
    "amazon",
    "paypal",
    "netflix",
    "apple",
    "microsoft",
    "instagram",
    "twitter",
    "linkedin",
    "youtube",
  ];

  try {
    let hostname = urlLower;
    if (urlLower.includes("://")) {
      hostname = urlLower.split("://")[1].split("/")[0].split("?")[0];
    }
    hostname = hostname.split(":")[0].replace("www.", "");

    // Check for common typosquatting patterns
    for (const brand of popularBrands) {
      // Check if hostname contains brand with number substitutions (go0gle, faceb00k)
      const brandWithNumbers = hostname.replace(/[0-9]/g, "");
      if (
        brandWithNumbers.includes(brand) &&
        hostname !== brand + ".com" &&
        !hostname.endsWith("." + brand + ".com")
      ) {
        // Likely typosquatting if it contains the brand name but isn't the official domain
        if (
          hostname.includes(brand) &&
          (hostname.match(/[0-9]/g) ||
            hostname.includes("-" + brand) ||
            hostname.includes(brand + "-"))
        ) {
          return "high";
        }
      }
    }
  } catch (e) {
    // Continue if parsing fails
  }

  // Check for suspicious multiple hyphens or numbers in domain
  try {
    let hostname = urlLower;
    if (urlLower.includes("://")) {
      hostname = urlLower.split("://")[1].split("/")[0];
    }
    hostname = hostname.split(":")[0].replace("www.", "");

    // Count hyphens and numbers
    const hyphenCount = (hostname.match(/-/g) || []).length;
    const numberCount = (hostname.match(/[0-9]/g) || []).length;

    // Multiple hyphens or many numbers can indicate phishing
    if (hyphenCount >= 3 || numberCount >= 4) {
      // But exclude legitimate cases like IP addresses or version numbers
      if (!hostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
        return "high";
      }
    }
  } catch (e) {
    // Continue if parsing fails
  }

  // MEDIUM: Executable files, archives, and suspicious file types
  // Check if URL contains these extensions (not just ends with)
  const mediumRiskExtensions = [
    // Executable files
    ".exe",
    ".msi",
    ".bat",
    ".cmd",
    ".com",
    ".scr",
    ".pif",

    // Scripts that can execute code
    ".vbs",
    ".vbe",
    ".wsf",
    ".wsh",
    ".ps1",
    ".psm1",

    // Archives (can hide malware)
    ".zip",
    ".rar",
    ".7z",
    ".tar",
    ".gz",
    ".bz2",
    ".cab",

    // Mobile executables
    ".apk",
    ".ipa",
    ".deb",
    ".xap",

    // Office macros (can contain malware)
    ".docm",
    ".xlsm",
    ".pptm",
    ".dotm",
    ".xltm",

    // Disk images
    ".iso",
    ".img",
    ".dmg",
    ".toast",
    ".vcd",

    // Java files
    ".jar",
    ".jnlp",

    // Installer packages
    ".pkg",
    ".rpm",
  ];

  // Check if URL contains these extensions anywhere in the path
  const pathPart = urlLower.split("?")[0].split("#")[0];
  if (
    mediumRiskExtensions.some((ext) => {
      // Check if extension appears in the URL path (not just at the end)
      return pathPart.includes(ext);
    })
  ) {
    return "medium";
  }

  // Additional medium risk patterns (check only if not already flagged as low)
  const mediumRiskPatterns = [
    "/download",
    "download.",
    "/install",
    "/setup",
    "/crack",
    "/torrent",
    "/warez",
    "/nulled",
    // URL shorteners
    "bit.ly",
    "tinyurl.com",
    "goo.gl",
    "t.co",
    "ow.ly",
    "is.gd",
    "buff.ly",
    "adf.ly",
    // Suspicious redirects
    "redirect",
    "goto.php",
    "out.php",
    "click.php",
    "track.php",
    // File sharing sites (can host malware)
    "mediafire",
    "mega.nz",
    "4shared",
    "rapidgator",
    "uploaded.net",
    // Adult content
    "/xxx/",
    "/adult/",
    "/nsfw/",
  ];

  // Check medium risk patterns more carefully
  if (mediumRiskPatterns.some((pattern) => urlLower.includes(pattern))) {
    return "medium";
  }

  // Check for suspicious URL structures
  try {
    // Very long URLs might be obfuscation attempts
    if (urlLower.length > 200) {
      return "medium";
    }

    // URLs with encoded characters might be hiding something
    const encodedCharCount = (urlLower.match(/%[0-9a-f]{2}/gi) || []).length;
    if (encodedCharCount > 10) {
      return "medium";
    }

    // URLs with many subdomains might be suspicious
    let hostname = urlLower;
    if (urlLower.includes("://")) {
      hostname = urlLower.split("://")[1].split("/")[0];
    }
    const subdomainCount = (hostname.match(/\./g) || []).length;
    if (subdomainCount > 4) {
      return "medium";
    }
  } catch (e) {
    // Continue if analysis fails
  }

  // Default: low risk for unknown URLs that passed all checks
  return "low";
}

export const SAFETY_TIPS = [
  "Never share your passwords with anyone, even if they claim to be from support.",
  "Always verify URLs before entering sensitive information - check for HTTPS and correct spelling.",
  "Enable two-factor authentication on all important accounts.",
  "Be skeptical of urgent messages asking for money or personal information.",
  "Keep your software and operating system up to date with security patches.",
  "Use strong, unique passwords for each account - consider a password manager.",
  "Don't click on suspicious links in emails or messages from unknown senders.",
  "Regularly backup your important data to prevent ransomware damage.",
  "Be cautious when downloading files - scan them with antivirus software first.",
  "Use a VPN when connecting to public Wi-Fi networks.",
];

export function getRandomSafetyTip() {
  return SAFETY_TIPS[Math.floor(Math.random() * SAFETY_TIPS.length)];
}
