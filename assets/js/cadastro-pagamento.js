// assets/js/cadastro-pagamento.js
// Versão revisada — CONFIRMAÇÃO AUTOMÁTICA, sem redirect_to que causava "Database error updating user"
import { supabase } from "./supabaseClient.js";

document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 Página de cadastro Trial carregada");

  // Toggle password visibility
  const togglePassword = document.querySelector(".toggle-password");
  if (togglePassword) {
    togglePassword.addEventListener("click", () => {
      const passwordInput = document.getElementById("senha");
      const icon = togglePassword.querySelector("i");
      if (!passwordInput || !icon) return;
      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        icon.classList.replace("bi-eye", "bi-eye-slash");
      } else {
        passwordInput.type = "password";
        icon.classList.replace("bi-eye-slash", "bi-eye");
      }
    });
  }

  // Form submit
  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await createTrialAccount();
    });
  }
});

// Validação simples do formulário
function validateForm() {
  const nome = document.getElementById("nome")?.value?.trim() || "";
  const email = document.getElementById("email")?.value?.trim() || "";
  const cpf_cnpj = document.getElementById("cpf_cnpj")?.value?.trim() || "";
  const senha = document.getElementById("senha")?.value || "";
  const terms = document.getElementById("terms")?.checked || false;

  // reset validação visual
  document
    .querySelectorAll(".is-invalid")
    .forEach((el) => el.classList.remove("is-invalid"));

  let isValid = true;

  if (!nome) {
    document.getElementById("nome")?.classList.add("is-invalid");
    isValid = false;
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById("email")?.classList.add("is-invalid");
    isValid = false;
  }

  const cleanCpfCnpj = cpf_cnpj.replace(/\D/g, "");
  if (
    !cleanCpfCnpj ||
    (cleanCpfCnpj.length !== 11 && cleanCpfCnpj.length !== 14)
  ) {
    document.getElementById("cpf_cnpj")?.classList.add("is-invalid");
    isValid = false;
  }

  if (!senha || senha.length < 8) {
    document.getElementById("senha")?.classList.add("is-invalid");
    isValid = false;
  }

  if (!terms) {
    alert("Você precisa aceitar os termos de serviço.");
    isValid = false;
  }

  return isValid;
}

// Função principal de criação da conta (fluxo: signUp sem redirect, upsert profile, criar assinatura, company_profile)
async function createTrialAccount() {
  if (!validateForm()) return;

  const btnCadastrar = document.getElementById("btn-cadastrar");
  const submitText = btnCadastrar?.querySelector(".submit-text");
  const spinner = document.getElementById("spinner");

  if (btnCadastrar) btnCadastrar.disabled = true;
  if (submitText) submitText.classList.add("d-none");
  if (spinner) spinner.classList.remove("d-none");

  try {
    // Coleta dados do formulário
    const userData = {
      nome: document.getElementById("nome")?.value?.trim(),
      email: document.getElementById("email")?.value?.trim(),
      cpf_cnpj: document.getElementById("cpf_cnpj")?.value?.replace(/\D/g, ""),
      senha: document.getElementById("senha")?.value,
      telefone: document.getElementById("telefone")?.value?.trim() || null,
    };

    console.log("📝 Criando conta trial para:", userData.email);

    // Verifica duplicidade em user_profiles (controle no seu domínio)
    const { data: existingEmail } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("email", userData.email)
      .maybeSingle();

    if (existingEmail) {
      throw new Error("Este email já está cadastrado.");
    }

    const { data: existingDoc } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("cpf_cnpj", userData.cpf_cnpj)
      .maybeSingle();

    if (existingDoc) {
      throw new Error("Este CPF/CNPJ já está cadastrado.");
    }

    // ======= SIGNUP =======
    // IMPORTANT: NÃO enviar redirect/emailRedirectTo aqui para evitar conflito com confirmação automática.
    console.log("🔐 Criando usuário no Auth (sem redirect)...");

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.senha,
      // sem options.emailRedirectTo para modo de confirmação automática
    });

    if (authError) {
      console.error("❌ Erro no Auth:", authError);
      // tratar mensagens comuns de forma amigável
      if (authError.message?.toLowerCase()?.includes("already registered")) {
        throw new Error("Este email já está cadastrado. Tente fazer login.");
      }
      if (
        authError.status === 429 ||
        authError.message?.toLowerCase()?.includes("rate limit")
      ) {
        throw new Error(
          "Muitas tentativas. Aguarde alguns minutos e tente novamente."
        );
      }
      throw new Error(
        `Erro ao criar conta: ${authError.message || authError.toString()}`
      );
    }

    if (!authData || !authData.user) {
      throw new Error(
        "Erro inesperado ao criar usuário (sem dados retornados)."
      );
    }

    const userId = authData.user.id;
    console.log("✅ Usuário Auth criado:", userId);

    // ======= AUTO CONFIRM (apenas atualiza sua tabela de perfis)
    // Não usamos service_role no frontend — apenas marcamos como confirmado em user_profiles
    await safeUpsertUserProfile(userId, userData);

    // ======= Criar assinatura trial
    const trialStart = new Date();
    const trialEnd = new Date(trialStart);
    trialEnd.setDate(trialEnd.getDate() + 30);

    const { error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan_id: 0,
        status: "trialing",
        payment_method: "trial",
        current_period_start: trialStart.toISOString(),
        current_period_end: trialEnd.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (subscriptionError) {
      console.warn(
        "⚠️ Aviso: erro ao criar subscription (não crítico):",
        subscriptionError
      );
    }

    // ======= Company profile
    const { error: companyError } = await supabase
      .from("company_profiles")
      .upsert({
        user_id: userId,
        name: `${userData.nome} - Empresa`,
        email: userData.email,
        phone: userData.telefone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (companyError) {
      console.warn(
        "⚠️ Aviso: erro ao criar company_profiles (não crítico):",
        companyError
      );
    }

    console.log("🎉 Conta criada com sucesso!");
    showSuccessModal(userData, trialEnd);
  } catch (error) {
    console.error("❌ Erro ao criar conta:", error);
    // mensagem amigável
    const msg = error && error.message ? error.message : String(error);
    alert(`Erro: ${msg}`);
  } finally {
    if (btnCadastrar) btnCadastrar.disabled = false;
    if (submitText) submitText.classList.remove("d-none");
    if (spinner) spinner.classList.add("d-none");
  }
}

// Upsert do perfil do usuário de forma segura (marca email confirmado no perfil local)
async function safeUpsertUserProfile(userId, userData) {
  try {
    const now = new Date().toISOString();
    const payload = {
      id: userId, // usar id do auth como pk
      email: userData.email,
      full_name: userData.nome,
      cpf_cnpj: userData.cpf_cnpj,
      phone: userData.telefone,
      plan_id: 0,
      subscription_status: "trialing",
      trial_start: now,
      trial_end: new Date(
        new Date(now).setDate(new Date(now).getDate() + 30)
      ).toISOString(),
      trial_days_used: 0,
      created_at: now,
      updated_at: now,
      email_confirmed_at: now, // marca como confirmado no perfil local
    };

    const { error } = await supabase.from("user_profiles").upsert(payload);
    if (error) {
      // Se a inserção falhar por constraint do banco, apenas logamos — não interrompemos totalmente
      console.warn("⚠️ Falha ao upsert em user_profiles:", error);
    } else {
      console.log("✅ user_profiles atualizado/criado com sucesso");
    }
  } catch (err) {
    console.error("❌ Exceção no safeUpsertUserProfile:", err);
  }
}

// Modal de sucesso — sem e-mail de confirmação
function showSuccessModal(userData, trialEnd) {
  // remover modal anterior se existir
  const existing = document.getElementById("successModalContainer");
  if (existing) existing.remove();

  const modalHtml = `
    <div class="modal fade show d-block" id="successModal" tabindex="-1" style="background: rgba(0,0,0,0.55); position: fixed; inset: 0; z-index: 1050;">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content shadow-lg">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title"><i class="bi bi-check-circle-fill me-2"></i>Conta criada e ativada!</h5>
            <button type="button" class="btn-close btn-close-white" onclick="closeSuccessModal()"></button>
          </div>

          <div class="modal-body">
            <div class="text-center mb-3">
              <i class="bi bi-person-check-fill" style="font-size: 3.5rem; color: #198754;"></i>
            </div>
            <p class="text-center mb-3">
              Sua conta trial foi ativada com sucesso!<br>
              Agora você já pode acessar o sistema imediatamente.
            </p>

            <ul class="list-unstyled mb-3">
              <li><strong>Nome:</strong> ${userData.nome}</li>
              <li><strong>Email:</strong> ${userData.email}</li>
              <li><strong>Trial válido até:</strong> ${trialEnd.toLocaleDateString(
                "pt-BR"
              )}</li>
            </ul>

            <div class="alert alert-success mt-2">
              <small>Bem-vindo(a)! Aproveite 30 dias de acesso completo aos recursos da plataforma.</small>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline-secondary" onclick="closeSuccessModal()">Fechar</button>
            <button class="btn btn-primary" onclick="goToLogin()">Acessar o Sistema</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const cont = document.createElement("div");
  cont.id = "successModalContainer";
  cont.innerHTML = modalHtml;
  document.body.appendChild(cont);
  document.body.style.overflow = "hidden";
}

window.closeSuccessModal = function () {
  const modal = document.getElementById("successModalContainer");
  if (modal) modal.remove();
  document.body.style.overflow = "auto";
};

window.goToLogin = function () {
  window.closeSuccessModal();
  window.location.href = "https://sarmtech.netlify.app/login/login.html";
};

// Export globals
window.createTrialAccount = createTrialAccount;
window.validateForm = validateForm;
