import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import { getPayload } from 'payload'
import React from 'react'
import { fileURLToPath } from 'url'

import config from '@/payload/payload.config'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  const fileURL = `vscode://file/${fileURLToPath(import.meta.url)}`

  return (
    <div className="flex flex-col justify-between items-center h-screen p-11 max-w-4xl mx-auto overflow-hidden max-[400px]:p-6">
      <div className="flex flex-col items-center justify-center flex-grow">
        <picture>
          <source srcSet="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-favicon.svg" />
          <Image
            alt="Payload Logo"
            height={65}
            src="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-favicon.svg"
            width={65}
          />
        </picture>
        {!user && (
          <h1 className="text-center my-10 text-6xl leading-[70px] font-bold max-lg:my-6 max-lg:text-[42px] max-lg:leading-[42px] max-md:text-[38px] max-md:leading-[38px] max-[400px]:text-[32px] max-[400px]:leading-[32px]">
            Welcome to your new project.
          </h1>
        )}
        {user && (
          <h1 className="text-center my-10 text-6xl leading-[70px] font-bold max-lg:my-6 max-lg:text-[42px] max-lg:leading-[42px] max-md:text-[38px] max-md:leading-[38px] max-[400px]:text-[32px] max-[400px]:leading-[32px]">
            Welcome back, {user.email}
          </h1>
        )}
        <div className="flex items-center gap-3">
          <a
            className="text-black bg-white border border-black no-underline py-1 px-2 rounded"
            href={payloadConfig.routes.admin}
            rel="noopener noreferrer"
            target="_blank"
          >
            Go to admin panel
          </a>
          <a
            className="text-white bg-black border border-white no-underline py-1 px-2 rounded"
            href="https://payloadcms.com/docs"
            rel="noopener noreferrer"
            target="_blank"
          >
            Documentation
          </a>
        </div>
      </div>
      <div className="flex items-center gap-2 max-lg:flex-col max-lg:gap-1.5">
        <p className="m-0">Update this page by editing</p>
        <a className="no-underline px-2 bg-gray-600 rounded" href={fileURL}>
          <code>app/(frontend)/page.tsx</code>
        </a>
      </div>
    </div>
  )
}
