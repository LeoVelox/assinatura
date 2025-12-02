// assets/js/cadastro-pagamento.js - VERSÃO SEM CONFIRMAÇÃO DE EMAIL

import { supabase } from "./supabaseClient.js";

let userData = {};

// Inicialização
document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 Página de cadastro Trial carregada - SEM CONFIRMAÇÃO");

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

// Criar conta trial (SIMPIFICADO - SEM CONFIRMAÇÃO)
async function createTrialAccount() {
  const btnCadastrar = document.getElementById("btn-cadastrar");
  const submitText = btnCadastrar?.querySelector(".submit-text");
  const spinner = document.getElementById("spinner");

  // Desativar botão e mostrar spinner
  if (btnCadastrar) btnCadastrar.disabled = true;
  if (submitText) submitText.classList.add("d-none");
  if (spinner) spinner.classList.remove("d-none");

  try {
    console.log("🎯 Criando conta Trial (SEM CONFIRMAÇÃO)...");

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

    // 3. Criar usuário no Supabase Auth (SIMPIFICADO)
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
          // SEM emailRedirectTo - SEM CONFIRMAÇÃO
        },
      }
    );

    if (signUpError) {
      console.error("Erro no Auth:", signUpError);

      // Se for erro de email já registrado, tenta fazer login
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
          throw new Error(
            "Este email já está cadastrado. Use 'Esqueci minha senha' ou faça login."
          );
        }

        // Login bem-sucedido - usuário já existe
        console.log("✅ Login realizado com sucesso");
        showSuccessModal(true); // Passa true para indicar que é login
        return;
      }

      // Outros erros
      if (signUpError.message.includes("Email rate limit exceeded")) {
        throw new Error("Muitas tentativas. Aguarde alguns minutos.");
      } else if (signUpError.message.includes("Invalid email")) {
        throw new Error("Email inválido.");
      } else if (signUpError.message.includes("Password")) {
        throw new Error("Senha muito fraca. Use uma senha mais forte.");
      } else {
        throw new Error(`Erro: ${signUpError.message}`);
      }
    }

    if (!authResult.user) {
      throw new Error("Não foi possível criar o usuário.");
    }

    const userId = authResult.user.id;
    console.log("✅ Usuário criado (SEM CONFIRMAÇÃO NECESSÁRIA):", userId);

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
      // Continua mesmo com erro no perfil
    }

    // 5. Criar company_profile (opcional)
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
      console.warn("Aviso company_profile:", companyError);
    }

    // 6. Criar assinatura trial
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
      console.warn("Aviso assinatura:", subError);
    }

    console.log("✅ Conta Trial criada com sucesso! (PRONTA PARA LOGIN)");

    // 7. Tenta fazer login automaticamente
    try {
      const { data: loginData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.password,
        });

      if (!loginError) {
        console.log("✅ Login automático realizado!");
      }
    } catch (loginAutoError) {
      console.log("⚠️ Login automático falhou, mas conta foi criada");
    }

    // 8. Mostrar sucesso
    showSuccessModal(false); // Passa false para indicar que é novo cadastro
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

// Mostrar modal de sucesso (ATUALIZADO)
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

  // Fechar modal após 10 segundos e redirecionar
  setTimeout(() => {
    successModal.hide();
    window.location.href = "https://sarmtech.netlify.app/login/login.html";
  }, 10000);
}

// Função para migrar trial para plano pago (mantida para uso futuro)
async function migrateTrialToPaid(userId, targetPlanId, paymentMethod) {
  try {
    console.log(`🔄 Migrando usuário ${userId} para plano ${targetPlanId}`);

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

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

console.log(
  "✅ cadastro-pagamento.js carregado com sucesso! (SEM CONFIRMAÇÃO)"
);
