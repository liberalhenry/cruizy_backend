-- Version 0.4.0 (Issues #32–#39) — nur additiv.

-- #36: Mitteilungen führen per Knopf dorthin, wo es weitergeht (statt Download als Textdatei)
ALTER TABLE notices ADD COLUMN IF NOT EXISTS url text;

-- #32: Telegram-Bot statt SMS. Kennung des Chats nur verschlüsselt, gesucht wird über Blindindizes.
CREATE TABLE IF NOT EXISTS telegram_chats (
  chat_hash   bytea PRIMARY KEY,
  chat_enc    bytea NOT NULL,
  -- nach „Nummer teilen“: dieselbe Blindindex-Art wie accounts.phone_hash
  phone_hash  bytea,
  -- #35: Mitteilungen dieses Kontos gehen hierher (Verbindung über einen Link aus der App)
  account_id  uuid REFERENCES accounts(id) ON DELETE SET NULL,
  linked_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS telegram_chats_phone ON telegram_chats (phone_hash) WHERE phone_hash IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS telegram_chats_account ON telegram_chats (account_id) WHERE account_id IS NOT NULL;

-- Nachrichten an eine Nummer, die noch nicht mit dem Bot verbunden ist — verschlüsselt, mit kurzer Frist
CREATE TABLE IF NOT EXISTS telegram_outbox (
  id          bigserial PRIMARY KEY,
  phone_hash  bytea NOT NULL,
  reason      text NOT NULL,
  text_enc    bytea NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS telegram_outbox_phone ON telegram_outbox (phone_hash);

-- Einmal-Links aus der App („Mit Telegram verbinden“), nur als Prüfwert
CREATE TABLE IF NOT EXISTS telegram_link_tokens (
  token_hash  bytea PRIMARY KEY,
  account_id  uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  expires_at  timestamptz NOT NULL
);

-- Stand des Abholens (TELEGRAM_MODE=polling)
CREATE TABLE IF NOT EXISTS telegram_state (
  key    text PRIMARY KEY,
  value  text NOT NULL
);

-- #35: Mitteilungen zusätzlich per E-Mail oder Telegram — nur auf Wunsch, Inhalt nur auf Wunsch
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_email boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_telegram boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_content boolean NOT NULL DEFAULT false;
