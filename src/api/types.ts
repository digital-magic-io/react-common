import * as z from 'zod'

export const HttpMethod = z.enum(['get', 'post', 'put', 'patch', 'delete'])
export type HttpMethod = z.infer<typeof HttpMethod>
