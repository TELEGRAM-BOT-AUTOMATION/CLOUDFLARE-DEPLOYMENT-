export class State {
  constructor(private kv:KVNamespace){}
  get<T>(key:string):Promise<T|null>{return this.kv.get<T>(key,'json');}
  put<T>(key:string,value:T,ttlSeconds?:number):Promise<void>{return this.kv.put(key,JSON.stringify(value),ttlSeconds?{expirationTtl:ttlSeconds}:undefined);}
  delete(key:string):Promise<void>{return this.kv.delete(key);}
  list(prefix:string,limit=100,cursor?:string){return this.kv.list({prefix,limit,cursor});}
  async *listAll(prefix:string, pageSize=100){let cursor:string|undefined;do{const page=await this.list(prefix,pageSize,cursor);for(const key of page.keys)yield key.name;cursor=page.list_complete?undefined:page.cursor;}while(cursor);}
}
