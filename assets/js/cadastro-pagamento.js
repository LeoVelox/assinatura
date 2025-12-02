// assets/js/cadastro-pagamento.js - VERSÃO CORRIGIDA COM PLANO TRIAL ID 0

import { supabase } from "./supabaseClient.js";

let userData = {};

// Inicialização
document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 Página de cadastro Trial carregada");

  try {
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

    // Verificar força da senha
    const passwordInput = document.getElementById("senha");
    if (passwordInput) {
      passwordInput.addEventListener("input", function () {
        checkPasswordStrength(this.value);
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

    // Botão de cadastro
    const cadastrarBtn = document.getElementById("btn-cadastrar");
    if (cadastrarBtn) {
      cadastrarBtn.addEventListener("click", function (e) {
        e.preventDefault();
        validateAndCreateTrial();
      });
    }

    console.log("✅ Inicialização concluída com sucesso!");
  } catch (error) {
    console.error("❌ Erro na inicialização:", error);
  }
});

// Função para verificar força da senha
function checkPasswordStrength(password) {
  let strength = 0;
  let tips = [];

  if (password.length >= 8) strength++;
  else tips.push("Use pelo menos 8 caracteres.");

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  else tips.push("Use letras maiúsculas e minúsculas.");

  if (/\d/.test(password)) strength++;
  else tips.push("Inclua pelo menos um número.");

  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  else tips.push("Adicione um caractere especial (!@#$%^&*).");

  // Atualizar interface se existir
  const strengthBar = document.getElementById("passwordStrength");
  const tipsElement = document.getElementById("passwordTips");

  if (strengthBar) {
    strengthBar.className = "password-strength strength-" + strength;
  }

  if (tipsElement) {
    if (strength < 4 && password.length > 0) {
      tipsElement.textContent = "Dica: " + tips.join(" ");
      tipsElement.className = "text-warning d-block mt-1";
    } else if (password.length > 0) {
      tipsElement.textContent = "Senha forte!";
      tipsElement.className = "text-success d-block mt-1";
    } else {
      tipsElement.textContent = "";
    }
  }
}

// Função para validar formato de email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Função para validar CPF/CNPJ
function isValidCpfCnpj(cpfCnpj) {
  const cleanCpfCnpj = cpfCnpj.replace(/\D/g, "");

  // Validação básica de tamanho
  if (cleanCpfCnpj.length === 11) {
    return validateCPF(cleanCpfCnpj);
  } else if (cleanCpfCnpj.length === 14) {
    return validateCNPJ(cleanCpfCnpj);
  }

  return false;
}

// Validação de CPF
function validateCPF(cpf) {
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;

  return remainder === parseInt(cpf.charAt(10));
}

// Validação básica de CNPJ (apenas formato)
function validateCNPJ(cnpj) {
  return cnpj.length === 14 && !/^(\d)\1+$/.test(cnpj);
}

// Função principal para criar trial
async function validateAndCreateTrial() {
  const form = document.getElementById("signup-form");
  const email = document.getElementById("email").value.trim();
  const nome = document.getElementById("nome").value.trim();
  const cpfCnpj = document.getElementById("cpf_cnpj").value.trim();
  const senha = document.getElementById("senha").value;
  const telefone = document.getElementById("telefone").value.trim();
  const terms = document.getElementById("terms").checked;

  // Limpar validações anteriores
  document.getElementById("nome").classList.remove("is-invalid");
  document.getElementById("email").classList.remove("is-invalid");
  document.getElementById("cpf_cnpj").classList.remove("is-invalid");
  document.getElementById("senha").classList.remove("is-invalid");

  // Validar campos obrigatórios
  if (!nome) {
    alert("Por favor, informe seu nome completo.");
    document.getElementById("nome").classList.add("is-invalid");
    return;
  }

  if (!isValidEmail(email)) {
    alert("Por favor, insira um endereço de email válido.");
    document.getElementById("email").classList.add("is-invalid");
    return;
  }

  if (!isValidCpfCnpj(cpfCnpj)) {
    alert("Por favor, insira um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.");
    document.getElementById("cpf_cnpj").classList.add("is-invalid");
    return;
  }

  if (!senha || senha.length < 8) {
    alert("A senha deve ter pelo menos 8 caracteres.");
    document.getElementById("senha").classList.add("is-invalid");
    return;
  }

  if (!terms) {
    alert("Você deve aceitar os termos de serviço para continuar.");
    return;
  }

  // Salvar dados do usuário
  userData = {
    email: email,
    password: senha,
    fullName: nome,
    cpfCnpj: cpfCnpj.replace(/\D/g, ""),
    phone: telefone,
  };

  console.log("📝 Dados do usuário capturados:", {
    ...userData,
    password: "***",
  });

  // Criar conta trial
  await createTrialAccount();
}

// Criar conta trial
async function createTrialAccount() {
  const btnCadastrar = document.getElementById("btn-cadastrar");
  const submitText = btnCadastrar?.querySelector(".submit-text");
  const spinner = document.getElementById("spinner");

  // Desativar botão e mostrar spinner
  if (btnCadastrar) btnCadastrar.disabled = true;
  if (submitText) submitText.classList.add("d-none");
  if (spinner) spinner.classList.remove("d-none");

  try {
    console.log("🎯 Criando conta Trial...");

    // 1. Verificar se email já existe
    const { data: emailCheck, error: emailError } = await supabase
      .from("user_profiles")
      .select("email")
      .eq("email", userData.email)
      .maybeSingle();

    if (emailError) throw emailError;
    if (emailCheck) throw new Error("Este email já está cadastrado.");

    // 2. Verificar se CPF/CNPJ já existe
    const { data: existingUser, error: lookupError } = await supabase
      .from("user_profiles")
      .select("cpf_cnpj")
      .eq("cpf_cnpj", userData.cpfCnpj)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (existingUser) throw new Error("Este CPF/CNPJ já está cadastrado");

    // 3. Criar usuário no Supabase Auth
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
          emailRedirectTo: "https://sarm-tech.netlify.app/confirm.html",
        },
      }
    );

    if (signUpError) {
      console.error("Erro no Auth:", signUpError);

      // Tratar erros específicos do Auth
      if (signUpError.message.includes("Email rate limit exceeded")) {
        throw new Error(
          "Muitas tentativas. Aguarde alguns minutos e tente novamente."
        );
      } else if (signUpError.message.includes("Invalid email")) {
        throw new Error("Email inválido. Verifique o endereço informado.");
      } else if (signUpError.message.includes("Password")) {
        throw new Error("A senha não atende aos requisitos de segurança.");
      } else {
        throw new Error(`Erro de autenticação: ${signUpError.message}`);
      }
    }

    if (!authResult.user) {
      throw new Error("Não foi possível criar o usuário. Tente novamente.");
    }

    const userId = authResult.user.id;
    console.log("✅ Usuário Auth criado:", userId);

    // 4. Criar perfil do usuário com plano Trial (ID 0)
    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert({
        id: userId,
        email: userData.email,
        full_name: userData.fullName,
        cpf_cnpj: userData.cpfCnpj,
        phone: userData.phone,
        plan_id: 0, // Plano Trial ID 0
        subscription_status: "trial",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error("Erro ao criar perfil:", profileError);

      // Se der erro no perfil, tentar criar company_profile também
      await supabase.from("company_profiles").upsert({
        user_id: userId,
        name: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      throw new Error("Perfil criado parcialmente. Você pode fazer login.");
    }

    // 5. Criar company_profile
    const { error: companyError } = await supabase
      .from("company_profiles")
      .upsert({
        user_id: userId,
        name: userData.fullName + " - Empresa",
        email: userData.email,
        phone: userData.phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (companyError) {
      console.warn("Aviso ao criar company_profile:", companyError);
      // Não impede a criação da conta
    }

    // 6. Criar assinatura trial
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30); // 30 dias de trial

    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan_id: 0, // Plano Trial ID 0
        status: "trialing",
        payment_method: "trial",
        current_period_start: new Date().toISOString(),
        current_period_end: trialEnd.toISOString(),
        is_test: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (subError) {
      console.warn("Aviso ao criar assinatura:", subError);
      // Não impede a criação da conta principal
    }

    console.log("✅ Conta Trial criada com sucesso!");

    // 7. Sucesso - mostrar mensagem detalhada
    const successMessage = `
        🎉 <strong>Conta criada com sucesso!</strong>

      <div style="text-align: left; margin: 15px 0;">
        <p>✅ <strong>Seu Trial de 15 dias foi ativado</strong></p>
        <p>📧 <strong>Email:</strong> ${userData.email}</p>
        <p>👤 <strong>Nome:</strong> ${userData.fullName}</p>
        <p>📅 <strong>Trial válido até:</strong> ${trialEnd.toLocaleDateString(
          "pt-BR"
        )}</p>
        <p>🚀 <strong>Você já pode fazer login!</strong></p>
      </div>

      <p><strong>Faça login agora e comece a usar o sistema.</strong></p>
    `;

    // Criar modal de sucesso
    showSuccessModal(successMessage);
  } catch (error) {
    console.error("❌ Erro ao criar conta trial:", error);

    let errorMessage = "Erro ao criar conta: ";

    if (error.message.includes("já está cadastrado")) {
      errorMessage = error.message;
    } else if (error.message.includes("Email")) {
      errorMessage += "Verifique o email informado.";
    } else if (error.message.includes("Password")) {
      errorMessage += "A senha não atende aos requisitos de segurança.";
    } else if (error.message.includes("rate limit")) {
      errorMessage = "Muitas tentativas. Aguarde alguns minutos.";
    } else {
      errorMessage += error.message;
    }

    alert(`❌ ${errorMessage}`);
  } finally {
    // Reativar botão
    if (btnCadastrar) btnCadastrar.disabled = false;
    if (submitText) submitText.classList.remove("d-none");
    if (spinner) spinner.classList.add("d-none");
  }
}

async function processTokenFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  const type = urlParams.get("type");

  if (token && type === "signup") {
    console.log("🔄 Processando token da URL...", token);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token: token,
        type: "signup",
      });

      if (error) {
        console.error("❌ Erro ao verificar token:", error);
      } else {
        console.log("✅ Token verificado com sucesso!");
        // O usuário agora está confirmado
        showSuccess();
      }
    } catch (error) {
      console.error("❌ Erro no processamento do token:", error);
    }
  }
}

// E modifique a função processConfirmation:
async function processConfirmation() {
  try {
    console.log("🔍 Iniciando processamento de confirmação...");

    // Primeiro tenta processar token da URL
    await processTokenFromURL();

    // Depois verifica a sessão normalmente
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (session?.user) {
      console.log("✅ Sessão ativa detectada:", session.user.email);
      showSuccess();
    } else {
      console.log("ℹ️ Aguardando confirmação...");
      // Mantém mostrando "Processando..." até a confirmação
    }
  } catch (error) {
    console.error("❌ Erro no processamento:", error);
    showError(error.message);
  }
}

// Mostrar modal de sucesso
function showSuccessModal(message) {
  // Criar modal dinamicamente
  const modalHtml = `
    <div class="modal fade" id="successModal" tabindex="-1" aria-labelledby="successModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title" id="successModalLabel">
              <i class="bi bi-check-circle-fill me-2"></i>
              Conta Criada com Sucesso!
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            ${message}
          </div>
          <div class="modal-footer">
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

  // Redirecionar automaticamente após 10 segundos
  setTimeout(() => {
    window.location.href = "https://sarmtech.netlify.app/";
  }, 10000);
}

// Função para migrar trial para plano pago (para usar depois)
async function migrateTrialToPaid(userId, targetPlanId, paymentMethod) {
  try {
    console.log(`🔄 Migrando usuário ${userId} para plano ${targetPlanId}`);

    // Calcular período
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1); // Mensal por padrão

    // Atualizar assinatura
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        plan_id: targetPlanId,
        status: "active",
        payment_method: paymentMethod,
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) throw updateError;

    // Atualizar perfil do usuário
    const { error: profileError } = await supabase
      .from("user_profiles")
      .update({
        plan_id: targetPlanId,
        subscription_status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileError) throw profileError;

    console.log("✅ Migração concluída com sucesso");
    return { success: true };
  } catch (error) {
    console.error("❌ Erro na migração:", error);
    return { success: false, error: error.message };
  }
}

// Exportar funções para uso global
window.supabase = supabase;
window.userData = userData;
window.migrateTrialToPaid = migrateTrialToPaid;

console.log("✅ cadastro-pagamento.js carregado com sucesso!");

console.log("🔗 Link de confirmação que seria enviado:");
console.log(
  `https://sarm-tech.netlify.app/confirm.html?redirect_to=${encodeURIComponent(
    "https://sarmtech.netlify.app/login/login.html"
  )}`
);
