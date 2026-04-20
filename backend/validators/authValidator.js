/* --------- authValidator --------- */
const { z } = require('zod');

/* --------- Def des regles pour l'inscription --------- */
// const registerSchema = z.object({
//     username: z.string()
//         .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
//         .max(30, "Le nom d'utilisateur est trop long"),
//     email: z.string()
//         .email("Le format de l'adresse email est invalide"),
//     password: z.string()
//         .min(8, "Le mot de passe doit contenir au moins 8 caractères")
//         .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
//         .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
//         .regex(/[^A-Za-z0-9]/, "Le mot de passe doit contenir au moins un caractère spécial (@, $, !, etc.)")
// });

// renverra psuedo + token
const registerSchema = z.object({
    username: z.string().min(8, "Minimum 8 caractères").max(30, "Maximum 30 caractères"),
    firebaseToken: z.string({ required_error: "Le token d'authentification est requis" })
});

/* --------- Def des regles pour la connexion --------- */

// on use juste le token
const loginSchema = z.object({
    firebaseToken: z.string({ required_error: "Le token d'authentification est requis" })
});

const socialLoginSchema = z.object({
    firebaseToken: z.string({ required_error: "Le Token d'authentification est requis" }),
});

module.exports = {
    registerSchema,
    loginSchema,
    socialLoginSchema
};