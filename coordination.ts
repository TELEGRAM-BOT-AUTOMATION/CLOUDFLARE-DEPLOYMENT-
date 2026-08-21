import type {Env} from '../telegram/types';
import {RateLimitError} from '../utils/errors';

function shard(value:string, count:number):string {
  let h = 2166136261;
  for (let i=0;i<value.length;i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619);
  return String((h >>> 0) % count);
}

export async function claimUpdate(env:Env, updateId:number) {
  return claimIdempotencyKey(env, `update:${shard(String(updateId),32)}:${updateId}`);
}

export async function claimIdempotencyKey(env:Env, key:string) {
  const stub = env.IDEMPOTENCY.getByName(key);
  const response = await stub.fetch('https://do/claim', {method:'POST', body:JSON.stringify({key,leaseMs:120_000})});
  return {stub, ...(await response.json() as {action:'process'|'duplicate'|'retry';token:string})};
}

export async function completeUpdate(stub:DurableObjectStub, token:string) {
  await stub.fetch('https://do/complete', {method:'POST',body:JSON.stringify({token})});
}
export async function abandonUpdate(stub:DurableObjectStub, token:string) {
  await stub.fetch('https://do/failed', {method:'POST',body:JSON.stringify({token})});
}

export async function enforceAtomicRateLimit(env:Env, scope:string, limit:number) {
  const stub = env.COORDINATOR.getByName(`rate:${scope}`);
  const response = await stub.fetch('https://do/rate', {method:'POST',body:JSON.stringify({leaseMs:limit})});
  const result = await response.json() as {allowed:boolean;resetAt:number};
  if (!result.allowed) throw new RateLimitError();
}

export async function claimJob(env:Env, jobId:string, leaseMs=120_000) {
  const stub = env.COORDINATOR.getByName(`job:${jobId}`);
  const owner = crypto.randomUUID();
  const response = await stub.fetch('https://do/claim', {method:'POST',body:JSON.stringify({owner,leaseMs})});
  return {stub, owner, ...(await response.json() as {claimed:boolean;completed?:boolean})};
}
export async function completeJob(stub:DurableObjectStub, owner:string) {
  await stub.fetch('https://do/complete', {method:'POST',body:JSON.stringify({owner})});
}
export async function releaseJob(stub:DurableObjectStub, owner:string) {
  await stub.fetch('https://do/release', {method:'POST',body:JSON.stringify({owner})});
}
