const { z } = require('zod');

const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark']).optional(),
  language: z.enum(['en', 'fr']).optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  showAdultGames: z.boolean().optional(),
  privateProfile: z.boolean().optional(),
});

const profileUpdateSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  bio: z.string().max(1000).optional(),
  avatarUrl: z.string().optional().refine(
    (value) => !value || /^https?:\/\/.+/.test(value) || /^data:image\/[a-zA-Z]+;base64,/.test(value),
    { message: "URL d'avatar invalide" },
  ),
  website: z.string().url().optional(),
  birthDate: z.string().optional().refine(
    (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value),
    { message: "Date de naissance invalide" },
  ),
  preferences: preferencesSchema.optional(),
});

module.exports = {
  profileUpdateSchema,
  preferencesSchema,
};
