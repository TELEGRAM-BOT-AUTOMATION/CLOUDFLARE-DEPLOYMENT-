import type {Env,TelegramUpdate} from '../telegram/types';
import type {TelegramClient} from '../telegram/client';
import type {Config} from '../config/config';
import {panelHandler} from '../features/panel/handler';import {contentHandler} from '../features/content/handler';import {communityHandler} from '../features/community/handler';import {supportHandler} from '../features/support/handler';import {buttonsHandler} from '../features/buttons/handler';import {automationHandler} from '../features/automation/handler';import {scheduleHandler} from '../features/schedule/handler';import {broadcastHandler} from '../features/broadcast/handler';import {approvalsHandler} from '../features/approvals/handler';import {knowledgeHandler} from '../features/knowledge/handler';import {tasksHandler} from '../features/tasks/handler';import {pollsHandler} from '../features/polls/handler';
import {State} from '../state/kv';
import {unknownCommand} from '../telegram/messages';
function message(u:TelegramUpdate){return u.message??u.edited_message;}
function command(text?:string){if(!text)return undefined;return text.trim().split(/\s+/)[0]?.toLowerCase().split('@')[0];}
export async function routeUpdate(u:TelegramUpdate,b:TelegramClient,c:Config,state:State,env:Env,ctx:ExecutionContext){
  if(u.callback_query)return routeCallback(u,b,c,state,env,ctx);
  if(u.chat_join_request)return communityHandler(u,b,c,state,env);
  const m=message(u);if(!m)return;
  switch(command(m.text)){
    case '/start':return panelHandler(u,b,c,'start');case '/panel':return panelHandler(u,b,c,'panel');case '/content':return contentHandler(u,b,c);case '/support':return supportHandler(u,b,c,state,env,ctx);case '/community':return communityHandler(u,b,c,state,env);case '/buttons':return buttonsHandler(u,b,c);case '/automation':return automationHandler(u,b,c);case '/schedule':return scheduleHandler(u,b,c);case '/broadcast':return broadcastHandler(u,b,c);case '/approvals':return approvalsHandler(u,b,c);case '/knowledge':return knowledgeHandler(u,b,c);case '/tasks':return tasksHandler(u,b,c);case '/poll':case '/polls':return pollsHandler(u,b,c);
    default: if(m.text)return automationHandler(u,b,c); await b.sendMessage(m.chat.id,unknownCommand);
  }
}
async function routeCallback(u:TelegramUpdate,b:TelegramClient,c:Config,state:State,env:Env,ctx:ExecutionContext){const q=u.callback_query!;await b.answerCallbackQuery(q.id);const action=q.data??'';if(action==='start:support')return supportHandler(u,b,c,state,env,ctx);if(action==='start:home')return panelHandler(u,b,c,'start');if(action==='start:register'||action==='start:telegram'||action==='start:offers'||action==='start:app')return b.sendMessage(q.message!.chat.id,'This button is not configured. Contact an administrator.');if(action==='cancel'||action==='panel:home')return panelHandler(u,b,c,'panel');const feature=action.startsWith('panel:')?action.slice(6):'';switch(feature){case'content':return contentHandler(u,b,c);case'community':return communityHandler(u,b,c,state,env);case'support':return supportHandler(u,b,c,state,env,ctx);case'buttons':return buttonsHandler(u,b,c);case'automation':return automationHandler(u,b,c);case'schedule':return scheduleHandler(u,b,c);case'broadcast':return broadcastHandler(u,b,c);case'knowledge':return knowledgeHandler(u,b,c);case'tasks':return tasksHandler(u,b,c);case'polls':return pollsHandler(u,b,c);case'approvals':return approvalsHandler(u,b,c);default:return b.sendMessage(q.message!.chat.id,'Unknown action.');}}
