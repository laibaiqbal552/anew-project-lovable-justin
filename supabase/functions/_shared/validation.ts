import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

// Common validation schemas for edge functions
export const businessNameSchema = z.string().trim().min(1, "Business name is required").max(200, "Business name too long")

export const websiteUrlSchema = z.string().url("Invalid URL format").max(500, "URL too long").optional().or(z.literal(''))

export const addressSchema = z.string().trim().max(500, "Address too long").optional()

export const phoneNumberSchema = z.string().regex(/^[+0-9\s()-]*$/, "Invalid phone number format").max(20, "Phone number too long").optional().or(z.literal(''))

export const emailSchema = z.string().email("Invalid email format").max(255, "Email too long").optional()

export const reportIdSchema = z.string().uuid("Invalid report ID format").optional()

export const businessIdSchema = z.string().uuid("Invalid business ID format").optional()

// Comprehensive brand analysis request schema
export const comprehensiveBrandAnalysisSchema = z.object({
  businessName: businessNameSchema,
  websiteUrl: websiteUrlSchema,
  address: addressSchema,
  phoneNumber: phoneNumberSchema,
  industry: z.string().max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  socialProfiles: z.array(z.any()).optional(),
  reportId: reportIdSchema
})

// Reputation analysis request schema
export const reputationAnalysisSchema = z.object({
  businessName: businessNameSchema,
  websiteUrl: websiteUrlSchema,
  address: addressSchema,
  phoneNumber: phoneNumberSchema,
  phone: phoneNumberSchema,
  reportId: reportIdSchema
})

// Google reviews request schema
export const googleReviewsSchema = z.object({
  businessName: businessNameSchema,
  address: addressSchema,
  website: websiteUrlSchema
})

// Validation helper function
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      return { success: false, error: messages }
    }
    return { success: false, error: 'Validation failed' }
  }
}