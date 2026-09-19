import { CategoryKey } from "@/constants/transactions";
import { z } from "zod";

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  account_id: z.string().min(1, "Select an account"),
  amount: z
    .string()
    .min(1, "Enter an amount.")
    .refine((v) => {
      let num = parseFloat(v.replace(/,/g, ""));
      return !Number.isNaN(num) && num > 0;
    }, "Enter a valid number."),
  category: z.custom<CategoryKey>((v) => typeof v === "string"),
  description: z.string().optional(),
  date: z.date(),
});

export type transactionFormValues = z.infer<typeof transactionSchema>;
