import { z } from "zod";

export const signUpSchema = z.object({
  firstName: z.string().min(1, "First Name is required."),
  lastName: z.string().min(1, "Last Name is required"),
  email: z.email("Invalid Email Address").min(1, "Email is required"),
  password: z.string().min(8, "Password must be atleast 8 characters"),
});

export type SignUpFormValue = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.email("Invalid Email Address").min(1, "Email is required"),
  password: z.string().min(8, "Password must be atleast 8 characters"),
});

export type SignInFormValue = z.infer<typeof signInSchema>;

export const codeSchema = z.object({
  code: z
    .string()
    .min(6, "Verification code must be 6 digits")
    .max(6, "Verification code must be 6 digits")
    .regex(/\d+/, "Verification code must contain only digits"),
});

export type CodeFormValue = z.infer<typeof codeSchema>;
