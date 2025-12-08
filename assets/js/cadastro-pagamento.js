// assets/js/cadastro-pagamento.js - VERSÃO CORRIGIDA COM PKCE
import { supabase } from "./supabaseClient.js";

document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 Página de cadastro Trial carregada");

  // Toggle password visibility
  const togglePassword = document.querySelector(".toggle-password");
  if (togglePassword) {
    togglePassword.addEventListener("click", function () {
      const passwordInput = document.getElementById("senha");
      const icon = this.querySelector("i");

      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        icon.classList.replace("bi-eye", "bi-eye-slash");
      } else {
        passwordInput.type = "password";
        icon.classList.replace("bi-eye-slash", "bi-eye");
      }
    });
  }

  // Form submission
  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      await createTrialAccount();
    });
  }
});

// Validação simplificada
function validateForm() {
  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const cpf_cnpj = document.getElementById("cpf_cnpj").value.trim();
  const senha = document.getElementById("senha").value;
  const terms = document.getElementById("terms").checked;

  // Reset validation
  document
    .querySelectorAll(".is-invalid")
    .forEach((el) => el.classList.remove("is-invalid"));

  let isValid = true;

  if (!nome) {
    document.getElementById("nome").classList.add("is-invalid");
    isValid = false;
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById("email").classList.add("is-invalid");
    isValid = false;
  }

  const cleanCpfCnpj = cpf_cnpj.replace(/\D/g, "");
  if (
    !cleanCpfCnpj ||
    (cleanCpfCnpj.length !== 11 && cleanCpfCnpj.length !== 14)
  ) {
    document.getElementById("cpf_cnpj").classList.add("is-invalid");
    isValid = false;
  }

  if (!senha || senha.length < 8) {
    document.getElementById("senha").classList.add("is-invalid");
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
  const submitText = btnCadastrar.querySelector(".submit-text");
  const spinner = document.getElementById("spinner");

  // Desativar botão e mostrar spinner
  btnCadastrar.disabled = true;
  submitText.classList.add("d-none");
  spinner.classList.remove("d-none");

  try {
    // Coletar dados
    const userData = {
      nome: document.getElementById("nome").value.trim(),
      email: document.getElementById("email").value.trim(),
      cpf_cnpj: document.getElementById("cpf_cnpj").value.replace(/\D/g, ""),
      senha: document.getElementById("senha").value,
      telefone: document.getElementById("telefone").value.trim() || null,
    };

    console.log("📝 Criando conta trial para:", userData.email);

    // PASSO 1: Verificar se email já existe no user_profiles
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("email")
      .eq("email", userData.email)
      .maybeSingle();

    if (existingProfile) {
      throw new Error("Este email já está cadastrado.");
    }

    // PASSO 2: Verificar se CPF/CNPJ já existe
    const { data: existingDoc } = await supabase
      .from("user_profiles")
      .select("cpf_cnpj")
      .eq("cpf_cnpj", userData.cpf_cnpj)
      .maybeSingle();

    if (existingDoc) {
      throw new Error("Este CPF/CNPJ já está cadastrado.");
    }

    // PASSO 3: Criar usuário no Supabase Auth com PKCE
    console.log("🔐 Criando usuário no Auth...");

    // URL correta para redirecionamento
    const redirectTo = window.location.origin.includes("sarm-tech")
      ? "https://sarmtech.netlify.app/confirm.html"
      : `${window.location.origin}/confirm.html`;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.senha,
      options: {
        data: {
          full_name: userData.nome,
          cpf_cnpj: userData.cpf_cnpj,
          phone: userData.telefone,
        },
        emailRedirectTo: "https://sarmtech.netlify.app/confirm.html",
      },
    });

    if (authError) {
      console.error("Erro no Auth:", authError);

      // Tratar erros específicos
      if (authError.message.includes("already registered")) {
        throw new Error("Este email já está cadastrado. Faça login.");
      } else if (authError.message.includes("rate limit")) {
        throw new Error("Muitas tentativas. Aguarde alguns minutos.");
      } else if (authError.message.includes("password")) {
        throw new Error("A senha não atende aos requisitos mínimos.");
      }

      throw new Error(`Erro ao criar conta: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error("Não foi possível criar o usuário. Tente novamente.");
    }

    const userId = authData.user.id;
    console.log("✅ Usuário Auth criado:", userId);

    // PASSO 4: Criar perfil do usuário (mesmo sem email confirmado)
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30);

    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert({
        id: userId,
        email: userData.email,
        full_name: userData.nome,
        cpf_cnpj: userData.cpf_cnpj,
        phone: userData.telefone,
        plan_id: 0,
        subscription_status: "trialing",
        trial_start: trialStart.toISOString(),
        trial_end: trialEnd.toISOString(),
        trial_days_used: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error("Erro ao criar perfil:", profileError);
      // Não impede o processo principal
    }

    // PASSO 5: Criar assinatura trial
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
      console.warn("Aviso na assinatura:", subscriptionError);
    }

    // PASSO 6: Criar company_profile básico
    const { error: companyError } = await supabase
      .from("company_profiles")
      .upsert({
        user_id: userId,
        name: userData.nome + " - Empresa",
        email: userData.email,
        phone: userData.telefone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (companyError) {
      console.warn("Aviso no company_profile:", companyError);
    }

    // SUCESSO - Usuário criado, email de confirmação enviado
    console.log("🎉 Conta trial criada com sucesso!");
    console.log("📧 Email de confirmação enviado para:", userData.email);

    // Mostrar modal de sucesso
    showSuccessModal(userData, trialEnd);
  } catch (error) {
    console.error("❌ Erro ao criar conta:", error);

    // Mensagem amigável para o usuário
    let errorMessage = error.message;
    if (error.message.includes("duplicate key")) {
      errorMessage = "Este email ou CPF/CNPJ já está cadastrado.";
    } else if (error.message.includes("network")) {
      errorMessage = "Problema de conexão. Verifique sua internet.";
    }

    alert(`Erro: ${errorMessage}`);
  } finally {
    // Reativar botão
    btnCadastrar.disabled = false;
    submitText.classList.remove("d-none");
    spinner.classList.add("d-none");
  }
}

// Função para confirmar automaticamente o email
async function autoConfirmEmail(userId, email) {
  try {
    console.log("🔧 Confirmando email automaticamente...");

    // 1. Atualizar auth.users (via admin API se tiver service_role key)
    // OU pule este passo se desabilitou confirmação no Supabase

    // 2. Atualizar user_profiles (CRÍTICO - seu sistema usa isso)
    const { error: profileError } = await supabase
      .from("user_profiles")
      .update({
        email_confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileError) {
      console.warn(
        "⚠️ Não foi possível atualizar user_profiles:",
        profileError
      );
      // Tenta criar se não existir
      await supabase.from("user_profiles").upsert({
        id: userId,
        email: email,
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    console.log("✅ Email confirmado automaticamente no sistema");
  } catch (error) {
    console.error("❌ Erro na confirmação automática:", error);
    // Não quebra o fluxo principal
  }
}

// Chame a função DEPOIS de authData.user (linha ~169)
await autoConfirmEmail(userId, userData.email);

// Modal de sucesso (SEM redirecionamento automático)
function showSuccessModal(userData, trialEnd) {
  const modalHtml = `
    <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5); position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 1050;">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title">
              <i class="bi bi-check-circle-fill me-2"></i>
              Conta Criada com Sucesso!
            </h5>
            <button type="button" class="btn-close btn-close-white" onclick="closeSuccessModal()"></button>
          </div>
          <div class="modal-body">
            <div class="text-center mb-4">
              <i class="bi bi-check-circle text-success" style="font-size: 4rem;"></i>
            </div>
            
            <div class="alert alert-success">
              <h5 class="alert-heading">🎉 Parabéns!</h5>
              <p>Sua conta trial de 30 dias foi criada com sucesso.</p>
            </div>
            
            <div class="card mb-3">
              <div class="card-body">
                <h6 class="card-title">📋 Detalhes da sua conta:</h6>
                <ul class="list-unstyled">
                  <li><strong>👤 Nome:</strong> ${userData.nome}</li>
                  <li><strong>📧 Email:</strong> ${userData.email}</li>
                  <li><strong>📅 Trial válido até:</strong> ${trialEnd.toLocaleDateString(
                    "pt-BR"
                  )}</li>
                  <li><strong>⏳ Dias restantes:</strong> 30 dias</li>
                </ul>
              </div>
            </div>
            
            <div class="alert alert-warning">
              <h6><i class="bi bi-envelope-exclamation me-2"></i>Importante: Confirme seu email</h6>
              <p class="mb-0">
                Enviamos um email de confirmação para <strong>${
                  userData.email
                }</strong>.
                <br>
                <small class="text-muted">Verifique sua caixa de entrada e spam.</small>
              </p>
            </div>
            
            <div class="alert alert-info">
              <h6><i class="bi bi-info-circle me-2"></i>Próximos passos:</h6>
              <ol class="mb-0">
                <li>Verifique seu email e clique no link de confirmação</li>
                <li>Faça login no sistema</li>
                <li>Comece a usar sua conta trial gratuita</li>
              </ol>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" onclick="closeSuccessModal()">
              <i class="bi bi-x-circle me-2"></i>
              Fechar
            </button>
            <button type="button" class="btn btn-primary" onclick="goToLogin()">
              <i class="bi bi-box-arrow-in-right me-2"></i>
              Ir para o Login
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remover modal existente se houver
  const existingModal = document.getElementById("successModalContainer");
  if (existingModal) existingModal.remove();

  // Adicionar modal ao body
  const modalContainer = document.createElement("div");
  modalContainer.id = "successModalContainer";
  modalContainer.innerHTML = modalHtml;
  document.body.appendChild(modalContainer);
  document.body.style.overflow = "hidden"; // Previne scroll
}

// Funções auxiliares para o modal
window.closeSuccessModal = function () {
  const modalContainer = document.getElementById("successModalContainer");
  if (modalContainer) {
    modalContainer.remove();
    document.body.style.overflow = "auto";
  }
};

window.goToLogin = function () {
  window.closeSuccessModal();
  window.location.href = "https://sarmtech.netlify.app/login/login.html";
};

// Adicionar ao window para acesso global
window.createTrialAccount = createTrialAccount;
window.validateForm = validateForm;
