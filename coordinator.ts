type Lock = { owner: string; expiresAt: number; completed?: boolean };

export class CoordinatorDO {
  private readonly storage: DurableObjectStorage;
  constructor(ctx: DurableObjectState) { this.storage = ctx.storage; }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== 'POST') return new Response('Not Found', {status:404});
    const body = await request.json() as { action?: string; owner?: string; leaseMs?: number };
    const now = Date.now();
    if (url.pathname === '/rate') {
      const limit = Number(body.leaseMs ?? 30);
      const current = (await this.storage.get<{window:number,count:number}>('rate')) ?? {window:Math.floor(now/60_000),count:0};
      const window = Math.floor(now/60_000);
      const next = current.window === window ? current.count + 1 : 1;
      if (next > limit) return Response.json({allowed:false,count:current.count,resetAt:(window+1)*60_000});
      await this.storage.put('rate', {window,count:next});
      return Response.json({allowed:true,count:next,resetAt:(window+1)*60_000});
    }
    if (url.pathname === '/claim') {
      const owner = body.owner ?? crypto.randomUUID();
      const leaseMs = Math.min(Math.max(body.leaseMs ?? 120_000, 10_000), 600_000);
      const current = await this.storage.get<Lock>('lock');
      if (current?.completed) return Response.json({claimed:false,completed:true});
      if (current && current.expiresAt > now && current.owner !== owner) return Response.json({claimed:false});
      await this.storage.put('lock', {owner,expiresAt:now+leaseMs});
      return Response.json({claimed:true,owner,expiresAt:now+leaseMs});
    }
    if (url.pathname === '/complete') {
      const owner = body.owner;
      const current = await this.storage.get<Lock>('lock');
      if (!owner || !current || current.owner !== owner) return Response.json({ok:false}, {status:409});
      await this.storage.put('lock', {owner,expiresAt:now,completed:true});
      return Response.json({ok:true});
    }
    if (url.pathname === '/release') {
      const owner = body.owner;
      const current = await this.storage.get<Lock>('lock');
      if (!owner || !current || current.owner !== owner) return Response.json({ok:false}, {status:409});
      await this.storage.delete('lock');
      return Response.json({ok:true});
    }
    return new Response('Not Found', {status:404});
  }

  async rateLimit(limit:number) {
    const res = await this.fetch(new Request('https://do/rate',{method:'POST',body:JSON.stringify({leaseMs:limit})}));
    return res.json() as Promise<{allowed:boolean;count:number;resetAt:number}>;
  }
  async claim(owner:string, leaseMs=120_000) {
    const res = await this.fetch(new Request('https://do/claim',{method:'POST',body:JSON.stringify({owner,leaseMs})}));
    return res.json() as Promise<{claimed:boolean;completed?:boolean;owner?:string;expiresAt?:number}>;
  }
  async complete(owner:string) { await this.fetch(new Request('https://do/complete',{method:'POST',body:JSON.stringify({owner})})); }
  async release(owner:string) { await this.fetch(new Request('https://do/release',{method:'POST',body:JSON.stringify({owner})})); }
}
