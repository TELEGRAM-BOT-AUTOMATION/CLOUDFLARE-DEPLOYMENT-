import type {Env,TelegramUpdate} from '../telegram/types';
import {validateWebhookSecret,validateUpdateShape} from '../auth/authentication';
import {loadConfig} from '../config/config';
import {authorize} from '../auth/authorization';
import {enforceRateLimit} from '../auth/rate-limit';
import {telegram} from '../telegram/client';
import {routeUpdate} from '../router/update-router';
import {State} from '../state/kv';
import {claimUpdate,completeUpdate,abandonUpdate} from '../platform/coordination';
import {logEvent} from '../utils/logging';
import {normalizeError} from '../utils/errors';

export async function handleWebhook(request:Request,env:Env,ctx:ExecutionContext){
  const started=Date.now();
  if(request.method==='GET' && new URL(request.url).pathname==='/health') {
    if(env.HEALTH_TOKEN && request.headers.get('authorization')!==`Bearer ${env.HEALTH_TOKEN}`) return new Response('Unauthorized',{status:401});
    return healthResponse(env);
  }
  if(request.method!=='POST') return new Response('Method Not Allowed',{status:405,headers:{allow:'POST'}});
  if(!(request.headers.get('content-type')??'').toLowerCase().includes('application/json')) return new Response('Unsupported Media Type',{status:415});
  let update:TelegramUpdate|undefined; let guard:DurableObjectStub|undefined; let token:string|undefined;
  try {
    validateWebhookSecret(request,env);
    const body=await request.json(); validateUpdateShape(body); update=body as TelegramUpdate;
    const claimed=await claimUpdate(env,update.update_id); guard=claimed.stub; token=claimed.token;
    if(claimed.action==='duplicate') return new Response('OK');
    const config=loadConfig(env); const actor=authorize(update,config); const state=new State(env.STATE);
    if(actor.userId!==undefined) await enforceRateLimit(env,`user:${actor.userId}`,config.rateLimitPerUser);
    if(actor.chatId!==undefined) await enforceRateLimit(env,`chat:${actor.chatId}`,config.rateLimitPerChat);
    await routeUpdate(update,telegram(env),config,state,env,ctx);
    if(guard&&token) await completeUpdate(guard,token);
    logEvent({update_type:updateType(update),chat_id:actor.chatId,from_id:actor.userId,update_id:update.update_id,result:'ok',duration_ms:Date.now()-started});
    return new Response('OK');
  } catch(error){
    if(guard&&token) await abandonUpdate(guard,token).catch(()=>{});
    const e=normalizeError(error);
    logEvent({update_id:update?.update_id,result:'error',error_classification:e.code,duration_ms:Date.now()-started});
    return new Response(e.status===429?'Too Many Requests':e.status===403?'Forbidden':e.status===401?'Unauthorized':'Bad Request',{status:e.status});
  }
}

function healthResponse(_env:Env){return Response.json({ok:true,service:'teammarysy-bot',timestamp:new Date().toISOString()});}
function updateType(u:TelegramUpdate){if(u.callback_query)return 'callback_query';if(u.chat_join_request)return 'chat_join_request';if(u.edited_message)return 'edited_message';if(u.message)return 'message';return 'unknown';}
