# Documentação do Módulo de Assinatura de Serviços

## 📋 Visão Geral do Módulo

Este módulo implementa um sistema completo de assinatura de serviços para gestão de orçamentos e ordens de serviço. A solução é composta por duas páginas principais:

1. **Página de vendas (index.html)** - Apresenta o produto e planos de assinatura
2. **Página de cadastro e pagamento (cadastro-pagamento.html)** - Processa o registro e pagamento

---

## 📁 Estrutura de Arquivos e Responsabilidades

### 1. Página Principal (`index.html`)

**Função:** Landing page de vendas e apresentação do produto

**Seções e componentes:**

- **Cabeçalho (Header)**: Navegação, logo e alternador de tema claro/escuro
- **Seção Hero**: Apresentação principal do produto com call-to-action
- **Fluxo de Trabalho**: Demonstração do processo orçamento→OS em 4 etapas
- **Funcionalidades**: Cards destacando as principais features do sistema
- **Demonstração**: Área para vídeo demonstrativo
- **Planos**: Apresentação dos três níveis de assinatura (Essencial, Profissional, Premium)
- **Depoimentos**: Testemunhos de clientes
- **Rodapé (Footer)**: Links importantes e informações da empresa

### 2. Página de Cadastro e Pagamento (`cadastro-pagamento.html`)

**Função:** Processo completo de registro e processamento de pagamento

**Fluxo implementado:**

1. **Captura de parâmetros**: Identifica plano e tipo de cobrança selecionados
2. **Cadastro do usuário**: Formulário de dados pessoais com validação
3. **Processamento de pagamento**: Integração com Supabase e simulação de gateway
4. **Confirmação**: Tela final com instruções para ativação da conta

### 3. Estilização (`assets/css/main.css` e `assets/css/cadastro-pagamento.css`)

**Função:** Definição da aparência visual e experiência do usuário

**Principais responsabilidades:**

- Sistema de temas claro/escuro com variáveis CSS
- Design responsivo para todos os dispositivos
- Animações e transições suaves
- Componentes visuais consistentes (cards, botões, formulários)
- Estilos específicos para o processo de pagamento

### 4. Lógica de Aplicação (`assets/js/main.js` e `assets/js/cadastro-pagamento.js`)

**Função:** Comportamento interativo e integração com backend

**Funcionalidades implementadas:**

#### `main.js`:

- Alternância de tema e persistência no localStorage
- Navegação responsiva e mobile-friendly
- Scroll suave para âncoras
- Animação de elementos ao entrar na viewport
- Toggle entre preços mensais/anuais

#### `cadastro-pagamento.js`:

- Validação de formulários em tempo real
- Verificação de força de senha
- Integração com Supabase para:
  - Registro de usuários
  - Verificação de email/CPF existentes
  - Criação de perfis e assinaturas
  - Processamento de pagamentos
- Simulação de gateway de pagamento
- Fluxo de múltiplas etapas com indicador visual
- Geração de logs do processo

### 5. Integração com Backend (`src/js/supabaseClient.js`)

**Função:** Configuração e inicialização do cliente Supabase

**Responsabilidades:**

- Estabelecer conexão com o backend
- Configurar parâmetros de autenticação
- Exportar cliente para uso em outros módulos

---

## 🔄 Fluxo de Dados e Processamento

1. **Seleção do plano**: Usuário escolhe plano na página principal
2. **Redirecionamento**: Parâmetros são passados via URL para a página de pagamento
3. **Validação**: Dados do usuário são validados localmente
4. **Verificação no BD**: Email e CPF/CNPJ são verificados quanto à existência prévia
5. **Criação de conta**: Usuário é registrado no Supabase Auth
6. **Criação de perfil**: Informações adicionais são salvas na tabela user_profiles
7. **Processamento de pagamento**: Transação é simulada e registrada
8. **Criação de assinatura**: Registro é criado na tabela subscriptions
9. **Confirmação**: Usuário recebe instruções para ativação da conta

---

## 🗃️ Estrutura de Banco de Dados (Supabase)

As principais tabelas utilizadas:

- **`user_profiles`**: Informações complementares dos usuários
- **`plans`**: Definição dos planos disponíveis
- **`subscriptions`**: Registro de assinaturas dos usuários
- **`payments`**: Histórico de pagamentos processados

---

## 🛠️ Considerações de Manutenção

### ✅ Facilidades:

- Código modularizado por funcionalidade
- Variáveis CSS para consistência visual
- Tratamento de erros detalhado com logging
- Validações em múltiplos níveis (cliente e servidor)

### ⚠️ Pontos de Atenção:

- A página de cadastro/pagamento possui lógica complexa que pode beneficiar de maior modularização
- Algumas strings estão hardcoded e poderiam ser externalizadas
- A simulação de pagamento poderia ser substituída por integração real com gateway

### 🚀 Melhorias Potenciais:

- Implementar testes automatizados para o fluxo de pagamento
- Adicionar mais comentários no código complexo
- Externalizar mensagens e textos para arquivos de configuração
- Implementar padrão de projeto para gestão de estado entre as páginas

---

## 📝 Conclusão

Este módulo oferece uma base sólida para o sistema de assinaturas, com arquitetura escalável e boas práticas de desenvolvimento frontend. A separação clara de responsabilidades e a documentação detalhada facilitam a manutenção e evolução do código.
