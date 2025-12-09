// assets/js/cadastro-pagamento.js - VERSÃO CORRIGIDA
import { supabase } from "./supabaseClient.js";

document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 Página de cadastro Trial carregada");

  // Limpar qualquer sessão existente
  supabase.auth.signOut().catch(() => {});

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

// Função principal de criação da conta
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

    // Verifica duplicidade em user_profiles
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

    // ======= SIGNUP com configuração específica =======
    console.log("🔐 Criando usuário no Auth...");

    // TRY 1: Tenta criar usuário sem opções adicionais
    let authData, authError;

    try {
      const result = await supabase.auth.signUp({
        email: userData.email,
        password: userData.senha,
        options: {
          data: {
            full_name: userData.nome,
            phone: userData.telefone,
          },
        },
      });

      authData = result.data;
      authError = result.error;
    } catch (signupError) {
      console.error("Erro no signUp:", signupError);
      // TRY 2: Tenta método alternativo se o primeiro falhar
      const result = await supabase.auth.signUp({
        email: userData.email,
        password: userData.senha,
      });

      authData = result.data;
      authError = result.error;
    }

    if (authError) {
      console.error("❌ Erro no Auth:", authError);

      // Tratamento específico de erros
      if (
        authError.message?.includes("already registered") ||
        authError.message?.includes("already exists")
      ) {
        throw new Error(
          "Este email já está cadastrado. Tente fazer login ou recuperar senha."
        );
      }

      if (
        authError.message?.includes("rate limit") ||
        authError.status === 429
      ) {
        throw new Error(
          "Muitas tentativas. Aguarde alguns minutos e tente novamente."
        );
      }

      if (authError.message?.includes("password")) {
        throw new Error(
          "A senha não atende aos requisitos de segurança. Use pelo menos 8 caracteres."
        );
      }

      throw new Error(
        `Erro ao criar conta: ${
          authError.message || "Tente novamente mais tarde."
        }`
      );
    }

    if (!authData || !authData.user) {
      throw new Error("Não foi possível criar o usuário. Tente novamente.");
    }

    const userId = authData.user.id;
    console.log("✅ Usuário Auth criado:", userId);

    // ======= Criar perfil do usuário =======
    const profileResult = await createUserProfile(userId, userData);
    if (!profileResult.success) {
      console.warn("⚠️ Aviso:", profileResult.message);
    }

    // ======= Criar assinatura trial =======
    const subscriptionResult = await createTrialSubscription(userId);
    if (!subscriptionResult.success) {
      console.warn("⚠️ Aviso:", subscriptionResult.message);
    }

    // ======= Criar company profile =======
    const companyResult = await createCompanyProfile(userId, userData);
    if (!companyResult.success) {
      console.warn("⚠️ Aviso:", companyResult.message);
    }

    console.log("🎉 Conta criada com sucesso!");

    // Fazer login automático
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: userData.senha,
    });

    if (signInError) {
      console.warn("⚠️ Não foi possível fazer login automático:", signInError);
      // Mostrar modal de sucesso com opção para login manual
      showSuccessModalManualLogin(userData);
    } else {
      // Login bem-sucedido, redirecionar para dashboard
      window.location.href = "https://sarmtech.netlify.app/dashboard.html";
    }
  } catch (error) {
    console.error("❌ Erro ao criar conta:", error);
    alert(
      `Erro: ${
        error.message || "Não foi possível criar a conta. Tente novamente."
      }`
    );
  } finally {
    if (btnCadastrar) btnCadastrar.disabled = false;
    if (submitText) submitText.classList.remove("d-none");
    if (spinner) spinner.classList.add("d-none");
  }
}

// Função auxiliar para criar perfil do usuário
async function createUserProfile(userId, userData) {
  try {
    const now = new Date().toISOString();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30);

    const { error } = await supabase.from("user_profiles").upsert({
      id: userId,
      email: userData.email,
      full_name: userData.nome,
      cpf_cnpj: userData.cpf_cnpj,
      phone: userData.telefone,
      plan_id: 0,
      subscription_status: "trialing",
      trial_start: now,
      trial_end: trialEnd.toISOString(),
      trial_days_used: 0,
      created_at: now,
      updated_at: now,
      email_confirmed_at: now,
    });

    if (error) {
      return {
        success: false,
        message: `Erro ao criar perfil: ${error.message}`,
      };
    }

    return { success: true, message: "Perfil criado com sucesso" };
  } catch (err) {
    return {
      success: false,
      message: `Exceção ao criar perfil: ${err.message}`,
    };
  }
}

// Função auxiliar para criar assinatura trial
async function createTrialSubscription(userId) {
  try {
    const trialStart = new Date();
    const trialEnd = new Date(trialStart);
    trialEnd.setDate(trialEnd.getDate() + 30);

    const { error } = await supabase.from("subscriptions").insert({
      user_id: userId,
      plan_id: 0,
      status: "trialing",
      payment_method: "trial",
      current_period_start: trialStart.toISOString(),
      current_period_end: trialEnd.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return {
        success: false,
        message: `Erro ao criar assinatura: ${error.message}`,
      };
    }

    return { success: true, message: "Assinatura criada com sucesso" };
  } catch (err) {
    return {
      success: false,
      message: `Exceção ao criar assinatura: ${err.message}`,
    };
  }
}

// Função auxiliar para criar company profile
async function createCompanyProfile(userId, userData) {
  try {
    const { error } = await supabase.from("company_profiles").upsert({
      user_id: userId,
      name: `${userData.nome} - Empresa`,
      email: userData.email,
      phone: userData.telefone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return {
        success: false,
        message: `Erro ao criar company profile: ${error.message}`,
      };
    }

    return { success: true, message: "Company profile criado com sucesso" };
  } catch (err) {
    return {
      success: false,
      message: `Exceção ao criar company profile: ${err.message}`,
    };
  }
}

// Modal de sucesso para login manual
function showSuccessModalManualLogin(userData) {
  const modalHtml = `
    <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title">Conta criada com sucesso!</h5>
          </div>
          <div class="modal-body">
            <p>Sua conta trial foi criada com sucesso!</p>
            <p><strong>Email:</strong> ${userData.email}</p>
            <p>Agora você pode fazer login para acessar o sistema.</p>
          </div>
          <div class="modal-footer">
            <button onclick="window.location.href='https://sarmtech.netlify.app/login/login.html'" class="btn btn-primary">
              Ir para Login
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  const modalContainer = document.createElement("div");
  modalContainer.innerHTML = modalHtml;
  document.body.appendChild(modalContainer);
  document.body.style.overflow = "hidden";
}

// Export globals
window.createTrialAccount = createTrialAccount;
window.validateForm = validateForm;
