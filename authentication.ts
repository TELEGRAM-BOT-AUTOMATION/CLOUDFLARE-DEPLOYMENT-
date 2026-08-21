import type {TelegramUpdate} from '../telegram/types';
import {BadRequestError,UnauthorizedError} from '../utils/errors';
export function validateWebhookSecret(request:Request,env:{TELEGRAM_WEBHOOK_SECRET:string}) {
  const supplied=request.headers.get('X-Telegram-Bot-Api-Secret-Token');
  if(!supplied || supplied.length!==env.TELEGRAM_WEBHOOK_SECRET.length || !timingSafeEqual(supplied,env.TELEGRAM_WEBHOOK_SECRET)) throw new UnauthorizedError('Invalid webhook secret');
}
function timingSafeEqual(a:string,b:string){let result=a.length^b.length;const n=Math.max(a.length,b.length);for(let i=0;i<n;i++)result|=(a.charCodeAt(i)^b.charCodeAt(i));return result===0;}
export function validateUpdateShape(value:unknown):asserts value is TelegramUpdate {
  if(!value || typeof value!=='object') throw new BadRequestError('Invalid Telegram update');
  const u=value as Partial<TelegramUpdate>;
  if(typeof u.update_id!=='number' || !Number.isInteger(u.update_id) || u.update_id<0) throw new BadRequestError('Invalid update_id');
  if(!u.message && !u.edited_message && !u.callback_query && !u.chat_join_request) throw new BadRequestError('Unsupported update');
}
