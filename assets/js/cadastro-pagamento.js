// VERSÃO HIPER SIMPLES - APENAS CRIA USUÁRIO
import { supabase } from "./supabaseClient.js";

document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ Sistema SIMPLES carregado");

  const form = document.getElementById("signup-form");
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    await criarContaSimples();
  });
});

async function criarContaSimples() {
  // Pegar dados básicos
  const email = document.getElementById("email").value.trim();
  const nome = document.getElementById("nome").value.trim();
  const senha = document.getElementById("senha").value;
  const cpf = document.getElementById("cpf_cnpj").value.replace(/\D/g, "");

  // Validação mínima
  if (!email || !nome || !senha) {
    alert("Preencha email, nome e senha");
    return;
  }

  // Botão loading
  const btn = document.getElementById("btn-cadastrar");
  btn.disabled = true;
  const textoOriginal = btn.innerHTML;
  btn.innerHTML = "Criando...";

  try {
    console.log("Tentando criar conta para:", email);

    // MÉTODO 1: Criar usuário forma MAIS SIMPLES
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: senha,
      // NADA MAIS - sem options, sem data
    });

    if (error) {
      console.log("Erro no signUp:", error.message);

      // Se usuário já existe, fazer login
      if (error.message.includes("already registered")) {
        const fazerLogin = confirm("Email já cadastrado. Fazer login?");
        if (fazerLogin) {
          window.location.href =
            "https://sarmtech.netlify.app/login/login.html";
        }
        return;
      }

      // Se for erro de banco, tentar método alternativo
      if (error.message.includes("Database error")) {
        console.log("Erro de banco, tentando método 2...");
        await criarContaAlternativo(email, senha, nome, cpf);
        return;
      }

      throw error;
    }

    // Sucesso!
    console.log("✅ Usuário criado:", data.user?.id);

    // Tentar login automático
    setTimeout(async () => {
      try {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: email,
          password: senha,
        });

        if (!loginError) {
          // Criar perfil manualmente APÓS login
          await criarPerfilManualmente(data.user.id, email, nome, cpf);

          alert("✅ Conta criada! Redirecionando...");
          window.location.href = "https://sarmtech.netlify.app/dashboard.html";
        } else {
          alert("✅ Conta criada! Faça login.");
          window.location.href =
            "https://sarmtech.netlify.app/login/login.html";
        }
      } catch (e) {
        alert("✅ Conta criada! Acesse pelo login.");
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

// Método alternativo se o primeiro falhar
async function criarContaAlternativo(email, senha, nome, cpf) {
  try {
    console.log("Tentando método alternativo...");

    // Primeiro tenta login (talvez conta já existe)
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email,
      password: senha,
    });

    if (!loginError) {
      alert("✅ Login realizado! Conta já existia.");
      window.location.href = "https://sarmtech.netlify.app/dashboard.html";
      return;
    }

    // Se não consegue login, tenta criar de outra forma
    // Usando fetch direto para a API do Supabase
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
          data: {
            full_name: nome,
            cpf_cnpj: cpf,
          },
        }),
      }
    );

    const result = await response.json();

    if (result.error) {
      alert("Erro: " + result.error.message);
      return;
    }

    // Sucesso com API direta
    alert("✅ Conta criada via API direta! Faça login.");
    window.location.href = "https://sarmtech.netlify.app/login/login.html";
  } catch (error) {
    console.error("Erro método alternativo:", error);
    alert("Erro crítico. Tente novamente mais tarde.");
  }
}

// Criar perfil manualmente
async function criarPerfilManualmente(userId, email, nome, cpf) {
  try {
    await supabase.from("user_profiles").upsert(
      {
        id: userId,
        email: email,
        full_name: nome,
        cpf_cnpj: cpf,
        plan_id: 0,
        subscription_status: "trial",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      }
    );
  } catch (error) {
    console.warn("Aviso: não foi possível criar perfil", error);
  }
}
