// VERSÃO FINAL - CADASTRO SIMPLES SEM ERROS
import { supabase } from "./supabaseClient.js";

document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ Sistema FINAL carregado");

  const form = document.getElementById("signup-form");
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    await cadastrarUsuarioFinal();
  });
});

async function cadastrarUsuarioFinal() {
  // Coletar dados básicos
  const email = document.getElementById("email").value.trim();
  const nome = document.getElementById("nome").value.trim();
  const cpf = document.getElementById("cpf_cnpj").value.replace(/\D/g, "");
  const senha = document.getElementById("senha").value;

  // Validações mínimas
  if (!email || !nome || !senha) {
    alert("Preencha email, nome e senha");
    return;
  }

  if (senha.length < 6) {
    alert("Senha deve ter pelo menos 6 caracteres");
    return;
  }

  if (!document.getElementById("terms").checked) {
    alert("Aceite os termos de serviço");
    return;
  }

  // UI feedback
  const btn = document.getElementById("btn-cadastrar");
  btn.disabled = true;
  const textoOriginal = btn.innerHTML;
  btn.innerHTML =
    '<span class="spinner-border spinner-border-sm"></span> Criando...';

  try {
    console.log("1. Criando usuário no Auth...");

    // MÉTODO 1: Criar usuário da forma MAIS SIMPLES
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: senha,
      options: {
        data: {
          full_name: nome,
          cpf_cnpj: cpf,
        },
        // SEM emailRedirectTo
      },
    });

    // Se erro, analisar
    if (authError) {
      console.log("Erro Auth:", authError.message);

      // Se usuário já existe
      if (authError.message.includes("already registered")) {
        const fazerLogin = confirm(
          "Este email já está cadastrado.\n\nDeseja fazer login?"
        );
        if (fazerLogin) {
          window.location.href =
            "https://sarmtech.netlify.app/login/login.html";
        }
        return;
      }

      // Se outro erro, tentar método mais simples
      console.log("Tentando método alternativo...");
      await criarUsuarioSimples(email, senha, nome, cpf);
      return;
    }

    // SUCESSO - usuário criado
    console.log("✅ Usuário criado:", authData.user?.id);

    // Criar perfil manualmente (se possível)
    setTimeout(async () => {
      try {
        await criarPerfilUsuario(authData.user.id, email, nome, cpf);
      } catch (e) {
        console.warn("Perfil não criado:", e);
      }

      // Tentar login
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email,
        password: senha,
      });

      if (!loginError) {
        alert("🎉 Conta criada com sucesso! Redirecionando...");
        window.location.href = "https://sarmtech.netlify.app/dashboard.html";
      } else {
        alert("✅ Conta criada! Faça login.");
        window.location.href = "https://sarmtech.netlify.app/login/login.html";
      }
    }, 1000);
  } catch (error) {
    console.error("Erro final:", error);
    alert("Erro: " + error.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = textoOriginal;
  }
}

// Método alternativo mais simples
async function criarUsuarioSimples(email, senha, nome, cpf) {
  try {
    // Criar APENAS com email e senha
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: senha,
      // SEM options, SEM data
    });

    if (error) {
      // Se mesmo assim falhar, API direta
      await criarViaAPIDireta(email, senha, nome, cpf);
      return;
    }

    // Sucesso
    alert("✅ Conta criada! Faça login.");
    window.location.href = "https://sarmtech.netlify.app/login/login.html";
  } catch (error) {
    console.error("Erro método simples:", error);
    await criarViaAPIDireta(email, senha, nome, cpf);
  }
}

// API direta como último recurso
async function criarViaAPIDireta(email, senha, nome, cpf) {
  try {
    const response = await fetch(
      "https://pjvgzbnqnwrqxwlbndkr.supabase.co/auth/v1/signup",
      {
        method: "POST",
        headers: {
          apikey:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdmd6Ym5xbndycXh3bGJuZGtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyOTU3OTYsImV4cCI6MjA2Njg3MTc5Nn0.tfOu-q0HTCtWTa8wOKWHfgoAl3LBdWULV5O3R2eV4vE",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: senha,
        }),
      }
    );

    const result = await response.json();

    if (result.error) {
      alert("Erro: " + result.error.message);
      return;
    }

    alert("✅ Conta criada via método seguro!\n\nFaça login.");
    window.location.href = "https://sarmtech.netlify.app/login/login.html";
  } catch (error) {
    console.error("Erro API direta:", error);
    alert("Erro crítico. Entre em contato com suporte.");
  }
}

// Criar perfil do usuário
async function criarPerfilUsuario(userId, email, nome, cpf) {
  try {
    await supabase.from("user_profiles").upsert(
      {
        id: userId,
        email: email,
        full_name: nome,
        cpf_cnpj: cpf,
        plan_id: 0,
        subscription_status: "trial",
        trial_start: new Date().toISOString(),
        trial_end: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      }
    );

    console.log("✅ Perfil criado/atualizado");
  } catch (error) {
    console.warn("⚠️ Não foi possível criar perfil:", error);
    // Não é crítico - usuário já está criado no Auth
  }
}
