import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import fs from 'fs';
import axios from "axios";
import FormData from "form-data";
import cloudinary from "../configs/cloudinary.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import { GoogleGenAI } from "@google/genai";



const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    // Check usage limits for free tier
    if (plan !== 'premium' && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue."
      });
    }

    // Safe token mapping
    const TOKEN_MAP = {
      400: 600,
      600: 900,
      800: 1200,
      1200: 1600,
    };


    const maxTokens = TOKEN_MAP[length] || 1200;
    // Call AI Model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // ✅ Gemini Pro
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: maxTokens,
      },
    });

    const content = response.text;

    // Save creation to database
    await sql`INSERT INTO creations (user_id, prompt, content, type) 
              VALUES (${userId}, ${prompt}, ${content}, 'article')`;

    // Increment usage count for non-premium users
    if (plan !== 'premium') {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1
        }
      });
    }

    // Send success response
    res.json({
      success: true,
      content
    });

  } catch (error) {
     console.error("FULL ERROR OBJECT:", error);
  console.error("ERROR NAME:", error?.name);
  console.error("ERROR MESSAGE:", error?.message);
  console.error("ERROR STACK:", error?.stack);

  res.status(500).json({
    success: false,
    message: error?.message || "Internal Server Error",
    });
  }
}

export const generateBlogTitle = async (req, res)=>{  
    try {  
    const { userId } = req.auth();  
    const { prompt} = req.body;  
    const plan = req.plan;  
    const free_usage = req.free_usage;  

    if(plan !== 'premium' && free_usage >= 10){  
    return res.json({ success: false, message: "Limit reached. Upgrade to continue."})  
    }  
    const response = await AI.chat.completions.create({
    model: "gemini-2.0-flash",
    messages: [{role: "user",content: prompt,}],
    temperature : 0.7,
    max_tokens: 100,
});  
const content = response.choices[0].message.content;
await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'blog-title')`;
if(plan !== 'premium'){  
        await clerkClient.users.updateUserMetadata(userId, {privateMetadata : { free_usage: free_usage + 1 }})   
}
res.json({ success: true, content })
} catch (error) {  
    console.log(error.message)
    res.json({ success: false, message: error.message })
}
}

export const generateImage = async (req, res)=>{  
    try {  
    const { userId } = req.auth();  
    const { prompt, publish } = req.body;  
    const plan = req.plan;    

    if(plan !== 'premium'){  
    return res.json({ success: false, message: "This feature is for premium users only."})  
    }  
    
    const formData = new FormData()
formData.append('prompt', prompt)
await axios.post("https://clipdrop-api.co/text-to-image/v1", formData, {
    headers: {'x-api-key': process.env.CLIPDROP_API_KEY},
    responseType:"arraybuffer",
})

const base64Image = `data: image/png;base64,${Buffer.from(data,'binary').toString('base64')}`;  

const {secure_url}=  await cloudinary.uploader.upload(base64Image)

await sql`INSERT INTO creations (user_id, prompt, content, type,publish) VALUES (${userId}, ${prompt}, ${secure_url}, 'image',${publish??false})`;
if(plan !== 'premium'){  
        await clerkClient.users.updateUserMetadata(userId, {privateMetadata : { free_usage: free_usage + 1 }})   
}
res.json({ success: true, content: secure_url })
} catch (error) {  
    console.log(error.message)
    res.json({ success: false, message: error.message })
}
}

export const removeImageBackground = async (req, res)=>{  
    try {  
    const { userId } = req.auth();  
    const image  = req.file;  
    const plan = req.plan;    

    if(plan !== 'premium'){  
    return res.json({ success: false, message: "This feature is for premium users only."})  
    }  
    


    const {secure_url}=  await cloudinary.uploader.upload(image.path,{
        transformation :[
            {
                effect:'background_removal',
                background_removal: 'remove_the_background'
            }
        ]
    })

await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, Remove background from image', ${secure_url}, 'image')`;

res.json({ success: true, content: secure_url })
} catch (error) {  
    console.log(error.message)
    res.json({ success: false, message: error.message })
}
}

export const removeImageObject = async (req, res)=>{  
    try {  
    const { userId } = req.auth();
    const {object}=req.body();  
    const image  = req.file;  
    const plan = req.plan;    

    if(plan !== 'premium'){  
    return res.json({ success: false, message: "This feature is for premium users only."})  
    }  
    


    const {public_id}=  await cloudinary.uploader.upload(image.path)
    const imageUrl = cloudinary.url(public_id, {
    transformation: [{effect:`gen_remove:${object}`}], 
    resource_type: 'image'
})

await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId},${`Removed ${object} from image`}, ${imageUrl}, 'image')`;

res.json({ success: true, content: imageUrl })
} catch (error) {  
    console.log(error.message)
    res.json({ success: false, message: error.message })
}
}

export const resumeReview = async (req, res)=>{  
    try {  
    const { userId } = req.auth();
    const resume = req.file;  
    const plan = req.plan;    

    if(plan !== 'premium'){  
    return res.json({ success: false, message: "This feature is for premium users only."})  
    }  
    
    if(resume.size > 5 * 1024 * 1024){  
        return res.json({ success: false, message: "File size exceeds 5MB limit."})  
    }

    const dataBuffer = fs.readFileSync(resume.path);
    const pdfData = await pdf(dataBuffer);

    const prompt =`Review the following resume and provide constructive
    feedback on its strengths, weaknesses, and areas for improvement. Resume
    Content: \n\n${pdfData. text}`;

    const response = await AI.chat.completions.create({
    model: "gemini-2.0-flash",
    messages: [{ role: "user", content: prompt, } ],
    temperature: 0.7,
    max_tokens: 1000,
    });

    const content = response.choices[0].message.content

await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId},'Review the uploaded resume', ${content}, 'resume-review')`;

res.json({ success: true, content})
} catch (error) {  
    console.log(error.message)
    res.json({ success: false, message: error.message })
}
}