import {enforceAtomicRateLimit} from '../platform/coordination';
import type {Env} from '../telegram/types';
export async function enforceRateLimit(env:Env,key:string,limit:number){await enforceAtomicRateLimit(env,key,limit);}
