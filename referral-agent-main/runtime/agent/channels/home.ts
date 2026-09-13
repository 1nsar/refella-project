import { defineChannel, GET } from 'eve/channels';
export default defineChannel({ routes: [GET('/', async () => new Response(null, { status: 302, headers: { location: '/app' } }))] });
