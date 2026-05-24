/** Erro retornado pelo Supabase Auth, PostgREST ou Storage. */
type ErroSupabaseLike = {
  message?: string;
  code?: string;
  status?: number | string;
  error?: string;
  error_description?: string;
  name?: string;
};

/** Códigos estáveis do GoTrue / Auth API. */
const POR_CODIGO: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  invalid_grant: "Sessão expirada. Faça login novamente.",
  user_not_found: "Usuário não encontrado.",
  email_not_confirmed: "Confirme seu e-mail antes de entrar.",
  email_exists: "Este e-mail já está cadastrado.",
  user_already_exists: "Este usuário já existe.",
  weak_password: "Senha fraca. Use pelo menos 6 caracteres.",
  over_request_rate_limit: "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
  over_email_send_rate_limit: "Limite de envio de e-mails atingido. Tente mais tarde.",
  over_sms_send_rate_limit: "Limite de envio de SMS atingido. Tente mais tarde.",
  signup_disabled: "Cadastro desabilitado neste ambiente.",
  otp_expired: "Código expirado. Solicite um novo.",
  otp_disabled: "Login por código não está disponível.",
  session_not_found: "Sessão não encontrada. Faça login novamente.",
  refresh_token_not_found: "Sessão expirada. Faça login novamente.",
  same_password: "A nova senha deve ser diferente da atual.",
  validation_failed: "Dados inválidos. Verifique os campos e tente de novo.",
  request_timeout: "Tempo esgotado. Verifique sua conexão e tente de novo.",
  flow_state_expired: "Fluxo expirado. Comece novamente.",
  flow_state_not_found: "Fluxo inválido. Comece novamente.",
  provider_email_needs_verification: "Confirme o e-mail do provedor antes de continuar.",
  identity_already_exists: "Esta conta já está vinculada a outro usuário.",
  identity_not_found: "Conta vinculada não encontrada.",
  manual_linking_disabled: "Vinculação manual de contas não permitida.",
  saml_assertion_no_email: "O provedor SSO não retornou e-mail.",
  saml_assertion_no_user_id: "O provedor SSO não retornou identificação do usuário.",
  mfa_factor_not_found: "Fator de autenticação não encontrado.",
  mfa_challenge_expired: "Desafio de autenticação expirado.",
  insufficient_aal: "Autenticação adicional necessária.",
  reauthentication_needed: "Confirme sua senha para continuar.",
  reauthentication_not_valid: "Senha incorreta.",
  // PostgREST
  PGRST116: "Registro não encontrado.",
  PGRST301: "Sem permissão para acessar este recurso.",
  "42501": "Sem permissão para esta operação.",
  "23505": "Registro duplicado. Este item já existe.",
  "23503": "Não foi possível salvar: referência inválida.",
  "23502": "Campo obrigatório não preenchido.",
  "22P02": "Formato de dado inválido.",
  // Storage
  BucketNotFound: "Bucket de arquivos não configurado.",
  ObjectNotFound: "Arquivo não encontrado.",
  Duplicate: "Este arquivo já existe.",
  PayloadTooLarge: "Arquivo muito grande.",
  InvalidKey: "Nome de arquivo inválido.",
  InvalidJWT: "Sessão inválida. Faça login novamente.",
  AccessDenied: "Sem permissão para acessar este arquivo.",
};

/** Mensagens em inglês (texto exato ou trecho) → pt-BR. */
const POR_MENSAGEM: [string | RegExp, string][] = [
  ["Invalid login credentials", "E-mail ou senha incorretos."],
  ["Email not confirmed", "Confirme seu e-mail antes de entrar."],
  ["User already registered", "Este e-mail já está cadastrado."],
  ["Password should be at least 6 characters", "A senha deve ter pelo menos 6 caracteres."],
  ["Signup requires a valid password", "Informe uma senha válida."],
  ["Unable to validate email address: invalid format", "Formato de e-mail inválido."],
  ["Email rate limit exceeded", "Limite de e-mails atingido. Tente mais tarde."],
  ["For security purposes, you can only request this once every 60 seconds", "Aguarde 60 segundos antes de tentar de novo."],
  ["Token has expired or is invalid", "Link ou código expirado. Solicite um novo."],
  ["New password should be different from the old password", "A nova senha deve ser diferente da atual."],
  ["Auth session missing!", "Sessão não encontrada. Faça login novamente."],
  ["Anonymous sign-ins are disabled", "Login anônimo desabilitado. Ative em Authentication → Providers no Supabase."],
  [/anonymous sign-ins are disabled/i, "Login anônimo desabilitado. Ative em Authentication → Providers no Supabase."],
  ["JWT expired", "Sessão expirada. Faça login novamente."],
  ["Network request failed", "Falha de rede. Verifique sua internet."],
  ["Failed to fetch", "Não foi possível conectar ao servidor."],
  ["Supabase não configurado", "Supabase não configurado."],
  ["Não autenticado", "Faça login para continuar."],
  ["Transportadora não encontrada", "Transportadora não encontrada."],
  ["Role inválida", "Perfil de acesso inválido."],
  [/row-level security/i, "Sem permissão para acessar estes dados."],
  [/permission denied/i, "Sem permissão para esta operação."],
  [/duplicate key/i, "Registro duplicado. Este item já existe."],
  [/violates foreign key/i, "Não foi possível salvar: referência inválida."],
  [/violates not-null/i, "Campo obrigatório não preenchido."],
  [/The resource already exists/i, "Este arquivo já existe."],
  [/Payload too large/i, "Arquivo muito grande."],
  [/Bucket not found/i, "Bucket de arquivos não configurado."],
  [/Object not found/i, "Arquivo não encontrado."],
];

function extrairErro(err: unknown): ErroSupabaseLike {
  if (err && typeof err === "object") return err as ErroSupabaseLike;
  return { message: typeof err === "string" ? err : undefined };
}

function traduzirMensagem(texto: string): string | null {
  const t = texto.trim();
  if (!t) return null;

  for (const [padrao, traducao] of POR_MENSAGEM) {
    if (typeof padrao === "string") {
      if (t === padrao || t.toLowerCase() === padrao.toLowerCase()) return traducao;
    } else if (padrao.test(t)) {
      return traducao;
    }
  }
  return null;
}

/**
 * Converte erros do Supabase (Auth, banco, Storage) para mensagens em pt-BR.
 * Use em telas, toasts e `throw new Error(traduzirErroSupabase(err))`.
 */
export function traduzirErroSupabase(err: unknown, contexto?: string): string {
  if (err == null) {
    return contexto ? `${contexto}.` : "Ocorreu um erro inesperado.";
  }

  const e = extrairErro(err);
  const codigo = e.code ?? e.error ?? e.name;
  const mensagemOriginal = e.message ?? e.error_description ?? "";

  if (codigo && POR_CODIGO[codigo]) {
    return POR_CODIGO[codigo];
  }

  const porTexto = traduzirMensagem(mensagemOriginal);
  if (porTexto) return porTexto;

  if (mensagemOriginal) {
    return contexto ? `${contexto}: ${mensagemOriginal}` : mensagemOriginal;
  }

  return contexto ?? "Ocorreu um erro. Tente novamente.";
}

/** Lança Error com mensagem já traduzida — útil após `{ error }` do cliente Supabase. */
export function lancarErroSupabase(err: unknown, contexto?: string): never {
  throw new Error(traduzirErroSupabase(err, contexto));
}
