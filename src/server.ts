import fastify from "fastify";

const app = fastify()

app.get('/', (req, res) => {
    return "DEU CERTO"
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
