import type {Config} from '../config/config';
import type {TelegramUpdate} from '../telegram/types';
import {UnauthorizedError} from '../utils/errors';
export interface Actor { userId?:number; chatId?:number; kind:'user'|'callback'|'join_request'|'system'; }
export function actor(update:TelegramUpdate):Actor {
  const m=update.message??update.edited_message; if(m)return {userId:m.from?.id,chatId:m.chat.id,kind:'user'};
  if(update.callback_query)return {userId:update.callback_query.from.id,chatId:update.callback_query.message?.chat.id,kind:'callback'};
  if(update.chat_join_request)return {userId:update.chat_join_request.from.id,chatId:update.chat_join_request.chat.id,kind:'join_request'};
  return {kind:'system'};
}
export function authorize(update:TelegramUpdate,config:Config):Actor {
  const a=actor(update);
  if(a.chatId!==undefined && config.allowedChats.size>0 && !config.allowedChats.has(a.chatId)) throw new UnauthorizedError('Chat not allowed');
  return a;
}
export const isOwner=(id:number|undefined,c:Config)=>id!==undefined&&c.owners.has(id);
export const isAdmin=(id:number|undefined,c:Config)=>id!==undefined&&(c.owners.has(id)||c.admins.has(id));
export function requireAdmin(id:number|undefined,c:Config){if(!isAdmin(id,c))throw new UnauthorizedError('Administrator permission required');}
