// dictionnaire_Jeu.js
// Clés de traduction pour le composant Jeu.jsx (page détail d'un jeu)

export const resources_jeu = {
  fr: {
    translation: {
      // Navigation / retour
      jeu_back: "Retour à la navigation",

      // Erreurs de chargement du jeu
      jeu_error_login_required_title: "Connexion requise",
      jeu_error_login_required_msg: "Connectez-vous pour voir ce contenu.",
      jeu_error_restricted_title: "Accès restreint",
      jeu_error_restricted_msg: "Vous n'avez pas accès à ce contenu.",
      jeu_error_not_found_title: "Jeu introuvable",
      jeu_error_not_found_msg: "Ce jeu n'existe pas ou n'est plus disponible.",
      jeu_error_generic_msg: "Impossible de charger ce jeu.",
      jeu_login_button: "Se connecter",

      // Favoris
      jeu_fav_in_collection: "Dans la collection",
      jeu_fav_add: "Ajouter aux favoris",
      jeu_fav_login_alert: "Connectez-vous pour ajouter un favori.",
      jeu_fav_update_error: "Erreur lors de la mise à jour des favoris.",

      // Forum
      jeu_forum_view_thread: "Voir le fil de discussion",
      jeu_forum_open_thread: "Ouvrir une discussion",

      // Informations
      jeu_info_title: "Informations",
      jeu_info_genres: "Genres :",
      jeu_info_platforms: "Plateformes :",
      jeu_info_release: "Sortie :",
      jeu_info_unknown_date: "Date inconnue",
      jeu_info_empty: "—",

      // Résumé
      jeu_summary_title: "Résumé",
      jeu_summary_translating: "Traduction…",
      jeu_summary_none_fr: "Aucun résumé disponible.",
      jeu_summary_none_en: "Aucun résumé disponible. (en)",

      // DLC & Extensions
      jeu_dlc_section_title: "DLC & Extensions",
      jeu_dlc_count_one: "contenu",
      jeu_dlc_count_many: "contenus",
      jeu_dlc_loading: "Chargement des DLC…",
      jeu_dlc_tab_dlc: "DLC",
      jeu_dlc_tab_expansion: "Expansions",
      jeu_dlc_label_dlc: "DLC",
      jeu_dlc_label_expansion: "Expansions",

      // Avis des joueurs
      jeu_reviews_title: "Avis des joueurs",
      jeu_reviews_cancel: "Annuler",
      jeu_reviews_edit_mine: "Modifier mon avis",
      jeu_reviews_rate: "Noter le jeu",
      jeu_reviews_your_rating: "Votre note",
      jeu_reviews_placeholder: "Partagez votre expérience... (optionnel)",
      jeu_reviews_sending: "Envoi...",
      jeu_reviews_update: "Mettre à jour",
      jeu_reviews_publish: "Publier mon avis",
      jeu_reviews_delete: "Supprimer",
      jeu_reviews_delete_confirm: "Supprimer votre avis ?",
      jeu_reviews_delete_error: "Erreur lors de la suppression.",
      jeu_reviews_login_to_review: "Connectez-vous pour laisser un avis.",
      jeu_reviews_choose_rating: "Veuillez choisir une note.",
      jeu_reviews_send_error: "Erreur lors de l'envoi de votre avis.",
      jeu_reviews_empty: "Aucun avis pour le moment. Soyez le premier !",
      jeu_reviews_you_suffix: "(vous)",
      jeu_reviews_anonymous: "Anonyme",

      // Like / Répondre / Signaler / Supprimer (reviews)
      jeu_reviews_login_to_like: "Connectez-vous pour aimer un avis.",
      jeu_reviews_reply: "Répondre",
      jeu_reviews_reply_cancel: "Annuler",
      jeu_reviews_report: "Signaler",
      jeu_reviews_report_review_title: "Signaler cet avis",
      jeu_reviews_admin_delete_confirm: "Supprimer définitivement cet avis ?",
      jeu_reviews_admin_delete_title: "Supprimer (Admin)",
      jeu_reviews_admin_delete_error:
        "Erreur lors de la suppression de l'avis.",

      // Réponse à un avis (commentaires)
      jeu_comment_login_to_comment: "Connectez-vous pour commenter.",
      jeu_comment_placeholder: "Écrire une réponse...",
      jeu_comment_send: "Envoyer",
      jeu_comment_sending: "Envoi...",
      jeu_comment_cancel: "Annuler",
      jeu_comment_send_error: "Erreur lors de l'envoi du commentaire.",
      jeu_comment_report_title: "Signaler ce commentaire",
      jeu_comment_admin_delete_title: "Supprimer (Admin)",
      jeu_comment_admin_delete_confirm:
        "Supprimer ce commentaire définitivement ?",
      jeu_comment_admin_delete_success: "Commentaire supprimé avec succès.",
      jeu_comment_admin_delete_error:
        "Erreur lors de la suppression du commentaire.",

      // Jeux similaires
      jeu_similar_title: "Jeux similaires",
      jeu_similar_prev: "Précédent",
      jeu_similar_next: "Suivant",

      // Modale de signalement
      jeu_report_modal_title: "Signaler un abus",
      jeu_report_modal_close: "Fermer",
      jeu_report_modal_cancel: "Annuler",
      jeu_report_modal_submit: "Envoyer le signalement",
      jeu_report_modal_success_title: "Signalement envoyé",
      jeu_report_modal_success_review:
        "L'avis a été signalé à l'équipe de modération.",
      jeu_report_modal_success_comment:
        "Le commentaire a été signalé à l'équipe de modération.",
      jeu_report_modal_prompt_review:
        "Veuillez sélectionner la raison pour laquelle vous estimez que cet avis enfreint nos conditions d'utilisation.",
      jeu_report_modal_prompt_comment:
        "Veuillez sélectionner la raison pour laquelle vous estimez que ce commentaire enfreint nos conditions d'utilisation.",
      jeu_report_modal_invalid_reason: "Veuillez indiquer un motif valide.",
      jeu_report_modal_submit_error:
        "Une erreur s'est produite lors de l'envoi.",
      jeu_report_modal_custom_placeholder:
        "Renseignez des détails complémentaires concernant l'infraction...",

      // Motifs de signalement
      jeu_report_reason_spam: "Spam / Publicité",
      jeu_report_reason_harassment: "Harcèlement / Intimidation",
      jeu_report_reason_hate: "Propos haineux ou injurieux",
      jeu_report_reason_inappropriate: "Contenu inapproprié",
      jeu_report_reason_other: "Autre motif (préciser ci-dessous)",
    },
  },
  en: {
    translation: {
      // Navigation / back
      jeu_back: "Back to browsing",

      // Game loading errors
      jeu_error_login_required_title: "Login Required",
      jeu_error_login_required_msg: "Please log in to view this content.",
      jeu_error_restricted_title: "Restricted Access",
      jeu_error_restricted_msg: "You don't have access to this content.",
      jeu_error_not_found_title: "Game Not Found",
      jeu_error_not_found_msg:
        "This game doesn't exist or is no longer available.",
      jeu_error_generic_msg: "Unable to load this game.",
      jeu_login_button: "Log in",

      // Favorites
      jeu_fav_in_collection: "In your collection",
      jeu_fav_add: "Add to favorites",
      jeu_fav_login_alert: "Please log in to add a favorite.",
      jeu_fav_update_error: "Error updating favorites.",

      // Forum
      jeu_forum_view_thread: "View discussion thread",
      jeu_forum_open_thread: "Start a discussion",

      // Information
      jeu_info_title: "Information",
      jeu_info_genres: "Genres:",
      jeu_info_platforms: "Platforms:",
      jeu_info_release: "Release:",
      jeu_info_unknown_date: "Unknown date",
      jeu_info_empty: "—",

      // Summary
      jeu_summary_title: "Summary",
      jeu_summary_translating: "Translating…",
      jeu_summary_none_fr: "No summary available. (fr)",
      jeu_summary_none_en: "No summary available.",

      // DLC & Expansions
      jeu_dlc_section_title: "DLC & Expansions",
      jeu_dlc_count_one: "item",
      jeu_dlc_count_many: "items",
      jeu_dlc_loading: "Loading DLC…",
      jeu_dlc_tab_dlc: "DLC",
      jeu_dlc_tab_expansion: "Expansions",
      jeu_dlc_label_dlc: "DLC",
      jeu_dlc_label_expansion: "Expansions",

      // Player reviews
      jeu_reviews_title: "Player Reviews",
      jeu_reviews_cancel: "Cancel",
      jeu_reviews_edit_mine: "Edit my review",
      jeu_reviews_rate: "Rate this game",
      jeu_reviews_your_rating: "Your rating",
      jeu_reviews_placeholder: "Share your experience... (optional)",
      jeu_reviews_sending: "Sending...",
      jeu_reviews_update: "Update",
      jeu_reviews_publish: "Post my review",
      jeu_reviews_delete: "Delete",
      jeu_reviews_delete_confirm: "Delete your review?",
      jeu_reviews_delete_error: "Error deleting review.",
      jeu_reviews_login_to_review: "Please log in to leave a review.",
      jeu_reviews_choose_rating: "Please choose a rating.",
      jeu_reviews_send_error: "Error submitting your review.",
      jeu_reviews_empty: "No reviews yet. Be the first!",
      jeu_reviews_you_suffix: "(you)",
      jeu_reviews_anonymous: "Anonymous",

      // Like / Reply / Report / Delete (reviews)
      jeu_reviews_login_to_like: "Please log in to like a review.",
      jeu_reviews_reply: "Reply",
      jeu_reviews_reply_cancel: "Cancel",
      jeu_reviews_report: "Report",
      jeu_reviews_report_review_title: "Report this review",
      jeu_reviews_admin_delete_confirm: "Permanently delete this review?",
      jeu_reviews_admin_delete_title: "Delete (Admin)",
      jeu_reviews_admin_delete_error: "Error deleting the review.",

      // Reply to a review (comments)
      jeu_comment_login_to_comment: "Please log in to comment.",
      jeu_comment_placeholder: "Write a reply...",
      jeu_comment_send: "Send",
      jeu_comment_sending: "Sending...",
      jeu_comment_cancel: "Cancel",
      jeu_comment_send_error: "Error sending the comment.",
      jeu_comment_report_title: "Report this comment",
      jeu_comment_admin_delete_title: "Delete (Admin)",
      jeu_comment_admin_delete_confirm: "Permanently delete this comment?",
      jeu_comment_admin_delete_success: "Comment successfully deleted.",
      jeu_comment_admin_delete_error: "Error deleting the comment.",

      // Similar games
      jeu_similar_title: "Similar Games",
      jeu_similar_prev: "Previous",
      jeu_similar_next: "Next",

      // Report modal
      jeu_report_modal_title: "Report Abuse",
      jeu_report_modal_close: "Close",
      jeu_report_modal_cancel: "Cancel",
      jeu_report_modal_submit: "Submit Report",
      jeu_report_modal_success_title: "Report Submitted",
      jeu_report_modal_success_review:
        "This review has been reported to the moderation team.",
      jeu_report_modal_success_comment:
        "This comment has been reported to the moderation team.",
      jeu_report_modal_prompt_review:
        "Please select the reason you believe this review violates our terms of use.",
      jeu_report_modal_prompt_comment:
        "Please select the reason you believe this comment violates our terms of use.",
      jeu_report_modal_invalid_reason: "Please provide a valid reason.",
      jeu_report_modal_submit_error:
        "An error occurred while sending the report.",
      jeu_report_modal_custom_placeholder:
        "Please provide additional details about the violation...",

      // Report reasons
      jeu_report_reason_spam: "Spam / Advertising",
      jeu_report_reason_harassment: "Harassment / Bullying",
      jeu_report_reason_hate: "Hateful or abusive content",
      jeu_report_reason_inappropriate: "Inappropriate content",
      jeu_report_reason_other: "Other (please specify below)",
    },
  },
};
