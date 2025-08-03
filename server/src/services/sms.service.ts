import { env } from "../env";
import { normalizePhoneNumber } from "../utils/phone";

interface SMSConfig {
  appId: string;
  token: string;
  senderId: string;
  senderIdValue: string;
}

class SMSService {
  private config: SMSConfig | null = null;
  private isEnabled = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const appId = env.BULKGATE_APPID;
    const token = env.BULKGATE_TOKEN;

    if (appId && token) {
      this.config = {
        appId,
        token,
        senderId: "g-35167",
        senderIdValue: "Parrocchia",
      };

      this.isEnabled = true;
      console.log("✅ SMS Service initialized with BulkGate");
    } else {
      console.warn("⚠️ SMS Service disabled - Missing BulkGate configuration");
      console.warn(
        "Required environment variables: BULKGATE_APPID, BULKGATE_TOKEN",
      );
      this.isEnabled = false;
    }
  }

  /**
   * Check if SMS service is properly configured and enabled
   */
  public isConfigured(): boolean {
    return this.isEnabled && this.config !== null;
  }

  /**
   * Send SMS message using BulkGate API
   */
  public async sendSMS(
    to: string,
    message: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured()) {
      console.warn("⚠️ SMS Service not configured - message not sent");
      return {
        success: false,
        error: "SMS service not configured",
      };
    }

    try {
      // Normalize the phone number before sending
      const normalizedPhone = normalizePhoneNumber(to);
      if (!normalizedPhone) {
        return {
          success: false,
          error: "Invalid phone number format",
        };
      }

      const response = await fetch(
        "https://portal.bulkgate.com/api/1.0/simple/transactional",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            application_id: this.config!.appId,
            application_token: this.config!.token,
            number: normalizedPhone,
            text: message,
            sender_id: this.config!.senderId,
            sender_id_value: this.config!.senderIdValue,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ BulkGate API error:", errorText);
        return {
          success: false,
          error: `BulkGate API error: ${response.status}`,
        };
      }

      const result = await response.json();
      console.log(`📱 SMS sent successfully to ${to} via BulkGate`);

      return {
        success: true,
        messageId: result.data?.sms_id || "unknown",
      };
    } catch (error) {
      console.error("❌ Failed to send SMS via BulkGate:", error);

      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send invitation SMS
   */
  public async sendInvitationSMS(
    phoneNumber: string,
    familyName: string,
    inviteUrl: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = `Sei stato invitato a unirti alla famiglia "${familyName}"!\n\nClicca qui per accettare l'invito:\n${inviteUrl}\n\nL'invito scade tra 7 giorni.`;

    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Validate phone number format (uses the same validation as auth)
   */
  public validatePhoneNumber(phoneNumber: string): boolean {
    return normalizePhoneNumber(phoneNumber) !== null;
  }

  /**
   * Get service status
   */
  public getStatus(): {
    enabled: boolean;
    configured: boolean;
    provider: string;
  } {
    return {
      enabled: this.isEnabled,
      configured: this.isConfigured(),
      provider: "BulkGate",
    };
  }
}

// Export singleton instance
export const smsService = new SMSService();
