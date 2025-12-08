// assets/js/cadastro-pagamento.js - VERSÃO CORRIGIDA COM CONFIRMAÇÃO AUTOMÁTICA
import { supabase } from "./supabaseClient.js";

document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 Página de cadastro Trial carregada");

  // Toggle de senha
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

  // Evento de cadastro
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

// Função principal de criação de conta
async function createTrialAccount() {
  if (!validateForm()) return;

  const btnCadastrar = document.getElementById("btn-cadastrar");
  const submitText = btnCadastrar.querySelector(".submit-text");
  const spinner = document.getElementById("spinner");

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

    // Verificar email duplicado
    const { data: existingEmail } = await supabase
      .from("user_profiles")
      .select("email")
      .eq("email", userData.email)
      .maybeSingle();

    if (existingEmail) {
      throw new Error("Este email já está cadastrado.");
    }

    // Verificar CPF duplicado
    const { data: existingDoc } = await supabase
      .from("user_profiles")
      .select("cpf_cnpj")
      .eq("cpf_cnpj", userData.cpf_cnpj)
      .maybeSingle();

    if (existingDoc) {
      throw new Error("Este CPF/CNPJ já está cadastrado.");
    }

    // Criar usuário no Auth — SEM metadata
    console.log("🔐 Criando usuário no Auth...");

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.senha,
      options: {
        emailRedirectTo: "https://sarmtech.netlify.app/confirm.html",
      },
    });

    if (authError) {
      console.error("❌ Erro no Auth:", authError);
      throw new Error(`Erro ao criar conta: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error("Erro inesperado ao criar usuário.");
    }

    const userId = authData.user.id;
    console.log("✅ Usuário Auth criado:", userId);

    // Auto confirmação
    await autoConfirmEmail(userId, userData.email);

    // Criar perfil do usuário
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30);

    await supabase.from("user_profiles").upsert({
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
      email_confirmed_at: new Date().toISOString(),
    });

    // Criar assinatura trial
    await supabase.from("subscriptions").insert({
      user_id: userId,
      plan_id: 0,
      status: "trialing",
      payment_method: "trial",
      current_period_start: trialStart.toISOString(),
      current_period_end: trialEnd.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Company profile
    await supabase.from("company_profiles").upsert({
      user_id: userId,
      name: `${userData.nome} - Empresa`,
      email: userData.email,
      phone: userData.telefone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    console.log("🎉 Conta criada com sucesso!");
    showSuccessModal(userData, trialEnd);
  } catch (error) {
    console.error("❌ Erro ao criar conta:", error);
    alert(error.message);
  } finally {
    btnCadastrar.disabled = false;
    submitText.classList.remove("d-none");
    spinner.classList.add("d-none");
  }
}

// Confirmar email automaticamente
async function autoConfirmEmail(userId, email) {
  try {
    console.log("🔧 Confirmando email automaticamente...");

    await supabase
      .from("user_profiles")
      .update({
        email_confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    console.log("📌 Email confirmado automaticamente!");
  } catch (error) {
    console.error("⚠️ Falha ao confirmar email automaticamente:", error);
  }
}

// Modal de sucesso
function showSuccessModal(userData, trialEnd) {
  const modalHtml = `
    <div class="modal fade show d-block" style="background: rgba(0,0,0,0.5); position: fixed; inset: 0; z-index: 1050;">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title"><i class="bi bi-check-circle-fill me-2"></i>Conta Criada com Sucesso!</h5>
            <button class="btn-close btn-close-white" onclick="closeSuccessModal()"></button>
          </div>
          <div class="modal-body">
            <div class="text-center mb-4">
              <i class="bi bi-check-circle text-success" style="font-size: 4rem;"></i>
            </div>

            <p class="text-center">Sua conta trial está ativa por 30 dias.</p>

            <ul class="list-unstyled">
              <li><strong>Nome:</strong> ${userData.nome}</li>
              <li><strong>Email:</strong> ${userData.email}</li>
              <li><strong>Trial até:</strong> ${trialEnd.toLocaleDateString(
                "pt-BR"
              )}</li>
            </ul>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline-secondary" onclick="closeSuccessModal()">Fechar</button>
            <button class="btn btn-primary" onclick="goToLogin()">Ir para o Login</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const cont = document.createElement("div");
  cont.id = "successModalContainer";
  cont.innerHTML = modalHtml;
  document.body.appendChild(cont);
}

window.closeSuccessModal = function () {
  const modal = document.getElementById("successModalContainer");
  if (modal) modal.remove();
};

window.goToLogin = function () {
  window.location.href = "https://sarmtech.netlify.app/login/login.html";
};

// Export global
window.createTrialAccount = createTrialAccount;
window.validateForm = validateForm;
