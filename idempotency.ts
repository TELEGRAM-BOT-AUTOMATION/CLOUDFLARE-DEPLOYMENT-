type Entry = { status:'processing'|'completed'; token:string; updatedAt:number };
type Claim = { action:'process'|'duplicate'|'retry'; token:string };

export class IdempotencyDO {
  private readonly storage: DurableObjectStorage;
  constructor(ctx:DurableObjectState){this.storage=ctx.storage;}
  async fetch(request:Request):Promise<Response>{
    if(request.method!=='POST') return new Response('Method Not Allowed',{status:405});
    const url=new URL(request.url); const body=await request.json().catch(()=>({})) as {token?:string;leaseMs?:number}; const now=Date.now();
    if(url.pathname==='/claim'){
      const leaseMs=Math.min(Math.max(body.leaseMs??120_000,10_000),600_000); const current=await this.storage.get<Entry>('entry');
      if(!current){const token=crypto.randomUUID();await this.storage.put('entry',{status:'processing',token,updatedAt:now});return Response.json({action:'process',token} satisfies Claim);}
      if(current.status==='completed') return Response.json({action:'duplicate',token:current.token} satisfies Claim);
      if(now-current.updatedAt<leaseMs) return Response.json({action:'duplicate',token:current.token} satisfies Claim);
      const token=crypto.randomUUID();await this.storage.put('entry',{status:'processing',token,updatedAt:now});return Response.json({action:'retry',token} satisfies Claim);
    }
    if(url.pathname==='/complete'||url.pathname==='/failed'){
      const current=await this.storage.get<Entry>('entry');
      if(!body.token||!current||current.token!==body.token||current.status!=='processing') return Response.json({ok:false},{status:409});
      if(url.pathname==='/complete') await this.storage.put('entry',{status:'completed',token:current.token,updatedAt:now}); else await this.storage.delete('entry');
      return Response.json({ok:true});
    }
    return new Response('Not Found',{status:404});
  }
}
