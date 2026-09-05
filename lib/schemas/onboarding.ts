import { z } from "zod";

export const onboardingSchema = z.object({
  balance: z
    .string()
    .min(1, "Balance is required.")
    .refine(
      (value) => {
        const num = parseFloat(value.replace(/,/g, ""));
        return !isNaN(num) && num >= 0;
      },
      { message: "Please enter a valid amount." },
    ),
});

export type OnboardingFormValue = z.infer<typeof onboardingSchema>;
