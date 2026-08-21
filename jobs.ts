import {State} from './kv';
export interface Job {id:string;runAt:number;type:'sendMessage'|'closeTicket'|'broadcast';payload:Record<string,unknown>;enabled:boolean;lockedUntil?:number;lastError?:string;attempts?:number;}
export async function saveJob(s:State,j:Job){await s.put(`job:${j.id}`,j);}
export async function getDueJobs(s:State,limit=100){const jobs:Job[]=[];for await(const key of s.listAll('job:',100)){if(jobs.length>=limit)break;const j=await s.get<Job>(key);if(j?.enabled&&j.runAt<=Date.now())jobs.push(j);}return jobs;}
