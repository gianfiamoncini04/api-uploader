import fastify from "fastify";
import cors from "@fastify/cors";
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { r2 } from './cloudflare';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { z } from "zod"
import { randomUUID } from "crypto";
import { PrismaClient } from '@prisma/client'
 
const app = fastify()

const prisma = new PrismaClient()

app.register(cors, {
    origin: '*',
})

app.post('/uploads', async (request) => {
    const uploadBodySchema = z.object({
        name: z.string().min(1),
        contentType: z.string().regex(/\w+\/[-+.\w]+/)
    })

    const {name, contentType} = uploadBodySchema.parse(request?.body)

    const fileKey = randomUUID().concat('-').concat(name)

    const signedUrl = await getSignedUrl(r2, 
        new PutObjectCommand({
            Bucket: 'uploader-app',
            Key: fileKey,
            ContentType: contentType,
        }),
        {expiresIn: 600} 
    )

    const file = await prisma.file.create({
        data: {
            name,
            contentType,
            key: fileKey,
        }
    })

    return {signedUrl, fileId: file.id}
})

app.get('/uploads/:id', async (request) => {
    const GetFileParam = z.object({
        id: z.string().cuid()
    })

    const {id} = GetFileParam.parse(request.params)

    const file = await prisma.file.findUniqueOrThrow({
        where: {
            id,
        }
    })

    const signedUrl = await getSignedUrl(r2, 
        new GetObjectCommand({
            Bucket: 'uploader-app',
            Key: file.key,
        }),
        {expiresIn: 600} 
    )

    return {signedUrl}
})

async function Start() {
    try{
        await app.listen({port: 3000})
        console.log("🔥 listening on port localhost:3000")
    }catch(err){
        process.exit(1)
    }
}

Start()
