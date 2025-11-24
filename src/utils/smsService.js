import { supabase } from "./supabaseClient";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

/**
 * Analyze SMS message using Groq AI (llama-3.1-8b-instant)
 * Classifies SMS as: safe, suspicious, or dangerous
 */
export async function analyzeSMS(message) {
  if (!GROQ_API_KEY) {
    console.error("Groq API key is not configured");
    return { risk_level: "safe", explanation: "AI analysis unavailable" };
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `You are an SMS security analyst. Classify SMS messages into exactly one of two categories:

1. "safe" - Legitimate messages from verified sources:
   - Bank transaction alerts from official numbers
   - OTPs from legitimate services (Amazon, Google, etc.)
   - Delivery notifications from trusted companies
   - Government service updates from official channels
   - Genuine promotional messages from known brands

2. "dangerous" - Any potentially harmful or fraudulent messages:
   - Phishing links impersonating banks/government
   - Fake OTP messages asking to share codes
   - Messages demanding immediate payment with threats
   - Lottery/prize scams asking for bank details or fees
   - UPI fraud requesting PIN/CVV/OTP
   - KYC update scams with suspicious links
   - Tax refund scams with fake government links
   - Work-from-home job offers requiring registration fees
   - Investment schemes with guaranteed returns
   - Too-good-to-be-true deals and discounts
   - Survey scams offering rewards
   - Unsolicited loan offers
   - Any message asking for money, credentials, or personal information

CRITICAL: When in doubt, classify as "dangerous". Better safe than sorry.

Respond ONLY with a JSON object in this exact format:
{"risk_level": "safe|dangerous", "explanation": "Brief 1-2 sentence reason"}`,
          },
          {
            role: "user",
            content: `Classify this SMS message:\n\nSender: ${message.sender_number}\nMessage: ${message.message_text}\n\nAnalyze carefully and choose the correct risk level.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to analyze SMS");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";

    // Parse JSON response
    try {
      const result = JSON.parse(content);
      return {
        risk_level: result.risk_level || "safe",
        explanation: result.explanation || "No explanation provided",
      };
    } catch (parseError) {
      // Fallback parsing if AI doesn't return perfect JSON
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes("dangerous")) {
        return { risk_level: "dangerous", explanation: content };
      } else if (lowerContent.includes("suspicious")) {
        return { risk_level: "suspicious", explanation: content };
      } else {
        return { risk_level: "safe", explanation: content };
      }
    }
  } catch (error) {
    console.error("Error analyzing SMS:", error);
    // Default to safe if analysis fails to avoid false positives
    return {
      risk_level: "safe",
      explanation: "Analysis failed - defaulting to safe",
    };
  }
}

/**
 * Update SMS risk level in Supabase
 */
export async function updateSMSRiskLevel(messageId, riskLevel, explanation) {
  try {
    const { error } = await supabase
      .from("sms_messages")
      .update({
        risk_level: riskLevel,
        ai_explanation: explanation,
        analyzed_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating SMS risk level:", error);
    return false;
  }
}

/**
 * Check if sender is blocked from sending to a specific receiver
 */
export async function isBlocked(senderNumber, receiverNumber) {
  try {
    const { data, error } = await supabase
      .from("reported_numbers")
      .select("report_count, reported_by")
      .eq("sender_number", senderNumber)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!data) {
      return false; // Not reported at all
    }

    // Blocked if: reported 3+ times AND receiver is in the reported_by list
    const isReporterInList =
      data.reported_by?.includes(receiverNumber) || false;
    const hasEnoughReports = data.report_count >= 3;

    return isReporterInList && hasEnoughReports;
  } catch (error) {
    console.error("Error checking block status:", error);
    return false; // Default to not blocked on error
  }
}

/**
 * Send SMS message (Scammer console)
 * Checks if sender is blocked before sending
 */
export async function sendSMS(senderNumber, receiverNumber, messageText) {
  try {
    // Check if sender is blocked from sending to this receiver
    const blocked = await isBlocked(senderNumber, receiverNumber);

    if (blocked) {
      console.log(`Blocked: ${senderNumber} cannot send to ${receiverNumber}`);
      return {
        success: false,
        error:
          "This number has been blocked by the recipient due to multiple spam reports.",
        blocked: true,
      };
    }

    const { data, error } = await supabase
      .from("sms_messages")
      .insert([
        {
          sender_number: senderNumber,
          receiver_number: receiverNumber,
          message_text: messageText,
          risk_level: "pending",
          sent_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;

    const newMessage = data[0];

    // Immediately analyze the message
    console.log("Analyzing SMS immediately after send...");
    const analysis = await analyzeSMS(newMessage);
    console.log("Analysis complete:", analysis);

    // Update the database with analysis
    await updateSMSRiskLevel(
      newMessage.id,
      analysis.risk_level,
      analysis.explanation
    );

    console.log("Database updated with risk level:", analysis.risk_level);

    return {
      success: true,
      data: {
        ...newMessage,
        risk_level: analysis.risk_level,
        ai_explanation: analysis.explanation,
      },
    };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch SMS messages for a user
 */
export async function fetchUserSMS(receiverNumber, riskFilter = null) {
  try {
    let query = supabase
      .from("sms_messages")
      .select("*")
      .eq("receiver_number", receiverNumber)
      .order("sent_at", { ascending: false });

    if (riskFilter) {
      query = query.eq("risk_level", riskFilter);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching SMS messages:", error);
    return [];
  }
}

/**
 * Subscribe to real-time SMS updates
 */
export function subscribeToSMS(receiverNumber, callback) {
  const channel = supabase
    .channel(`sms-realtime-${receiverNumber}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "sms_messages",
        filter: `receiver_number=eq.${receiverNumber}`,
      },
      async (payload) => {
        const newMessage = payload.new;

        console.log("New SMS received:", newMessage);

        // Analyze the message immediately if pending
        if (newMessage.risk_level === "pending") {
          console.log("Analyzing message with Groq AI...");

          try {
            const analysis = await analyzeSMS(newMessage);
            console.log("Analysis result:", analysis);

            const updated = await updateSMSRiskLevel(
              newMessage.id,
              analysis.risk_level,
              analysis.explanation
            );

            console.log("Database updated:", updated);

            // Update the message object with analysis results
            newMessage.risk_level = analysis.risk_level;
            newMessage.ai_explanation = analysis.explanation;
            newMessage.analyzed_at = new Date().toISOString();
          } catch (error) {
            console.error("Error analyzing SMS:", error);
          }
        }

        // Call callback with INSERT event
        callback(newMessage, "insert");
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "sms_messages",
        filter: `receiver_number=eq.${receiverNumber}`,
      },
      (payload) => {
        console.log("SMS updated:", payload.new);
        callback(payload.new, "update");
      }
    )
    .subscribe((status) => {
      console.log("Realtime subscription status:", status);
    });

  return channel;
}

/**
 * Delete SMS message
 */
export async function deleteSMS(messageId) {
  try {
    const { error } = await supabase
      .from("sms_messages")
      .delete()
      .eq("id", messageId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error deleting SMS:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Report a sender number as spam/scam
 * Increments report count and adds reporter to the list
 */
export async function reportSender(senderNumber, reporterNumber) {
  try {
    // Check if sender is already reported
    const { data: existing, error: fetchError } = await supabase
      .from("reported_numbers")
      .select("*")
      .eq("sender_number", senderNumber)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 = no rows found, which is OK
      throw fetchError;
    }

    if (existing) {
      // Update existing record - increment count and add reporter to array
      const updatedReportedBy = existing.reported_by || [];
      updatedReportedBy.push(reporterNumber);

      const { data, error } = await supabase
        .from("reported_numbers")
        .update({
          report_count: existing.report_count + 1,
          reported_by: updatedReportedBy,
          updated_at: new Date().toISOString(),
        })
        .eq("sender_number", senderNumber)
        .select()
        .single();

      if (error) throw error;

      console.log(
        `Sender ${senderNumber} reported by ${reporterNumber}. Total reports: ${data.report_count}`
      );
      return {
        success: true,
        reportCount: data.report_count,
        isBlocked: data.report_count >= 3,
      };
    } else {
      // Create new record
      const { data, error } = await supabase
        .from("reported_numbers")
        .insert([
          {
            sender_number: senderNumber,
            report_count: 1,
            reported_by: [reporterNumber],
          },
        ])
        .select()
        .single();

      if (error) throw error;

      console.log(
        `First report for sender ${senderNumber} by ${reporterNumber}`
      );
      return { success: true, reportCount: 1, isBlocked: false };
    }
  } catch (error) {
    console.error("Error reporting sender:", error);
    return { success: false, error: error.message };
  }
}
