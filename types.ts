export interface TelegramUser { id: number; is_bot?: boolean; first_name?: string; last_name?: string; username?: string; }
export interface TelegramChat { id: number; type: 'private'|'group'|'supergroup'|'channel'; title?: string; username?: string; }
export interface TelegramMessage { message_id: number; chat: TelegramChat; from?: TelegramUser; date?: number; text?: string; caption?: string; photo?: Array<{file_id:string;width:number;height:number}>; }
export interface TelegramCallbackQuery { id:string; from:TelegramUser; data?:string; message?:TelegramMessage; }
export interface TelegramChatJoinRequest { chat:TelegramChat; from:TelegramUser; date:number; user_chat_id?:number; bio?:string; invite_link?:{invite_link:string}; }
export interface TelegramUpdate { update_id:number; message?:TelegramMessage; edited_message?:TelegramMessage; callback_query?:TelegramCallbackQuery; chat_join_request?:TelegramChatJoinRequest; }
export interface InlineKeyboardButton { text:string; callback_data?:string; url?:string; }
export interface InlineKeyboardMarkup { inline_keyboard:InlineKeyboardButton[][]; }
export interface TelegramApiResponse<T> { ok:boolean; result:T; description?:string; error_code?:number; parameters?:Record<string,unknown>; }
export interface QueueTask { type:'telegram.sendMessage'|'telegram.sendPhoto'; idempotencyKey:string; payload:Record<string,unknown>; }
export interface Env {
  STATE: KVNamespace;
  IDEMPOTENCY: DurableObjectNamespace;
  COORDINATOR: DurableObjectNamespace;
  OUTBOUND_QUEUE: Queue<QueueTask>;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_WEBHOOK_SECRET: string;
  OWNER_IDS?: string; ADMIN_IDS?: string; ALLOWED_CHAT_IDS?: string; FEATURE_FLAGS?: string;
  DEFAULT_LANGUAGE?: string;
  RATE_LIMIT_PER_MINUTE?: string; RATE_LIMIT_PER_CHAT_MINUTE?: string;
  ENVIRONMENT?: string; BRAND_NAME?: string; WELCOME_TEXT?: string;
  REGISTER_URL?: string; OFFICIAL_TELEGRAM_URL?: string; OFFERS_URL?: string; DOWNLOAD_APP_URL?: string;
  SUPPORT_AGENT_CHAT_ID?: string; SUPPORT_IMAGE_URL?: string; AUTO_APPROVE_JOIN_REQUESTS?: string;
  HEALTH_TOKEN?: string;
}
