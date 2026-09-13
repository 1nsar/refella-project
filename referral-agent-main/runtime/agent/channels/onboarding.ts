import { defineChannel, GET, POST, OPTIONS } from 'eve/channels';
import { createOnboardingHandler } from '../../../src/onboarding/core';
import { runOnboarding } from '../lib/onboarding-model';

const handle = createOnboardingHandler(runOnboarding);
export default defineChannel({ routes: [
  GET('/api/onboarding/session', handle),
  ...['start', 'messages', 'confirm'].map(action => POST(`/api/onboarding/${action}`, handle)),
  ...['start', 'session', 'messages', 'confirm'].map(action => OPTIONS(`/api/onboarding/${action}`, handle)),
] });
