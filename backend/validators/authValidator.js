const { z } = require('zod');

const registerSchema = z.object({
    username: z.string()
        .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
        .max(30, "Le nom d'utilisateur est trop long"),
    email: z.string()
        .email("Le format de l'adresse email est invalide"),
    password: z.string()
        .min(8, "Le mot de passe doit contenir au moins 8 caractères")
        .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
        .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
        .regex(/[^A-Za-z0-9]/, "Le mot de passe doit contenir au moins un caractère spécial (@, $, !, etc.)"),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)")
});

const loginSchema = z.object({
    email: z.string().email("Le format de l'adresse email est invalide"),
    password: z.string().min(1, "Le mot de passe est requis")
});

module.exports = {
    registerSchema,
    loginSchema,
};