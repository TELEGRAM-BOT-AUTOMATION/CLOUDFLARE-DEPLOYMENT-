import type {Env,InlineKeyboardMarkup,TelegramApiResponse} from './types';
export class TelegramError extends Error { constructor(public description:string,public errorCode:number,public parameters?:Record<string,unknown>){super(description);this.name='TelegramError';} }
export class TelegramClient {
  constructor(private token:string){}
  private async call<T>(method:string,payload:Record<string,unknown>):Promise<T>{
    let last:unknown;
    for(let attempt=0;attempt<4;attempt++){
      const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),10000);
      try{
        const response=await fetch(`https://api.telegram.org/bot${this.token}/${method}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
        const data=await response.json() as TelegramApiResponse<T>;
        if(response.ok&&data.ok)return data.result;
        const err=new TelegramError(data.description??'Telegram API error',data.error_code??response.status,data.parameters);
        if(!isRetryable(err,attempt))throw err;
        last=err;await sleep(retryDelay(err,attempt));
      }catch(error){
        last=error;
        if(error instanceof TelegramError){if(!isRetryable(error,attempt))throw error;}
        else if(attempt>=3)throw new TelegramError(error instanceof Error?error.message:'Telegram request failed',500);
        await sleep(500*Math.pow(2,attempt));
      }finally{clearTimeout(timeout);}
    }
    throw last instanceof TelegramError?last:new TelegramError('Telegram request failed after retries',500);
  }
  sendMessage(chat_id:number|string,text:string,reply_markup?:InlineKeyboardMarkup){return this.call('sendMessage',{chat_id,text,reply_markup});}
  sendPhoto(chat_id:number|string,photo:string,caption?:string,reply_markup?:InlineKeyboardMarkup){return this.call('sendPhoto',{chat_id,photo,caption,reply_markup});}
  editMessageText(chat_id:number|string,message_id:number,text:string,reply_markup?:InlineKeyboardMarkup){return this.call('editMessageText',{chat_id,message_id,text,reply_markup});}
  editMessageReplyMarkup(chat_id:number|string,message_id:number,reply_markup?:InlineKeyboardMarkup){return this.call('editMessageReplyMarkup',{chat_id,message_id,reply_markup});}
  answerCallbackQuery(callback_query_id:string,text?:string){return this.call('answerCallbackQuery',{callback_query_id,text});}
  deleteMessage(chat_id:number|string,message_id:number){return this.call('deleteMessage',{chat_id,message_id});}
  restrictChatMember(chat_id:number|string,user_id:number,permissions:Record<string,unknown>){return this.call('restrictChatMember',{chat_id,user_id,permissions});}
  approveChatJoinRequest(chat_id:number|string,user_id:number){return this.call('approveChatJoinRequest',{chat_id,user_id});}
  declineChatJoinRequest(chat_id:number|string,user_id:number){return this.call('declineChatJoinRequest',{chat_id,user_id});}
  sendPoll(chat_id:number|string,question:string,options:string[],extra:Record<string,unknown>={}){return this.call('sendPoll',{chat_id,question,options,...extra});}
  stopPoll(chat_id:number|string,message_id:number){return this.call('stopPoll',{chat_id,message_id});}
  setWebhook(url:string,secret_token:string,drop_pending_updates=false){return this.call('setWebhook',{url,secret_token,drop_pending_updates});}
  getWebhookInfo(){return this.call('getWebhookInfo',{});}
}
function isRetryable(err:TelegramError,attempt:number){return attempt<3&&(err.errorCode===429||err.errorCode>=500);}
function retryDelay(err:TelegramError,attempt:number){const retryAfter=Number(err.parameters?.retry_after);return Number.isFinite(retryAfter)&&retryAfter>0?Math.min(retryAfter*1000,30_000):Math.min(1000*Math.pow(2,attempt),8_000);}
function sleep(ms:number){return new Promise(r=>setTimeout(r,ms));}
export const telegram=(env:Env)=>new TelegramClient(env.TELEGRAM_BOT_TOKEN);
