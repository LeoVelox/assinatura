/* Cadastro da landing: cria a conta no Supabase (a mesma conta do app).
   O teste de 30 dias é liberado pelo banco no momento do cadastro; aqui só enviamos os dados. */
(function () {
  "use strict";

  var C = window.NEXO || {};
  var $ = function (id) {
    return document.getElementById(id);
  };

  // links para o app (login, termos e privacidade) seguem o endereço configurado
  Array.prototype.forEach.call(document.querySelectorAll("[data-app-link]"), function (a) {
    a.href = String(C.APP_URL || "").replace(/\/$/, "") + a.getAttribute("data-app-link");
  });

  var form = $("signup-form");
  if (!form) return;

  var errorBox = $("signup-error");
  var button = $("signup-btn");
  var pw = $("senha");
  var eye = $("ver-senha");

  eye.addEventListener("click", function () {
    var show = pw.type === "password";
    pw.type = show ? "text" : "password";
    eye.textContent = show ? "Ocultar" : "Mostrar";
    eye.setAttribute("aria-pressed", show ? "true" : "false");
    eye.setAttribute("aria-label", show ? "Ocultar a senha" : "Mostrar a senha");
  });

  function showError(message, field) {
    errorBox.textContent = message;
    errorBox.hidden = false;
    if (field) field.focus();
    else errorBox.scrollIntoView({ block: "nearest" });
  }

  function friendly(status, body) {
    var code = String((body && (body.error_code || body.code)) || "").toLowerCase();
    var msg = String((body && (body.msg || body.message || body.error_description)) || "").toLowerCase();
    if (code === "user_already_exists" || msg.indexOf("already") !== -1) return "Já existe uma conta com esse e-mail. Entre ou redefina a senha no app.";
    if (code === "weak_password" || msg.indexOf("password") !== -1) return "Escolha uma senha mais forte, com pelo menos 8 caracteres.";
    if (status === 429 || code.indexOf("rate_limit") !== -1 || msg.indexOf("rate limit") !== -1) return "Muitas tentativas seguidas. Aguarde um minuto e tente de novo.";
    if (code === "email_address_invalid" || code === "validation_failed" || msg.indexOf("email") !== -1) return "Confira o e-mail digitado.";
    return "Não foi possível criar a conta. Tente de novo em instantes.";
  }

  function showDone(email, hasSession) {
    $("done-email").textContent = email;
    if (hasSession) {
      var title = document.querySelector("#signup-done h2");
      title.textContent = "Conta criada";
      var paras = document.querySelectorAll("#signup-done p");
      paras[0].innerHTML = "Seus 30 dias de teste já estão valendo. Entre no Nexo com o e-mail e a senha que você acabou de criar.";
      paras[1].hidden = true;
    }
    form.hidden = true;
    var done = $("signup-done");
    done.hidden = false;
    done.focus();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    errorBox.hidden = true;

    var name = $("nome").value.trim();
    var email = $("email").value.trim();
    var password = pw.value;

    if (name.length < 2) return showError("Informe o seu nome.", $("nome"));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return showError("Confira o e-mail digitado.", $("email"));
    if (password.length < 8) return showError("A senha precisa ter pelo menos 8 caracteres.", pw);
    if (!$("aceite").checked) return showError("Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.", $("aceite"));

    // campo escondido: pessoas não preenchem, robôs sim. Finge sucesso e não cria nada.
    if ($("site").value) return showDone(email, false);

    if (!C.SUPABASE_URL || !C.SUPABASE_KEY || C.SUPABASE_KEY.indexOf("COLE_AQUI") === 0) {
      return showError("O cadastro ainda não está configurado. Fale com o suporte.");
    }

    button.disabled = true;
    button.textContent = "Criando a conta…";

    var url = String(C.SUPABASE_URL).replace(/\/$/, "") + "/auth/v1/signup?redirect_to=" + encodeURIComponent(String(C.APP_URL).replace(/\/$/, "") + "/login");

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: C.SUPABASE_KEY },
      body: JSON.stringify({
        email: email,
        password: password,
        data: { full_name: name, accepted_terms_version: C.LEGAL_VERSION },
      }),
    })
      .then(function (res) {
        return res
          .json()
          .catch(function () {
            return {};
          })
          .then(function (body) {
            return { status: res.status, ok: res.ok, body: body };
          });
      })
      .then(function (r) {
        if (!r.ok) return showError(friendly(r.status, r.body));
        var user = r.body && (r.body.user || r.body);
        // e-mail já cadastrado: o Supabase responde "ok" com a lista de identidades vazia
        if (user && Array.isArray(user.identities) && user.identities.length === 0) {
          return showError("Já existe uma conta com esse e-mail. Entre ou redefina a senha no app.");
        }
        showDone(email, !!(r.body && r.body.access_token));
      })
      .catch(function () {
        showError("Sem conexão com o servidor. Verifique a internet e tente de novo.");
      })
      .then(function () {
        button.disabled = false;
        button.textContent = "Criar conta e começar os 30 dias";
      });
  });
})();
