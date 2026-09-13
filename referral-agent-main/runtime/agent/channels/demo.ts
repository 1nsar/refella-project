import { defineChannel, GET, POST } from 'eve/channels';
import { createDemoHandler } from '../../../src/demo/core';
import { runDemo } from '../lib/demo-model';

const handle = createDemoHandler(runDemo);
export default defineChannel({ routes: [
  GET('/api/demo/state', handle),
  ...['start', 'message', 'confirm', 'purchase'].map(action => POST(`/api/demo/${action}`, handle)),
] });
