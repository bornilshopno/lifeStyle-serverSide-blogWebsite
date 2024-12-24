const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000

app.use(express.json())
app.use(cors())

app.get("/", (req, res) => {
  res.send("Server Running")
})

//VxC4eawSIZ7Qb6vH
//blogDB



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.pqwog.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

console.log(process.env.DB_user)
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const database = client.db("blogDB");
    const blogCollection = database.collection("blogCollection");
    const commentCollection = database.collection("commentCollection");
    const wishCollection = database.collection("wishCollection")

    app.post("/blogs", async (req, res) => {
      const blog = req.body
      const result = await blogCollection.insertOne(blog);
      res.send(result)
    })

    app.post("/wishlist", async (req, res) => {
      const wish = req.body;
      const result = await wishCollection.insertOne(wish)
      res.send(result)
    })

    app.get("/myWishes", async (req, res) => {
      const email = req.query.email;
      const query = {
        wishOf: email
      }
      const result = await wishCollection.find(query).toArray()
      res.send(result);
    })

    app.post("/comments", async (req, res) => {
      const comment = req.body;
      const result = await commentCollection.insertOne(comment);
      res.send(result)
    })

    app.get("/comment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { blogID: id }
      const result = await commentCollection.find(query).toArray()
      res.send(result)
    })

    app.get("/blogs", async (req, res) => {
      const cursor = blogCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get("/blog/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await blogCollection.findOne(query)
      res.send(result)
    })

    app.put("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const updatedBlog = req.body;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          thumbnail: updatedBlog.thumbnail,
          title: updatedBlog.title,
          category: updatedBlog.category,
          shortDescription: updatedBlog.shortDescription,
          longDescription: updatedBlog.longDescription,
        }
      }
      const result = await blogCollection.updateOne(filter, updatedDoc, options)
      res.send(result)
    })

    app.delete("/wish/:id", async(req,res)=>{
      const id=req.params.id;
      const query={_id : new ObjectId(id)};
      const result=await wishCollection.deleteOne(query);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.listen(port, () => { console.log(`server is running at port: ${port}`) })