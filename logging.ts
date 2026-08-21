export interface LogEvent { update_type?:string; update_id?:number; chat_id?:number; from_id?:number; command?:string; callback_action?:string; result:'ok'|'error'; error_classification?:string; duration_ms?:number; }
export function logEvent(event:LogEvent):void { console.log(JSON.stringify({ts:new Date().toISOString(),...event})); }
