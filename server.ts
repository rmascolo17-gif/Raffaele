import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Initialization of Gemini client
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey
    ? new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      })
    : null;

  // API endpoint to generate reports using Gemini
  app.post("/api/generate-report", async (req, res) => {
    try {
      const { year, month, data, customPrompt } = req.body;
      
      if (!ai) {
        return res.status(400).json({ 
          error: "GEMINI_API_KEY non configurata. Configurala per abilitare la generazione automatica dei report con l'AI o usa la chiave inserita nei segreti di AI Studio." 
        });
      }

      let prompt = `Sei un esperto Responsabile Qualità (Quality Manager) in un'azienda manifatturiera meccanica/elettronica. Analizza i dati delle Non Conformità (NC) forniti e genera un report di sintesi professionale in italiano in formato Markdown.\n\n`;
      prompt += `Periodo di analisi: ${month === "all" ? "Intero Anno" : "Mese " + month} / ${year}\n\n`;
      prompt += `Dati statistici riassuntivi del periodo:\n`;
      prompt += `- Totale NC: ${data.summary.totalCount}\n`;
      prompt += `- Costo Totale: €${data.summary.totalCost.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      prompt += `- NC Interne: ${data.summary.internaCount} (Costo: €${data.summary.internaCost.toLocaleString("it-IT")})\n`;
      prompt += `- NC Cliente: ${data.summary.clienteCount} (Costo: €${data.summary.clienteCost.toLocaleString("it-IT")})\n`;
      prompt += `- NC Fornitore: ${data.summary.fornitoreCount} (Costo: €${data.summary.fornitoreCost.toLocaleString("it-IT")})\n\n`;
      
      prompt += `Lista completa di tutte le Non Conformità registrate nel periodo:\n`;
      prompt += JSON.stringify(data.list, null, 2);
      
      prompt += `\n\nFornisci la tua analisi dettagliata e strutturata utilizzando le seguenti sezioni Markdown:\n`;
      prompt += `### 📊 SINTESI GENERALE\nStato dei fatti, andamento complessivo dei costi e frequenza delle non conformità.\n\n`;
      prompt += `### 🏭 ANALISI REPARTI E CRITICITÀ\nQuali reparti di produzione hanno riscontrato più criticità (in termini di numero di NC o impatto economico) e perché.\n\n`;
      prompt += `### 🔍 CORRELAZIONE CAUSE-EFFETTO\nAnalisi delle cause principali (es. errori di programmazione, specifiche errate, usura utensile) e del loro impatto.\n\n`;
      prompt += `### 🛠️ PIANO DI AZIONE CONSIGLIATO (Quality Action Plan)\nProponi almeno 3 o 4 azioni correttive pratiche ed operative, assegnando una priorità (Alta/Media/Bassa) e una stima dei benefici attesi.\n`;

      if (customPrompt) {
        prompt += `\n\nRichiesta aggiuntiva dell'utente da includere specificamente nell'analisi:\n"${customPrompt}"`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ report: response.text });
    } catch (error: any) {
      console.error("Error generating Gemini report:", error);
      res.status(500).json({ error: error?.message || "Errore sconosciuto nella generazione del report." });
    }
  });

  // Serve static assets or mount Vite dev server
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
