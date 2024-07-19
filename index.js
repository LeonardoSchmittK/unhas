import { createClient } from "@supabase/supabase-js";
import multer from "multer";
import path from "path";
import fs from "fs";
import e from "express";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import cors from "cors";
import { randomUUID } from "crypto";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = e();
app.use(cors());
const jsonParser = bodyParser.json();
const upload = multer({ dest: "uploads/" });

const supabaseAnon = process.env.ANON;
const supabaseUrl = process.env.URL;

const supabase = createClient(supabaseUrl, supabaseAnon);

app.get("/images/:name", async (req, res) => {
  const { name } = req.params;
  const { data, error } = await supabase.storage
    .from("unha")
    .download(`fotosUnhas/${name}`);

  if (error) {
    console.error("Error downloading image from Supabase:", error.message);
    return res.status(500).json({ error: error.message });
  }

  const filePath = path.join(__dirname, "downloads", name);
  fs.writeFileSync(filePath, Buffer.from(await data.arrayBuffer()));
  res.sendFile(filePath, () => {
    fs.unlinkSync(filePath); // Clean up the local file
  });
});

app.get("/images", async (req, res) => {
  const { data, error } = await supabase.storage
    .from("unha")
    .list("fotosUnhas", {
      limit: 100, // Limit to 100 images
      offset: 0, // Offset for pagination
    });

  if (error) {
    console.error("Error fetching images from Supabase:", error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ data });
});

app.post("/upload", upload.single("image"), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = path.join(__dirname, file.path);
  const fileBuffer = fs.readFileSync(filePath);

  const { data, error } = await supabase.storage
    .from("unha")
    .upload(`fotosUnhas/${file.originalname}`, fileBuffer);
  fs.unlinkSync(filePath); // Clean up the local file

  if (error) {
    console.log("redees");

    return res.status(200).json({ data });
  } else {
    return res.status(200).json({ data });
  }
});

app.post("/newNail", jsonParser, async (req, res) => {
  const dataToAdd = req.body;
  const { data, error } = await supabase.from("unhas").insert(dataToAdd);

  if (error) {
    console.error("error inserting data:", error);
  } else {
    res.status(200);
    console.log("data inserted successfully:", data);
  }
});

app.get("/getUrl/:name", (req, res) => {
  const name = req.params.name;
  const { data } = supabase.storage
    .from("unha")
    .getPublicUrl("fotosUnhas/" + name);

  console.log("DATA " + data.publicUrl);
});

// const { data, error } = await supabase
//   .from("unhas")
//   .insert({ id: 1, nome: "Azul Paris" });
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/unhas", async (req, res) => {
  const { data, error } = await supabase.from("unhas").select();

  if (error) {
    console.error("Error " + error);
  }
  res.status(200).json({ data });
});

app.delete("/unhas/:id", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from("unhas").delete().eq("id", id);
  if (error) {
    res.status(500).send("Did not deleted, error");
    return;
  }

  res.status(200).send("Nail succesfully deleted");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
