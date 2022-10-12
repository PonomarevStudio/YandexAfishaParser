export default async ({body, query, cookies, headers}, {json}) => json({
    body,
    query,
    cookies,
    headers,
    env: process.env,
    versions: process.versions
})
