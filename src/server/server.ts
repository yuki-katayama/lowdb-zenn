// server.ts
import express from "express";
import bodyParser from "body-parser"
import { createPost, deletePost, findPostByTitle, getPosts, updatePost } from "./database";

const PORT = 3000
const app = express();
app.use(bodyParser.json());

app.post('/create', async(req, res) => {
    await createPost(req.body.title)
    res.sendStatus(200);
})

app.get('/gets', async(req, res) => {
    const posts = await getPosts()
    res.status(200).send(posts)
})
app.get('/get/:title', async(req, res) => {
    const post = await findPostByTitle(req.params.title)
    res.status(200).send(post)
})

app.post('/delete', async(req, res) => {
    const posts = await deletePost(req.body.id)
    res.status(200).send(posts)
})

app.post('/update', async(req, res) => {
    const posts = await updatePost(req.body.id, req.body.title)
    res.status(200).send(posts)
})
app.listen(PORT, () => {
    console.log(`listening on PORT ${PORT}`)
});

