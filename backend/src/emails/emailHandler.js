import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { resendClient, sender } from "../utils/resend.js";
import { WelcomeEmailTemplate } from "../emails/emailTemplate.js";

export const sendWelcomeEmail = asyncHandler(async (email, name, clientURL) => {
  const { data, error } = await resendClient.emails.send({
    from: `${sender.name} <${sender.email}>`,
    to: email,
    subject: "Welcome to Chatify!",
    html: WelcomeEmailTemplate(name, clientURL),
  });

  if (error) {
    throw new ApiError(500, "Failed to send welcome email");
  }

  console.log("Welcome Email sent successfully", data);
})