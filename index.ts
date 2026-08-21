import type {Env} from './telegram/types';
import {handleWebhook} from './webhook/handler';
import {handleCron} from './cron/handler';
import {handleQueue} from './queue/handler';
import {IdempotencyDO} from './durable-objects/idempotency';
import {CoordinatorDO} from './durable-objects/coordinator';
export {IdempotencyDO,CoordinatorDO};

export default {
  fetch(request:Request,env:Env,ctx:ExecutionContext){return handleWebhook(request,env,ctx);},
  scheduled(_controller:ScheduledController,env:Env){return handleCron(env);},
  async queue(batch:MessageBatch<any>,env:Env){return handleQueue(batch as MessageBatch<any>,env);}
};
