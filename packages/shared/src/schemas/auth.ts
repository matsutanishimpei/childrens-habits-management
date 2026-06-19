import { z } from 'zod';

export const AuthSchema = z.object({
  name: z.string().min(1, '家庭名を入力してください').max(50, '家庭名は50文字以内で入力してください'),
  passcode: z.string().min(4, '合言葉は4文字以上で入力してください').max(50, '合言葉は50文字以内で入力してください'),
});

export const FamilySchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type AuthInput = z.infer<typeof AuthSchema>;
export type Family = z.infer<typeof FamilySchema>;
