// assets/js/cadastro-pagamento.js - LÓGICA MANTIDA COM AJUSTES VISUAIS
import { supabase } from "./supabaseClient.js";

document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 Página de cadastro Trial carregada");

  // Limpar qualquer sessão existente
  supabase.auth.signOut().catch(() => {});

  // Toggle password visibility
  const togglePassword = document.getElementById("togglePassword");
  if (togglePassword) {
    togglePassword.addEventListener("click", () => {
      const passwordInput = document.getElementById("senha");
      const icon = togglePassword.querySelector("i");
      if (!passwordInput || !icon) return;

      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
      } else {
        passwordInput.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
      }
    });
  }

  // Força da senha em tempo real
  const senhaInput = document.getElementById("senha");
  if (senhaInput) {
    senhaInput.addEventListener("input", function () {
      checkPasswordStrength(this.value);
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

  // Validação em tempo real
  setupRealTimeValidation();
});

// Força da senha
function checkPasswordStrength(password) {
  const strengthProgress = document.getElementById("strengthProgress");
  const strengthText = document.getElementById("strengthText");
  const passwordTips = document.getElementById("passwordTips");

  if (!strengthProgress || !strengthText) return;

  let strength = 0;
  let tips = [];

  // Verificar comprimento
  if (password.length >= 8) {
    strength += 25;
  } else {
    tips.push("Use pelo menos 8 caracteres");
  }

  // Verificar letras minúsculas e maiúsculas
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    strength += 25;
  } else {
    tips.push("Use letras maiúsculas e minúsculas");
  }

  // Verificar números
  if (/\d/.test(password)) {
    strength += 25;
  } else {
    tips.push("Adicione números");
  }

  // Verificar caracteres especiais
  if (/[^A-Za-z0-9]/.test(password)) {
    strength += 25;
  } else {
    tips.push("Inclua caracteres especiais (@, #, $, etc)");
  }

  // Atualizar barra de progresso
  strengthProgress.style.width = `${strength}%`;

  // Atualizar cores e texto
  if (strength <= 25) {
    strengthProgress.style.backgroundColor = "#f94144";
    strengthText.textContent = "Senha fraca";
    strengthText.style.color = "#f94144";
  } else if (strength <= 50) {
    strengthProgress.style.backgroundColor = "#f8961e";
    strengthText.textContent = "Senha razoável";
    strengthText.style.color = "#f8961e";
  } else if (strength <= 75) {
    strengthProgress.style.backgroundColor = "#3b82f6";
    strengthText.textContent = "Senha boa";
    strengthText.style.color = "#3b82f6";
  } else {
    strengthProgress.style.backgroundColor = "#10b981";
    strengthText.textContent = "Senha forte";
    strengthText.style.color = "#10b981";
  }

  // Atualizar dicas
  if (passwordTips && tips.length > 0) {
    passwordTips.textContent = `Dica: ${tips[0]}`;
  }
}

// Validação em tempo real
function setupRealTimeValidation() {
  const inputs = document.querySelectorAll(".form-input");

  inputs.forEach((input) => {
    input.addEventListener("blur", function () {
      validateField(this);
    });

    input.addEventListener("input", function () {
      this.classList.remove("is-invalid", "is-valid");
      const feedback = this.parentElement.nextElementSibling;
      if (feedback && feedback.classList.contains("form-feedback")) {
        feedback.style.display = "none";
      }
    });
  });
}

// Validação de campo individual
function validateField(field) {
  const value = field.value.trim();
  let isValid = true;

  switch (field.id) {
    case "nome":
      isValid = value.length >= 2;
      break;
    case "email":
      isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      break;
    case "cpf_cnpj":
      const clean = value.replace(/\D/g, "");
      isValid = clean.length === 11 || clean.length === 14;
      break;
    case "senha":
      isValid = value.length >= 8;
      break;
  }

  if (field.id && field.required) {
    field.classList.remove("is-invalid", "is-valid");
    const feedback = field.parentElement.nextElementSibling;

    if (!isValid) {
      field.classList.add("is-invalid");
      if (feedback && feedback.classList.contains("form-feedback")) {
        feedback.style.display = "block";
      }
    } else {
      field.classList.add("is-valid");
    }
  }
}

// Validação completa do formulário (mantida da versão original)
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
    const termsCheckbox = document.getElementById("terms");
    termsCheckbox.classList.add("is-invalid");
    isValid = false;
    // Scroll até os termos
    termsCheckbox.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return isValid;
}

// Função principal de criação da conta (mantida da versão original)
async function createTrialAccount() {
  if (!validateForm()) return;

  const btnCadastrar = document.getElementById("btn-cadastrar");
  if (btnCadastrar) {
    btnCadastrar.classList.add("loading");
    btnCadastrar.disabled = true;
  }

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

    // ======= SIGNUP =======
    console.log("🔐 Criando usuário no Auth...");

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

    // Mostrar modal de sucesso
    showSuccessModal(userData.email);

    // Fazer login automático
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: userData.senha,
    });

    if (signInError) {
      console.warn("⚠️ Não foi possível fazer login automático:", signInError);
    }
  } catch (error) {
    console.error("❌ Erro ao criar conta:", error);
    showError(
      error.message || "Não foi possível criar a conta. Tente novamente."
    );
  } finally {
    const btnCadastrar = document.getElementById("btn-cadastrar");
    if (btnCadastrar) {
      btnCadastrar.classList.remove("loading");
      btnCadastrar.disabled = false;
    }
  }
}

// Funções auxiliares (mantidas da versão original)
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

// Modal de sucesso
function showSuccessModal(email) {
  const successModal = document.getElementById("successModal");
  const successEmail = document.getElementById("successEmail");

  if (successEmail) {
    successEmail.innerHTML = `Sua conta trial de 30 dias foi ativada para <strong>${email}</strong>.`;
  }

  if (successModal) {
    successModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

// Fechar modal
function closeModal() {
  const successModal = document.getElementById("successModal");
  if (successModal) {
    successModal.classList.remove("active");
    document.body.style.overflow = "auto";
  }
}

// Mostrar erro
function showError(message) {
  alert(`Erro: ${message}`);
}

// Export globals
window.createTrialAccount = createTrialAccount;
window.validateForm = validateForm;
window.closeModal = closeModal;
