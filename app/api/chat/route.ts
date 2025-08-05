import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: NextRequest) {
  try {
    const { message, chatHistory } = await request.json()
    console.log(`📝 Received message: "${message}"`)

    // Strictly use the API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      console.error("❌ GEMINI_API_KEY is not set in environment variables.")
      return NextResponse.json({
        response:
          "Sorry, API key configuration problem hai. Please contact the developer to set up the Gemini API key.",
      })
    }

    console.log("🔑 Using API key (first 10 chars):", apiKey.substring(0, 10) + "...")

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.7,
      },
    })

    console.log("🤖 Model initialized successfully")

    // Very simple prompt
    const prompt = `You are Nexa, a friendly AI assistant for students. Reply in simple Hindi-English mix. Keep it very short (1-2 sentences only).

Student: ${message}
Nexa:`

    console.log("📤 Sending to Gemini API...")

    try {
      // Simple generation without timeout complexity
      const result = await model.generateContent(prompt)
      console.log("✅ Got response from Gemini")

      const response = result.response
      let reply = response.text().trim()

      console.log(`🤖 Raw response: "${reply}"`)

      // Simple cleanup
      reply = reply.replace(/[^\w\s\u0900-\u097F.,!?]/g, "").trim()

      // Limit to 30 words
      const words = reply.split(" ")
      if (words.length > 30) {
        reply = words.slice(0, 30).join(" ") + "..."
      }

      console.log(`📤 Final response: "${reply}"`)

      return NextResponse.json({ response: reply })
    } catch (apiError: any) {
      console.error("❌ Gemini API Error:", apiError.message)
      console.error("Error details:", apiError)

      // Check if it's an API key error specifically
      if (apiError.message?.includes("API key expired") || apiError.message?.includes("API_KEY_INVALID")) {
        return NextResponse.json({
          response: "API key expired ho gaya hai! Please developer ko bolke naya key set karwao. 😊",
        })
      }

      // Smart fallback based on message content
      const lowerMessage = message.toLowerCase()
      let fallbackResponse = "Main Nexa hun! Kya help chahiye?"

      if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
        fallbackResponse = "Hello! Main Nexa hun, aapka AI friend. Kaise ho?"
      } else if (lowerMessage.includes("name")) {
        fallbackResponse = "Mera naam Nexa hai! Kartik ne banaya hai mujhe."
      } else if (lowerMessage.includes("what")) {
        fallbackResponse = "Main students ki help karta hun. Kuch bhi puch sakte ho!"
      } else if (lowerMessage.includes("how")) {
        fallbackResponse = "Batao kya janna chahte ho? Main help karunga!"
      }

      console.log(`🔄 Using fallback: "${fallbackResponse}"`)
      return NextResponse.json({ response: fallbackResponse })
    }
  } catch (error: any) {
    console.error("💥 Critical Error:", error.message)
    console.error("Full error:", error)

    return NextResponse.json({
      response: "Main thoda confused hun! Phir se try karo please! 😊",
    })
  }
}
