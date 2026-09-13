import { eveChannel } from "eve/channels/eve";

export default eveChannel({
  // Only the verified messaging adapter may reach customer sessions.
  auth: [() => null],
});
