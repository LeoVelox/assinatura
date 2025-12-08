// assets/js/cadastro-pagamento.js - VERSÃO SIMPLIFICADA
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

    // PASSO 1: Verificar se email já existe
    const { data: existingEmail } = await supabase
      .from("user_profiles")
      .select("email")
      .eq("email", userData.email)
      .single();

    if (existingEmail) {
      throw new Error(
        "Este email já está cadastrado. Faça login ou use outro email."
      );
    }

    // PASSO 2: Verificar se CPF/CNPJ já existe
    const { data: existingDoc } = await supabase
      .from("user_profiles")
      .select("cpf_cnpj")
      .eq("cpf_cnpj", userData.cpf_cnpj)
      .single();

    if (existingDoc) {
      throw new Error("Este CPF/CNPJ já está cadastrado.");
    }

    // PASSO 3: Criar usuário no Supabase Auth
    console.log("🔐 Criando usuário no Auth...");
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.senha,
      options: {
        data: {
          full_name: userData.nome,
          cpf_cnpj: userData.cpf_cnpj,
          phone: userData.telefone,
        },
        // Com PKCE, não precisa de redirect URL
      },
    });

    if (authError) {
      console.error("Erro no Auth:", authError);
      if (authError.message.includes("Email rate limit")) {
        throw new Error("Muitas tentativas. Aguarde alguns minutos.");
      }
      throw new Error(`Erro de autenticação: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error("Não foi possível criar o usuário.");
    }

    const userId = authData.user.id;
    console.log("✅ Usuário Auth criado:", userId);

    // PASSO 4: Criar perfil do usuário
    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert({
        id: userId,
        email: userData.email,
        full_name: userData.nome,
        cpf_cnpj: userData.cpf_cnpj,
        phone: userData.telefone,
        plan_id: 0, // Plano Trial
        subscription_status: "trialing",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error("Erro no perfil:", profileError);
      // Não impede o processo, apenas loga o erro
    }

    // PASSO 5: Criar assinatura trial
    const trialStart = new Date();
    const trialEnd = new Date();
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
      console.warn("Aviso na assinatura:", subscriptionError);
      // Não impede o processo
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

    // SUCESSO!
    console.log("🎉 Conta trial criada com sucesso!");

    // Mostrar modal de sucesso
    showSuccessModal(userData, trialEnd);
  } catch (error) {
    console.error("❌ Erro ao criar conta:", error);
    alert(`Erro: ${error.message}`);
  } finally {
    // Reativar botão
    btnCadastrar.disabled = false;
    submitText.classList.remove("d-none");
    spinner.classList.add("d-none");
  }
}

// Modal de sucesso
function showSuccessModal(userData, trialEnd) {
  const modalHtml = `
    <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title">
              <i class="bi bi-check-circle-fill me-2"></i>
              Conta Criada com Sucesso!
            </h5>
          </div>
          <div class="modal-body">
            <div class="text-center mb-4">
              <i class="bi bi-check-circle text-success" style="font-size: 4rem;"></i>
            </div>
            <h4 class="text-center mb-3">🎉 Parabéns!</h4>
            <p class="text-center">Sua conta trial foi criada com sucesso.</p>
            
            <div class="alert alert-info">
              <strong>Detalhes da sua conta:</strong>
              <ul class="mb-0 mt-2">
                <li><strong>Email:</strong> ${userData.email}</li>
                <li><strong>Nome:</strong> ${userData.nome}</li>
                <li><strong>Trial válido até:</strong> ${trialEnd.toLocaleDateString(
                  "pt-BR"
                )}</li>
                <li><strong>Dias restantes:</strong> 30 dias</li>
              </ul>
            </div>
            
            <div class="alert alert-warning">
              <i class="bi bi-envelope me-2"></i>
              <strong>Verifique seu email!</strong><br>
              Enviamos um link de confirmação para ${userData.email}
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" onclick="window.location.href='https://sarmtech.netlify.app/login/login.html'">
              <i class="bi bi-box-arrow-in-right me-2"></i>
              Ir para o Login
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Adicionar modal ao body
  const modalContainer = document.createElement("div");
  modalContainer.id = "successModalContainer";
  modalContainer.innerHTML = modalHtml;
  document.body.appendChild(modalContainer);

  // Fechar modal ao clicar fora
  modalContainer.addEventListener("click", function (e) {
    if (e.target === this) {
      this.remove();
      window.location.href = "https://sarmtech.netlify.app/login/login.html";
    }
  });

  // Redirecionar após 15 segundos
  setTimeout(() => {
    window.location.href = "https://sarmtech.netlify.app/login/login.html";
  }, 15000);
}

// Adicionar ao window para acesso global
window.createTrialAccount = createTrialAccount;
