import type {Env} from '../telegram/types';
const ids=(value?:string)=>new Set((value??'').split(',').map(v=>v.trim()).filter(Boolean).map(Number).filter(Number.isFinite));
const strings=(value?:string)=>new Set((value??'').split(',').map(v=>v.trim()).filter(Boolean));
export interface Config {
  owners:Set<number>; admins:Set<number>; allowedChats:Set<number>; features:Set<string>; defaultLanguage:string;
  rateLimitPerUser:number; rateLimitPerChat:number; environment:string; brandName:string; welcomeText:string;
  registerUrl?:string; officialTelegramUrl?:string; offersUrl?:string; downloadAppUrl?:string;
  supportAgentChatId?:number; supportImageUrl?:string; autoApproveJoinRequests:boolean;
}
export function loadConfig(env:Env):Config {
  if(!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_WEBHOOK_SECRET) throw new Error('Missing Telegram secrets');
  const chatId=env.SUPPORT_AGENT_CHAT_ID?.trim();
  return {
    owners:ids(env.OWNER_IDS), admins:ids(env.ADMIN_IDS), allowedChats:ids(env.ALLOWED_CHAT_IDS), features:strings(env.FEATURE_FLAGS),
    defaultLanguage:env.DEFAULT_LANGUAGE??'en', rateLimitPerUser:Math.max(1,Number(env.RATE_LIMIT_PER_MINUTE??30)), rateLimitPerChat:Math.max(1,Number(env.RATE_LIMIT_PER_CHAT_MINUTE??120)),
    environment:env.ENVIRONMENT??'production', brandName:env.BRAND_NAME??'TeamMarySy', welcomeText:env.WELCOME_TEXT??`Welcome to ${env.BRAND_NAME??'TeamMarySy'}, How can I help you today?`,
    registerUrl:env.REGISTER_URL||undefined, officialTelegramUrl:env.OFFICIAL_TELEGRAM_URL||undefined, offersUrl:env.OFFERS_URL||undefined, downloadAppUrl:env.DOWNLOAD_APP_URL||undefined,
    supportAgentChatId:chatId && /^-?\d+$/.test(chatId)?Number(chatId):undefined, supportImageUrl:env.SUPPORT_IMAGE_URL||undefined, autoApproveJoinRequests:env.AUTO_APPROVE_JOIN_REQUESTS==='true'
  };
}
