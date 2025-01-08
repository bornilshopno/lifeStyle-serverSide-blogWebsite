require('dotenv').config()
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000

app.use(express.json())
app.use(cors({
  origin: ['http://localhost:5173', 'https://lifestyle-circuit.netlify.app'],
  credentials: true,
}))
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "unauthorised access" })
  }

  //verify the Token
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unathorised access" })
    }
    req.user = decoded;
    next();
  })


}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.pqwog.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// console.log(process.env.DB_user)
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
    // await client.connect();
    const database = client.db("blogDB");
    const blogCollection = database.collection("blogCollection");
    const commentCollection = database.collection("commentCollection");
    const wishCollection = database.collection("wishCollection")

    app.post("/blogs", async (req, res) => {
      const blog = req.body
      const result = await blogCollection.insertOne(blog);
      res.send(result)
    })

    //jwt auth related api

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1d" });

      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true })
    })

    app.post("/logout", (req, res) => {
      res
        .clearCookie('token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true })
    })

    app.post("/wishlist", async (req, res) => {
      const wish = req.body;
      const result = await wishCollection.insertOne(wish)
      res.send(result)
    })

    app.get("/myWishes", verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = {
        wishOf: email
      }
      if (req.user.email !== req.query.email) {
        //token email !== query email
        return res.status(403).send({ message: "forbidden access" })
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

    app.get("/allblogs", async (req, res) => {
      const filter = req.query.filter;
      const search = req.query.search;
      let query = { title: { $regex: search, $options: "i" }, }

      if (filter) query.category = filter;
      const result = await blogCollection.find(query).toArray();
      res.send(result)
    })


    app.get("/latest-blogs", async (req, res) => {
      const cursor = blogCollection.find().sort({ "_id": -1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result)
    })

    app.put("/blogs/:id", async (req, res) => {
      const id = req.params.id;
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

    app.delete("/wish/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await wishCollection.deleteOne(query);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server Running")
})


app.listen(port, () => { console.log(`server is running at port: ${port}`) })