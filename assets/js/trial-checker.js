// assets/js/trial-checker.js - Verificar status do trial
import { supabase } from "./supabaseClient.js";

class TrialChecker {
  static async checkTrialStatus(userId) {
    try {
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("trial_end, subscription_status, plan_id")
        .eq("id", userId)
        .single();

      if (error) throw error;

      if (!profile) {
        return { isValid: false, reason: "Perfil não encontrado" };
      }

      // Verificar se está no período de trial
      if (profile.subscription_status === "trial" && profile.trial_end) {
        const trialEnd = new Date(profile.trial_end);
        const now = new Date();

        if (now > trialEnd) {
          return {
            isValid: false,
            reason: "Trial expirado",
            daysLeft: 0,
          };
        } else {
          const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
          return {
            isValid: true,
            daysLeft,
            trialEnd: profile.trial_end,
          };
        }
      }

      // Se não é trial, verificar subscription normal
      return await this.checkSubscriptionStatus(userId);
    } catch (error) {
      console.error("Erro ao verificar trial:", error);
      return { isValid: false, reason: "Erro na verificação" };
    }
  }

  static async checkSubscriptionStatus(userId) {
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (error || !subscription) {
      return { isValid: false, reason: "Assinatura não encontrada" };
    }

    const periodEnd = new Date(subscription.current_period_end);
    const now = new Date();

    if (now > periodEnd) {
      return { isValid: false, reason: "Assinatura expirada" };
    }

    return {
      isValid: true,
      daysLeft: Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24)),
      periodEnd: subscription.current_period_end,
    };
  }
}

// Exportar para uso global
window.TrialChecker = TrialChecker;
