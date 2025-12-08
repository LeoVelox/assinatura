// assets/js/cadastro-pagamento.js - VERSÃO FINAL SEM CONFIRMAÇÃO

import { supabase } from "./supabaseClient.js";

let userData = {};

// Inicialização
document.addEventListener("DOMContentLoaded", function () {
  console.log(
    "🚀 Página de cadastro Trial carregada - SEM CONFIRMAÇÃO DE EMAIL"
  );

  // Configurar toggle de senha
  const togglePassword = document.querySelector(".toggle-password");
  if (togglePassword) {
    togglePassword.addEventListener("click", function () {
      const passwordInput = document.getElementById("senha");
      const icon = this.querySelector("i");

      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        icon.classList.remove("bi-eye");
        icon.classList.add("bi-eye-slash");
      } else {
        passwordInput.type = "password";
        icon.classList.remove("bi-eye-slash");
        icon.classList.add("bi-eye");
      }
    });
  }

  // Form submission
  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      validateAndCreateTrial();
    });
  }
});

// Função principal para criar trial
async function validateAndCreateTrial() {
  const email = document.getElementById("email").value.trim();
  const nome = document.getElementById("nome").value.trim();
  const cpfCnpj = document.getElementById("cpf_cnpj").value.trim();
  const senha = document.getElementById("senha").value;
  const telefone = document.getElementById("telefone").value.trim();
  const terms = document.getElementById("terms").checked;

  // Validações básicas
  if (!nome) {
    alert("Por favor, informe seu nome completo.");
    return;
  }

  if (!email.includes("@")) {
    alert("Por favor, insira um endereço de email válido.");
    return;
  }

  if (!senha || senha.length < 8) {
    alert("A senha deve ter pelo menos 8 caracteres.");
    return;
  }

  if (!terms) {
    alert("Você deve aceitar os termos de serviço para continuar.");
    return;
  }

  // Salvar dados
  userData = {
    email: email,
    password: senha,
    fullName: nome,
    cpfCnpj: cpfCnpj.replace(/\D/g, ""),
    phone: telefone,
  };

  // Criar conta trial
  await createTrialAccount();
}

// Criar conta trial SEM CONFIRMAÇÃO
async function createTrialAccount() {
  const btnCadastrar = document.getElementById("btn-cadastrar");
  const submitText = btnCadastrar?.querySelector(".submit-text");
  const spinner = document.getElementById("spinner");

  // Desativar botão e mostrar spinner
  if (btnCadastrar) btnCadastrar.disabled = true;
  if (submitText) submitText.classList.add("d-none");
  if (spinner) spinner.classList.remove("d-none");

  try {
    console.log("🎯 Criando conta Trial (SEM CONFIRMAÇÃO DE EMAIL)...");

    // 1. Tentar criar usuário no Auth SEM confirmação
    console.log("Criando usuário no Auth...");
    const { data: authResult, error: signUpError } = await supabase.auth.signUp(
      {
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName,
            cpf_cnpj: userData.cpfCnpj,
            phone: userData.phone,
          },
          // IMPORTANTE: Não definir emailRedirectTo
        },
      }
    );

    if (signUpError) {
      console.log("Erro no signUp:", signUpError.message);

      // Se o usuário já existe, tenta fazer login
      if (
        signUpError.message.includes("already registered") ||
        signUpError.message.includes("User already registered")
      ) {
        console.log("Usuário já existe, tentando login...");
        const { data: loginData, error: loginError } =
          await supabase.auth.signInWithPassword({
            email: userData.email,
            password: userData.password,
          });

        if (loginError) {
          throw new Error("Este email já está cadastrado. Tente fazer login.");
        }

        // Login bem-sucedido
        console.log("✅ Login realizado com sucesso");
        await createUserProfile(loginData.user.id);
        showSuccessModal(true);
        return;
      }

      throw signUpError;
    }

    if (!authResult.user) {
      throw new Error("Não foi possível criar o usuário.");
    }

    const userId = authResult.user.id;
    console.log("✅ Usuário criado no Auth:", userId);

    // 2. Criar perfil do usuário
    await createUserProfile(userId);

    console.log("✅ Conta Trial criada com sucesso!");

    // 3. Tentar login automático
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password,
      });

      if (!loginError) {
        console.log("✅ Login automático realizado!");
      }
    } catch (loginAutoError) {
      console.log("⚠️ Login automático falhou, mas conta foi criada");
    }

    // 4. Mostrar sucesso
    showSuccessModal(false);
  } catch (error) {
    console.error("❌ Erro ao criar conta trial:", error);
    alert(`❌ ${error.message}`);
  } finally {
    // Reativar botão
    if (btnCadastrar) btnCadastrar.disabled = false;
    if (submitText) submitText.classList.remove("d-none");
    if (spinner) spinner.classList.add("d-none");
  }
}

// Criar perfil do usuário
async function createUserProfile(userId) {
  try {
    // Criar perfil do usuário com plano Trial
    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert({
        id: userId,
        email: userData.email,
        full_name: userData.fullName,
        cpf_cnpj: userData.cpfCnpj,
        phone: userData.phone,
        plan_id: 0, // Plano Trial
        subscription_status: "trial",
        trial_start: new Date().toISOString(),
        trial_end: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(), // 30 dias
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.warn("⚠️ Erro ao criar perfil:", profileError);
    }

    // Criar company_profile
    try {
      await supabase.from("company_profiles").upsert({
        user_id: userId,
        name: userData.fullName + " - Empresa",
        email: userData.email,
        phone: userData.phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (companyError) {
      console.warn("⚠️ Aviso company_profile:", companyError);
    }

    // Criar assinatura trial
    try {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 30);

      await supabase.from("subscriptions").insert({
        user_id: userId,
        plan_id: 0,
        status: "trialing",
        payment_method: "trial",
        current_period_start: new Date().toISOString(),
        current_period_end: trialEnd.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (subError) {
      console.warn("⚠️ Aviso assinatura:", subError);
    }
  } catch (error) {
    console.error("❌ Erro ao criar perfil:", error);
    throw error;
  }
}

// Mostrar modal de sucesso
function showSuccessModal(isExistingUser = false) {
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 30);

  const message = isExistingUser
    ? `
      <div class="text-center">
        <div class="mb-4">
          <i class="bi bi-check-circle-fill text-success" style="font-size: 4rem;"></i>
        </div>
        <h4 class="text-success mb-3">Bem-vindo de volta!</h4>
        <p class="mb-3">Login realizado com sucesso.</p>
        <p><strong>Seu trial continua ativo até:</strong><br>
        ${trialEnd.toLocaleDateString("pt-BR")}</p>
      </div>
    `
    : `
      <div class="text-center">
        <div class="mb-4">
          <i class="bi bi-check-circle-fill text-success" style="font-size: 4rem;"></i>
        </div>
        <h4 class="text-success mb-3">Conta Criada com Sucesso!</h4>
        <div class="text-start mb-4">
          <p><strong>✅ Seu Trial de 30 dias está ativo!</strong></p>
          <p><strong>📧 Email:</strong> ${userData.email}</p>
          <p><strong>👤 Nome:</strong> ${userData.fullName}</p>
          <p><strong>📅 Trial válido até:</strong> ${trialEnd.toLocaleDateString(
            "pt-BR"
          )}</p>
        </div>
        <p class="alert alert-info">
          <i class="bi bi-info-circle me-2"></i>
          <strong>Pronto para começar!</strong> Faça login com suas credenciais.
        </p>
      </div>
    `;

  // Criar modal dinamicamente
  const modalHtml = `
    <div class="modal fade" id="successModal" tabindex="-1" aria-labelledby="successModalLabel" aria-hidden="true" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title" id="successModalLabel">
              <i class="bi bi-check-circle-fill me-2"></i>
              ${isExistingUser ? "Login Realizado!" : "Conta Criada!"}
            </h5>
          </div>
          <div class="modal-body">
            ${message}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Fechar
            </button>
            <button type="button" class="btn btn-success" id="goToSystemBtn">
              <i class="bi bi-box-arrow-in-right me-2"></i>
              Ir para o Sistema
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Adicionar modal ao body
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Mostrar modal
  const successModal = new bootstrap.Modal(
    document.getElementById("successModal")
  );
  successModal.show();

  // Configurar botão "Ir para o Sistema"
  document.getElementById("goToSystemBtn").addEventListener("click", () => {
    window.location.href = "https://sarmtech.netlify.app/login/login.html";
  });

  // Fechar modal após 5 segundos e redirecionar
  setTimeout(() => {
    successModal.hide();
    window.location.href = "https://sarmtech.netlify.app/login/login.html";
  }, 5000);
}

// Exportar para uso global
window.supabase = supabase;
window.userData = userData;

console.log(
  "✅ cadastro-pagamento.js carregado com sucesso! (SEM CONFIRMAÇÃO DE EMAIL)"
);
